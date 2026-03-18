import warnings
import requests
import fake_useragent
from bs4 import BeautifulSoup
from dataclasses import dataclass, asdict
from typing import Optional, Dict
import getpass
import os
from dotenv import load_dotenv

# Отключаем ворнинги про SSL
warnings.filterwarnings("ignore", "Unverified HTTPS request")

# Загружаем переменные из .env файла
load_dotenv()

LOGIN_URL = os.getenv("LOGIN_URL", "https://my.sdu.edu.kz/loginAuth.php")
HOME_URL = os.getenv("INDEX_URL", "https://my.sdu.edu.kz/index.php")


@dataclass
class StudentProfile:
    student_number: Optional[str] = None
    fullname: Optional[str] = None
    fullname_native: Optional[str] = None
    birth_date: Optional[str] = None
    program_class: Optional[str] = None
    advisor: Optional[str] = None
    status: Optional[str] = None
    last_order: Optional[str] = None
    balance: Optional[str] = None
    ent_exam_score: Optional[str] = None
    grant_type: Optional[str] = None
    email: Optional[str] = None
    last_login: Optional[str] = None
    registration_date: Optional[str] = None
    photo_url: Optional[str] = None


# ---------- ЛОГИН ----------


def login_and_get_session(student_id: str, password: str) -> requests.Session:
    """
    Логинимся в my.sdu.edu.kz и возвращаем сессию.
    """
    session = requests.Session()
    ua = fake_useragent.UserAgent().random

    headers = {
        "User-Agent": ua,
        "Content-Type": "application/x-www-form-urlencoded",
    }

    login_data = {
        "username": student_id,
        "password": password,
        "modstring": "",
        "LogIn": " Log in ",
    }

    resp = session.post(
        LOGIN_URL, data=login_data, headers=headers, verify=False, timeout=10
    )

    # Простая проверка (можно улучшать при желании)
    if "Student Information System" not in resp.text and "Home page" not in resp.text:
        # Иногда после логина сразу редиректит на index.php, так что этого может не быть
        # Поэтому лучше дополнительно проверить домашнюю страницу:
        home = session.get(HOME_URL, verify=False, timeout=10)
        if "Home page" not in home.text:
            raise RuntimeError("Не удалось залогиниться. Проверь ID и пароль.")

    return session


# ---------- ЗАБРАТЬ HOME PAGE ----------


def get_home_html(session: requests.Session) -> str:
    resp = session.get(HOME_URL, verify=False, timeout=10)
    resp.raise_for_status()
    return resp.text


# ---------- ПАРСИНГ ----------


def parse_profile_from_home(html: str) -> StudentProfile:
    soup = BeautifulSoup(html, "html.parser")
    profile = StudentProfile()

    # 1) Фото: <img src="stud_photo.php?...">
    img = soup.find("img", src=lambda s: s and "stud_photo.php" in s)
    if img and img.get("src"):
        src = img["src"].strip()
        if src.startswith("/"):
            src = "https://my.sdu.edu.kz" + src
        else:
            # относительный путь без / в начале
            src = "https://my.sdu.edu.kz/" + src
        profile.photo_url = src

    # 2) Таблица с данными студента: <table class="clsTbl" style="width:auto">
    # В твоём HTML она первая такая в модуле.
    main_table = None
    for tbl in soup.find_all("table", class_="clsTbl"):
        # ищем внутри строку "Student №"
        if tbl.find(string=lambda t: t and "Student №" in t):
            main_table = tbl
            break

    if not main_table:
        # Если вдруг не нашли, просто выходим — всё остальное будет None
        return profile

    # Проходим по всем строкам этой таблицы
    rows = main_table.find_all("tr")

    for tr in rows:
        tds = tr.find_all("td", class_="clsTd")
        if len(tds) < 2:
            continue

        label = tds[0].get_text(" ", strip=True)
        value_td = tds[1]

        # Значение — весь текст внутри второй ячейки
        value_text = value_td.get_text(" ", strip=True)

        # Маппим лейблы на поля
        if label.startswith("Student №"):
            profile.student_number = value_text

        elif label.startswith("Fullname :"):
            profile.fullname = value_text

        elif label.startswith("Fullname(native)"):
            profile.fullname_native = value_text

        elif label.startswith("Birth date"):
            profile.birth_date = value_text

        elif label.startswith("Program / Class"):
            profile.program_class = value_text

        elif label.startswith("Advisor"):
            profile.advisor = value_text

        elif label.startswith("Status"):
            profile.status = value_text

        elif label.startswith("Last Order"):
            # там внутри ещё <br> с казахским текстом — берем всё
            profile.last_order = value_text

        elif label.strip().startswith("Balance"):
            # целиком, вместе с годом/семестром и суммой
            profile.balance = value_text

        elif label.startswith("ENT exam score"):
            profile.ent_exam_score = value_text

        elif label.startswith("Grant type"):
            profile.grant_type = value_text

        elif label.startswith("Email"):
            profile.email = value_text

        elif label.startswith("Last login date"):
            profile.last_login = value_text

        elif label.startswith("Registration date"):
            profile.registration_date = value_text

    return profile


def get_profile(student_id: str, password: str) -> StudentProfile:
    session = login_and_get_session(student_id, password)
    html = get_home_html(session)
    return parse_profile_from_home(html)


# ---------- MAIN ----------

if __name__ == "__main__":
    print("=== SDU my.sdu.edu.kz profile parser ===")
    sid = input("Студенческий ID: ").strip()
    pwd = getpass.getpass("Пароль: ")

    try:
        prof = get_profile(sid, pwd)
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
    else:
        print("\n✅ Данные профиля:")
        data: Dict[str, Optional[str]] = asdict(prof)
        for k, v in data.items():
            print(f"  {k}: {v}")
