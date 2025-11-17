# server.py

import os
import re
import json
import html
import warnings
from datetime import datetime
from typing import Optional, List, Dict, Set

import requests
import fake_useragent
import pytz
from bs4 import BeautifulSoup

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ------------------------------------------------------
#  Общие настройки
# ------------------------------------------------------

KZT = pytz.timezone("Asia/Almaty")
warnings.filterwarnings("ignore", "Unverified HTTPS request")

LOGIN_URL = "https://my.sdu.edu.kz/loginAuth.php"
SCHEDULE_URL = "https://my.sdu.edu.kz/index.php"
INDEX_URL = "https://my.sdu.edu.kz/index.php"

# ✔ Путь, куда будем сохранять rooms.json (поменяй под свой проект, если нужно)
ROOMS_JSON_PATH = r"C:\Users\HP\Desktop\d1sk\PM\site\public\rooms.json"

# ------------------------------------------------------
#  Список всех кабинетов
# ------------------------------------------------------

ALL_ROOMS: Set[str] = {
    "D101", "D102", "D103", "D104", "D105", "D116", "D117",
    "D201", "D202", "D203", "D217", "D218", "D301", "D302", "D303",
    "E101", "E102", "E103", "E104", "E105", "E117",
    "E201", "E202", "E203", "E217", "E301", "E302", "E303",
    "F102", "F103", "F104", "F105", "F108",
    "F201", "F202", "F203", "F205", "F301", "F302", "F303",
    "G101", "G102", "G103", "G104", "G105",
    "G201", "G202", "G203", "G301", "G302", "G303",
    "H101", "H102", "H103", "H104", "H105",
    "H201", "H202", "H203", "H301", "H302", "H303",
    "I101", "I102", "I103", "I104", "I105",
    "I201", "I202", "I203", "I301", "I302", "I303",
}

# ------------------------------------------------------
#  Модели запросов / ответов для API
# ------------------------------------------------------

class LoginRequest(BaseModel):
    studentId: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    studentId: Optional[str]
    studentName: Optional[str]
    message: str


class RoomsResponse(BaseModel):
    success: bool
    studentId: Optional[str]
    studentName: Optional[str]
    dayName: Optional[str]
    timeSlot: Optional[str]
    nowTime: Optional[str]
    freeRooms: List[Dict[str, str]]
    message: str


# ------------------------------------------------------
#  Вспомогательные функции
# ------------------------------------------------------

def create_session() -> requests.Session:
    """Создаём сессию с рандомным User-Agent."""
    session = requests.Session()
    user_agent = fake_useragent.UserAgent().random
    session.headers.update({
        "User-Agent": user_agent,
        "Content-Type": "application/x-www-form-urlencoded",
    })
    return session


def login_to_sdu(student_id: str, password: str) -> requests.Session:
    """Логинимся в my.sdu.edu.kz и возвращаем сессию."""
    session = create_session()
    login_data = {
        "username": student_id,
        "password": password,
        "modstring": "",
        "LogIn": " Log in ",
    }

    try:
        resp = session.post(LOGIN_URL, data=login_data, verify=False, timeout=10)
    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Проблемы с соединением с my.sdu.edu.kz",
        )

    # Проверим по расписанию, что реально залогинились
    schedule_params = {
        "ajx": 1,
        "mod": "schedule",
        "action": "showSchedule",
        "year": "2025",
        "term": "1",
        "type": "S",
        "details": "1",
    }

    try:
        schedule_resp = session.post(
            SCHEDULE_URL, data=schedule_params, verify=False, timeout=10
        )
    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Не удалось получить расписание после логина",
        )

    soup = BeautifulSoup(schedule_resp.text, "html.parser")
    if not soup.find("table", class_="clTbl"):
        raise HTTPException(status_code=401, detail="Неверный ID или пароль")

    return session


def get_student_name(session: requests.Session) -> Optional[str]:
    """Пробуем вытащить имя студента с главной страницы."""
    try:
        resp = session.get(INDEX_URL, verify=False, timeout=10)
    except requests.exceptions.RequestException:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Пробуем разные варианты (нужно подстроить под реальную разметку)
    cand = soup.find("span", id="username")
    if cand and cand.text.strip():
        return cand.text.strip()

    cand = soup.find("div", class_="user-name")
    if cand and cand.text.strip():
        return cand.text.strip()

    possible_classes = ["profile-name", "navbar-username", "user-name-text"]
    for cls in possible_classes:
        cand = soup.find(class_=cls)
        if cand and cand.text.strip():
            return cand.text.strip()

    # Фолбэк — грубый поиск в тексте страницы
    text = soup.get_text(" ", strip=True)
    m = re.search(r"Welcome,\s+([A-ZА-ЯЁ][^,(]+)", text)
    if m:
        return m.group(1).strip()

    return None


def get_current_slot_info(time_rows) -> tuple[Optional[int], Optional[int], Optional[list]]:
    """Определяем текущий временной слот и день недели по таблице."""
    now = datetime.now(KZT)
    current_time = now.time()
    current_day_of_week = now.weekday()  # 0 = Пн, 5 = Сб, 6 = Вс

    if current_day_of_week >= 6:
        return None, None, None

    day_index = current_day_of_week

    for index, row in enumerate(time_rows):
        cells = row.find_all("td", class_="ctg")
        if not cells:
            continue

        time_spans = cells[0].find_all("span")
        if len(time_spans) < 2:
            continue

        try:
            end_time_str = time_spans[1].text.strip()
            slot_end_time = datetime.strptime(end_time_str, "%H:%M").time()
            if current_time <= slot_end_time:
                return index, day_index, cells
        except Exception:
            continue

    return None, None, None


