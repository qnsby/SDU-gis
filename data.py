import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import warnings
import os
from dotenv import load_dotenv

warnings.filterwarnings("ignore")

# Загружаем переменные из .env файла
load_dotenv()

login_url = os.getenv("LOGIN_URL", "https://my.sdu.edu.kz/loginAuth.php")
main_url = os.getenv("INDEX_URL", "https://my.sdu.edu.kz/index.php")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
    "Content-Type": "application/x-www-form-urlencoded",
}

# Учетные данные загружаются из .env файла
login_data = {
    "username": os.getenv("SDU_USERNAME", "230103235"),
    "password": os.getenv("SDU_PASSWORD", "Dias2006"),
    "modstring": "",
    "LogIn": " Log in ",
}

session = requests.Session()

# --- 1. ЛОГИН ---
resp_login = session.post(login_url, data=login_data, headers=headers, verify=False)
print("Login status code:", resp_login.status_code)
print("Cookies:", session.cookies.get_dict())

# --- 2. ГЛАВНАЯ СТРАНИЦА ---
resp_main = session.get(main_url, headers=headers, verify=False)
print("Main status code:", resp_main.status_code)

soup = BeautifulSoup(resp_main.text, "html.parser")

# --- 3. ФИО: ищем строку таблицы, где написано 'Fullname : '
full_name = None

fullname_label_td = soup.find(
    "td", string=lambda s: isinstance(s, str) and "Fullname :" in s
)

if fullname_label_td:
    value_td = fullname_label_td.find_next_sibling("td")
    if value_td:
        b_tag = value_td.find("b")
        full_name = (
            b_tag.get_text(strip=True) if b_tag else value_td.get_text(strip=True)
        )

first_name = None
last_name = None

if full_name:
    parts = full_name.split()
    if len(parts) >= 2:
        first_name, last_name = parts[0], parts[1]
    else:
        first_name = full_name

# --- 4. ФОТО: ищем <img src="stud_photo.php?...">
photo_img = soup.find(
    "img", src=lambda s: isinstance(s, str) and s.startswith("stud_photo.php")
)

photo_url = None
if photo_img and photo_img.get("src"):
    photo_url = urljoin(main_url, photo_img["src"])

# --- 5. ВЫВОД ---
print("Полное имя:", full_name)
print("Имя:", first_name)
print("Фамилия:", last_name)
print("URL фото:", photo_url)

# --- 6. (опционально) скачать фото в файл ---
if photo_url:
    resp_photo = session.get(photo_url, headers=headers, verify=False)
    if resp_photo.status_code == 200:
        with open("user_photo.jpg", "wb") as f:
            f.write(resp_photo.content)
        print("Фото сохранено как user_photo.jpg")
    else:
        print("Не удалось скачать фото, статус:", resp_photo.status_code)
