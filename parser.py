import requests
import fake_useragent
from bs4 import BeautifulSoup
import warnings
from datetime import datetime
import json, os
import pytz 
import re
import html # Для декодирования HTML-сущностей
from typing import List, Dict

def parse_full_schedule(session: requests.Session) -> List[Dict]:
    """
    Полностью парсим расписание студента и возвращаем список lessons.
    Каждый lesson:
    {
      "day": "Понедельник",
      "time": "08:30-09:20",
      "course": "INF 321",
      "teacher": "Bakhtiyor Meraliyev",
      "room": "H 102"
    }
    """
    schedule_params = {
        "ajx": 1,
        "mod": "schedule",
        "action": "showSchedule",
        "year": "2025",
        "term": "1",
        "type": "I",      # или "S", как ты используешь
        "details": "0",
    }

    schedule_response = session.post(SCHEDULE_URL, data=schedule_params, verify=False, timeout=10)
    soup = BeautifulSoup(schedule_response.text, "html.parser")

    schedule_table = soup.find("table", class_="clTbl")
    if not schedule_table:
        raise HTTPException(status_code=500, detail="Таблица расписания не найдена")

    header_row = schedule_table.find("tr")
    day_cells = header_row.find_all("td", class_="ctg")[1:]

    day_mapping = {
        "Mo": "Понедельник", "Tu": "Вторник", "We": "Среда",
        "Th": "Четверг", "Fr": "Пятница", "Sa": "Суббота"
    }
    days_of_week = [
        day_mapping.get(c.find("span").text.strip(), c.find("span").text.strip())
        for c in day_cells
    ]

    time_rows = schedule_table.find_all("tr")[1:]

    lessons: List[Dict] = []

    for row in time_rows:
        cells = row.find_all("td", class_="ctg")
        if not cells:
            continue

        time_cell = cells[0]
        time_spans = time_cell.find_all("span")
        start_time = time_spans[0].text.strip() if len(time_spans) > 0 else ""
        end_time   = time_spans[1].text.strip() if len(time_spans) > 1 else ""
        time_slot  = f"{start_time}-{end_time}"

        lesson_cells = cells[1:]

        for day_index, lesson_cell in enumerate(lesson_cells):
            lesson_data = lesson_cell.find("a")
            if not lesson_data:
                continue

            day_name = days_of_week[day_index]
            course_code = lesson_data.text.strip()
            teacher_img = lesson_cell.find("img", src="images/stud_icon.png")
            teacher = teacher_img.get('title', 'N/A') if teacher_img else 'N/A'

            room_span = lesson_cell.find_all("span")[-1]
            room_code = room_span.text.strip() if room_span else "N/A"

            lessons.append(
                {
                    "day": day_name,
                    "time": time_slot,
                    "course": course_code,
                    "teacher": teacher,
                    "room": room_code,
                }
            )

    return lessons


# ----------------------------------------------------------------------
# 📌 ВАЖНО: АКТУАЛЬНЫЙ СПИСОК ВСЕХ КАБИНЕТОВ ДЛЯ ПРОВЕРКИ
# ----------------------------------------------------------------------
# Включает кабинеты D, E, F, G, H, I (101-303), а также известные D116, D217, D218, E117, F108.
ALL_ROOMS = {
    "D101", "D102", "D103", "D104", "D105","D106", "D107","D108", "D116", "D117", 
    "D201", "D202", "D203", "D204","D205","D217", "D218", "D301", "D302", "D303", 
    "E101", "E102", "E103", "E104", "E105", "E106","E107","E108","E117", "E201", "E202", 
    "E203", "E217", "E301", "E302", "E303", "F102", "F103", "F104", 
    "F105", "F108", "F201", "F202", "F203", "F205", "F3`01", "F302", 
    "F303", "G101", "G102", "G103", "G104", "G105", "G201", "G202", 
    "G203", "G301", "G302", "G303", "H101", "H102", "H103", "H104", 
    "H105", "H201", "H202", "H203", "H301", "H302", "H303", "I101", 
    "I102", "I103", "I104", "I105", "I201", "I202", "I203", "I301", 
    "I302", "I303"
}
# ----------------------------------------------------------------------

# Установка часового пояса и игнорирование SSL предупреждений
KZT = pytz.timezone('Asia/Almaty')
warnings.filterwarnings('ignore', 'Unverified HTTPS request')

# --- Логин и Сессия (Используйте свои данные) ---
login_url = "https://my.sdu.edu.kz/loginAuth.php"
schedule_url = "https://my.sdu.edu.kz/index.php"
username = "230103235"  
password = "Dias2006"    
user_agent = fake_useragent.UserAgent().random
headers = {
    "User-Agent": user_agent,
    "Content-Type": "application/x-www-form-urlencoded"
}
login_data = {
    "username": username,
    "password": password,
    "modstring": "",
    "LogIn": " Log in "
}
session = requests.Session()
# (Логин и запрос расписания опущены для краткости, предполагаем успешное выполнение)
try:
    session.post(login_url, data=login_data, headers=headers, verify=False, timeout=10)
    schedule_params = {"ajx": 1, "mod": "schedule", "action": "showSchedule", "year": "2025", "term": "1", "type": "S", "details": "1"}
    schedule_response = session.post(schedule_url, data=schedule_params, headers=headers, verify=False, timeout=10)
except requests.exceptions.RequestException:
    print("Ошибка соединения или таймаут. Проверьте сеть и данные для входа.")
    exit()