def extract_occupied_rooms(raw_text: str) -> Set[str]:
    """
    Извлекает коды занятых аудиторий из сырого HTML текста ячейки.
    Логика взята из твоего парсера.
    """
    occupied_rooms: Set[str] = set()

    # 1. Очистка от HTML
    clean_text = re.sub(r"<[^>]+>", "", raw_text)
    clean_text = html.unescape(clean_text)

    # Разбиваем по блокам вида "ABC 123"
    lesson_blocks = re.split(r"([A-Z]{3}\s\d{3})", clean_text.strip())

    if lesson_blocks and not lesson_blocks[0].strip():
        lesson_blocks = lesson_blocks[1:]

    for i in range(0, len(lesson_blocks), 2):
        if i + 1 >= len(lesson_blocks):
            continue

        data_block = lesson_blocks[i + 1]

        room_codes = re.findall(r"(\s[A-Z]\s*\d{3}|\b[A-Z]\d{3}\b)", data_block)
        room_codes.extend(re.findall(r"\(([A-Z]\s*\d{3})\)", data_block))

        final_rooms = {
            r.strip().replace(" ", "") for r in room_codes if r.strip()
        }

        if final_rooms:
            occupied_rooms.update(final_rooms)

        # Специальный случай для CSS 215 (если нужно)
        if "CSS 215" in lesson_blocks[i]:
            occupied_rooms.add("I101")
            occupied_rooms.add("I301")

    return occupied_rooms


def get_free_rooms_for_now(session: requests.Session) -> RoomsResponse:
    """Основная логика: достаём расписание, находим свободные кабинеты прямо сейчас."""

    schedule_params = {
        "ajx": 1,
        "mod": "schedule",
        "action": "showSchedule",
        "year": "2025",
        "term": "1",
        "type": "S",
        "details": "1",
    }

    try:
        schedule_resp = session.post(
            SCHEDULE_URL, data=schedule_params, verify=False, timeout=10
        )
    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Не удалось получить расписание",
        )

    soup = BeautifulSoup(schedule_resp.text, "html.parser")
    schedule_table = soup.find("table", class_="clTbl")

    if not schedule_table:
        raise HTTPException(
            status_code=500,
            detail="Таблица расписания не найдена",
        )

    time_rows = schedule_table.find_all("tr")[1:]

    current_slot_index, current_day_index, current_row_cells = get_current_slot_info(
        time_rows
    )

    if current_slot_index is None:
        now_str = datetime.now(KZT).strftime("%H:%M")
        return RoomsResponse(
            success=True,
            studentId=None,
            studentName=None,
            dayName=None,
            timeSlot=None,
            nowTime=now_str,
            freeRooms=[],
            message=f"Нет активных пар по текущему времени ({now_str} KZT) или сегодня не учебный день.",
        )

    day_names = [
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
    ]
    current_day_name = day_names[current_day_index]

    time_spans = current_row_cells[0].find_all("span")
    time_slot = f"{time_spans[0].text.strip()}-{time_spans[1].text.strip()}"

    try:
        lesson_cell = current_row_cells[current_day_index + 1]
    except IndexError:
        raise HTTPException(
            status_code=500,
            detail="Ошибка: таблица расписания не включает текущий день недели",
        )

    raw_text_data = str(lesson_cell)

    occupied_rooms = extract_occupied_rooms(raw_text_data)
    available_rooms = sorted(list(ALL_ROOMS - occupied_rooms))

    rooms_data = [{"number": room, "status": "free"} for room in available_rooms]

    # Сохраняем в rooms.json
    os.makedirs(os.path.dirname(ROOMS_JSON_PATH), exist_ok=True)
    with open(ROOMS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(rooms_data, f, ensure_ascii=False, indent=2)

    now_str = datetime.now(KZT).strftime("%H:%M")

    msg = f"Найдено {len(rooms_data)} свободных кабинетов на {current_day_name}, слот {time_slot} ({now_str} KZT)."

    return RoomsResponse(
        success=True,
        studentId=None,
        studentName=None,
        dayName=current_day_name,
        timeSlot=time_slot,
        nowTime=now_str,
        freeRooms=rooms_data,
        message=msg,
    )


# ------------------------------------------------------
#  FastAPI приложение
# ------------------------------------------------------

app = FastAPI()

# Разрешаем CORS для фронта
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # можешь указать конкретный origin типа "http://localhost:5173"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/login", response_model=LoginResponse)
def api_login(payload: LoginRequest):
    """
    Логинимся в my.sdu.edu.kz, проверяем расписание,
    вытаскиваем имя студента и возвращаем его.
    """
    session = login_to_sdu(payload.studentId, payload.password)

    student_name = get_student_name(session)
    if not student_name:
        student_name = f"Студент {payload.studentId}"

    return LoginResponse(
        success=True,
        studentId=payload.studentId,
        studentName=student_name,
        message="Успешная авторизация",
    )


@app.post("/api/rooms", response_model=RoomsResponse)
def api_rooms(payload: LoginRequest):
    """
    Логин по студенту + расчёт свободных кабинетов на текущую пару.
    Плюс сохраняем rooms.json.
    """
    session = login_to_sdu(payload.studentId, payload.password)
    student_name = get_student_name(session) or f"Студент {payload.studentId}"

    rooms_info = get_free_rooms_for_now(session)
    rooms_info.studentId = payload.studentId
    rooms_info.studentName = student_name

    return rooms_info
