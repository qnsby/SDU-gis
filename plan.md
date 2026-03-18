# План запуска проекта SDU GIS

## Что нужно заранее

- `Node.js` 18+ и `npm`
- `Python` 3.10+ 
- интернет, потому что бэкенд обращается к `MongoDB Atlas` и `my.sdu.edu.kz`

## Где запускать

Открой терминал в папке проекта:

```powershell
cd "*path*\SDU-gis"
```

## Конфигурация окружения

### Создай `.env` файл

1. Скопируй `.env.example` в новый файл `.env`:

```powershell
Copy-Item .env.example .env
```

2. Заполни переменные в `.env`:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://230103235_db_user:diaskon@gistar.mbnl82j.mongodb.net/
MONGO_DB_NAME=sdu_gis

# SDU Portal URLs
LOGIN_URL=https://my.sdu.edu.kz/loginAuth.php
SCHEDULE_URL=https://my.sdu.edu.kz/index.php
INDEX_URL=https://my.sdu.edu.kz/index.php
TRANSCRIPT_URL=https://my.sdu.edu.kz/index.php?mod=transkript

# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=False

# SDU Credentials
SDU_USERNAME=230103235
SDU_PASSWORD=Dias2006
```

**⚠️ Важно:** `.env` не добавляется в Git (в `.gitignore`), поскольку содержит секретные данные!

## Установка зависимостей

### Frontend

Если `node_modules` еще не установлен:

```powershell
npm install
```

### Python backend

Если виртуальное окружение еще не создано:

```powershell
python -m venv venv
```

Активируй окружение:

```powershell
.\venv\Scripts\Activate.ps1
```

Установи Python-зависимости (включая `python-dotenv`):

```powershell
pip install -r requirements.txt
```

## Как запускать

**⚠️ Убедись, что `.env` файл настроен перед запуском!**

Проект лучше запускать в 3 отдельных терминалах.

### 1. Запуск FastAPI backend

```powershell
cd "c:\Users\acer\Desktop\d1sk\SDU gis\SDU-gis"
.\venv\Scripts\Activate.ps1
uvicorn auth_server:app --reload --host 127.0.0.1 --port 8000
```

Backend автоматически загружает переменные из `.env` файла при старте.

Backend будет доступен на:

```text
http://localhost:8000
```

### 2. Запуск parser server

```powershell
cd "c:\Users\acer\Desktop\d1sk\SDU gis\SDU-gis"
node run-parser-server.js
```

Parser server будет доступен на:

```text
http://localhost:7777
```

### 3. Запуск frontend

```powershell
cd "c:\Users\acer\Desktop\d1sk\SDU gis\SDU-gis"
npm run dev
```

Обычно Vite поднимается на:

```text
http://localhost:5173
```

## В каком порядке лучше запускать

1. Сначала `FastAPI` на `8000`
2. Потом `parser server` на `7777`
3. Потом `frontend` на `5173`

## Переменные окружения (в `.env`)

Все чувствительные данные и конфигурация хранятся в `.env`:

| Переменная | Назначение | Пример |
|-----------|-----------|--------|
| `MONGO_URI` | MongoDB Atlas подключение | `mongodb+srv://user:pass@cluster.net/` |
| `MONGO_DB_NAME` | Имя базы данных | `sdu_gis` |
| `LOGIN_URL` | URL для логина на my.sdu.edu.kz | `https://my.sdu.edu.kz/loginAuth.php` |
| `SCHEDULE_URL` | URL расписания | `https://my.sdu.edu.kz/index.php` |
| `INDEX_URL` | Главная страница | `https://my.sdu.edu.kz/index.php` |
| `TRANSCRIPT_URL` | Транскрипт оценок | `https://my.sdu.edu.kz/index.php?mod=transkript` |
| `SERVER_HOST` | Хост для запуска | `0.0.0.0` |
| `SERVER_PORT` | Порт | `8000` |
| `DEBUG` | Debug режим | `False` |
| `SDU_USERNAME` | Студент ID для тестирования | `230103235` |
| `SDU_PASSWORD` | Пароль студента | (не коммитить!) |

**Используют `.env`:**
- `auth_server.py` (FastAPI backend)
- `data.py` (парсер данных)
- `profile.py` (профиль студента)

## Что использует фронтенд

- логин, профиль, события, расписание: `http://localhost:8000`
- запуск парсера комнат: `http://localhost:7777/run-parser`
- чат-ассистент: `http://localhost:8001/rag/answer`

## Важно

Сервис чата на `8001` в этом репозитории не найден. Если открыть страницу, где используется чат, он может не работать, пока не будет поднят отдельный RAG/backend сервис.

## Быстрая проверка

Если все запущено правильно:

- фронтенд открывается в браузере
- `http://localhost:8000/docs` открывает Swagger UI
- `http://localhost:7777/run-parser` отвечает после запуска parser server