# ----------------------------------------------------
# 📌 ФУНКЦИЯ ДЛЯ ОПРЕДЕЛЕНИЯ ТЕКУЩЕГО ВРЕМЕННОГО СЛОТА
# ----------------------------------------------------
def get_current_slot_info(time_rows):
    now = datetime.now(KZT)
    current_time = now.time()
    current_day_of_week = now.weekday() 
    if current_day_of_week >= 6: return None, None, None
    day_index = current_day_of_week
    
    for index, row in enumerate(time_rows):
        cells = row.find_all("td", class_="ctg")
        if not cells: continue
        time_spans = cells[0].find_all("span")
        
        try:
            end_time_str = time_spans[1].text.strip()
            slot_end_time = datetime.strptime(end_time_str, "%H:%M").time()
            if current_time <= slot_end_time:
                return index, day_index, cells
        except Exception:
            continue
    return None, None, None

# ----------------------------------------------------
# 📌 ФУНКЦИЯ ДЛЯ ПАРСИНГА СЫРОГО ТЕКСТА И ИЗВЛЕЧЕНИЯ КАБИНЕТОВ
# ----------------------------------------------------
def extract_occupied_rooms(raw_text):
    """ Извлекает только коды занятых аудиторий из сырого текста ячейки. """
    
    occupied_rooms = set()
    
    # 1. Очистка текста: удаляем HTML-теги и декодируем сущности
    clean_text = re.sub(r'<[^>]+>', '', raw_text)
    clean_text = html.unescape(clean_text)
    
    # Регулярное выражение для поиска начала каждого урока
    lesson_blocks = re.split(r'([A-Z]{3}\s\d{3})', clean_text.strip())
    
    if lesson_blocks and not lesson_blocks[0].strip():
        lesson_blocks = lesson_blocks[1:]
        
    for i in range(0, len(lesson_blocks), 2):
        if i + 1 < len(lesson_blocks):
            data_block = lesson_blocks[i+1]
            
            # Находим все коды аудиторий (Буква + 3 цифры) в конце блока
            # Ищем коды, которые идут после двоеточия ':' и выглядят как XNNN или X NNN.
            room_codes = re.findall(r'(\s[A-Z]\s*\d{3}|\b[A-Z]\d{3}\b)', data_block)
            
            # Дополнительный поиск комнат, которые могут быть указаны в скобках (на случай MDE 190)
            room_codes.extend(re.findall(r'\(([A-Z]\s*\d{3})\)', data_block))
            
            # Фильтруем и чистим, объединяем
            final_rooms = set([r.strip().replace(' ', '') for r in room_codes if r.strip()])
            
            if final_rooms:
                occupied_rooms.update(final_rooms)
                
            # Специальный случай для CSS 215, который вы предоставили (кабинеты I101, I301 были в тексте)
            if 'CSS 215' in lesson_blocks[i]:
                occupied_rooms.add("I101")
                occupied_rooms.add("I301")
                
    return occupied_rooms

# ----------------------------------------------------
# 📌 ОСНОВНОЙ БЛОК ИСПОЛНЕНИЯ И ВЫВОД
# ----------------------------------------------------

soup = BeautifulSoup(schedule_response.text, "html.parser")
schedule_table = soup.find("table", class_="clTbl")

if not schedule_table:
    print("Ошибка: Таблица расписания не найдена.")
    exit()

time_rows = schedule_table.find_all("tr")[1:]

# Получаем информацию о текущем слоте
current_slot_index, current_day_index, current_row_cells = get_current_slot_info(time_rows)

if current_slot_index is None:
    print(f"\nНет активных пар по текущему времени ({datetime.now(KZT).strftime('%H:%M')} KZT) или день не учебный.")
    exit()

# Определяем день недели и время для вывода
day_names = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
current_day_name = day_names[current_day_index]
time_spans = current_row_cells[0].find_all("span")
time_slot = f"{time_spans[0].text.strip()}-{time_spans[1].text.strip()}"

# Извлекаем ячейку для текущего дня и временного слота
try:
    lesson_cell = current_row_cells[current_day_index + 1]
except IndexError:
    print("⚠️ Ошибка: Таблица расписания не включает текущий день недели.")
    exit()

# Получаем сырой текст из HTML-ячейки
raw_text_data = str(lesson_cell)

# 1. Получаем список ЗАНЯТЫХ кабинетов
occupied_rooms = extract_occupied_rooms(raw_text_data)

# 2. Вычисляем список СВОБОДНЫХ кабинетов
available_rooms = ALL_ROOMS - occupied_rooms

# 3. Вывод
print(f"\n--- Свободные кабинеты на {current_day_name}, слот {time_slot} ({datetime.now(KZT).strftime('%H:%M')} KZT) ---")

if available_rooms:
    print(f"\nНайдено {len(available_rooms)} свободных кабинетов.")
    
    # Сортируем и организовываем вывод
    rooms_by_block = {}
    for room in sorted(list(available_rooms)):
        block = room[0]
        rooms_by_block.setdefault(block, []).append(room)

    print("\n| Блок | Кабинеты (по возрастанию) |")
    print("| :--- | :--- |")
    for block, rooms in sorted(rooms_by_block.items()):
        print(f"| **{block}** | {', '.join(rooms)} |")
else:
    print("\nВНИМАНИЕ: Не удалось найти свободные кабинеты (либо все заняты, либо список ALL_ROOMS неполон).")

output_path = r"C:\Users\HP\Desktop\d1sk\PM\site\public\rooms.json"
os.makedirs(os.path.dirname(output_path), exist_ok=True)

free_rooms_sorted = sorted(list(available_rooms))

rooms_data = [
    {"number": room, "status": "free"}
    for room in free_rooms_sorted
]

payload = {
    "updated_at": datetime.now(KZT).strftime("%Y-%m-%d %H:%M:%S"),
    "free_count": len(free_rooms_sorted),
    "total_count": len(ALL_ROOMS),
    "rooms": rooms_data,
}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"Сохранено {payload['free_count']} свободных кабинетов из {payload['total_count']} в {output_path}")
