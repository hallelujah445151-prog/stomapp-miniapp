# StomApp Mini App - Telegram Mini App для зуботехнической лаборатории

Полноценное мини-приложение для автоматизации работы зуботехнической лаборатории в Telegram.

## 🎯 Функционал

### Backend (FastAPI)
- ✅ REST API для управления заказами
- ✅ Интеграция с существующей SQLite базой данных
- ✅ Справочники (врачи, техники, виды работ)
- ✅ Аутентификация через Telegram
- ✅ CRUD операции для заказов

### Frontend (React + TypeScript)
- ✅ Dashboard со списком заказов
- ✅ Фильтрация по статусу
- ✅ Форма создания заказа
- ✅ Адаптивный дизайн для мобильных устройств
- ✅ Интеграция с Telegram Web Apps API
- ✅ Автоматическая тема Telegram

## 🚀 Быстрый старт

### Требования
- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Python 3.11+ (для локальной разработки)

### Установка и запуск

```bash
# Клонирование репозитория
cd mini-app

# Генерация SSL сертификатов
.\generate-certs.ps1  # Windows
# или
chmod +x generate-certs.sh && ./generate-certs.sh  # Linux/Mac

# Запуск с Docker Compose
docker-compose up -d

# Доступ к приложениям
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Локальная разработка

#### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Структура проекта

```
mini-app/
├── backend/                 # FastAPI Backend
│   ├── main.py             # Основное приложение
│   ├── requirements.txt    # Зависимости Python
│   ├── Dockerfile          # Docker конфигурация
│   └── .env               # Переменные окружения
├── frontend/               # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/        # Страницы приложения
│   │   ├── services/     # API сервисы
│   │   ├── store/        # Zustand store
│   │   ├── types/        # TypeScript типы
│   │   ├── utils/        # Utility функции
│   │   └── styles/       # Глобальные стили
│   ├── package.json      # Зависимости Node.js
│   ├── vite.config.ts    # Vite конфигурация
│   └── Dockerfile       # Docker конфигурация
├── nginx/                 # Nginx конфигурации
│   └── nginx.conf       # HTTPS конфигурация
├── certs/                # SSL сертификаты
├── docker-compose.yml    # Docker Compose конфигурация
├── generate-certs.ps1   # Генерация сертификатов (Windows)
├── generate-certs.sh     # Генерация сертификатов (Linux/Mac)
├── HTTPS_SETUP.md        # Инструкция по настройке HTTPS
└── README.md            # Этот файл
```

## 🔧 API Эндпоинты

### Пользователи и аутентификация
- `POST /api/auth/telegram` - Аутентификация через Telegram
- `GET /api/user/profile` - Профиль пользователя

### Заказы
- `GET /api/orders` - Список заказов (с фильтрацией)
- `POST /api/orders` - Создание заказа
- `GET /api/orders/{id}` - Детали заказа
- `PUT /api/orders/{id}` - Обновление заказа

### Справочники
- `GET /api/references/doctors` - Справочник врачей
- `GET /api/references/technicians` - Справочник техников
- `GET /api/references/work-types` - Справочник видов работ

## 🌐 HTTPS настройка

**Важно:** Telegram Mini Apps требуют HTTPS!

### Для локальной разработки
Используйте самоподписанные сертификаты:
```bash
.\generate-certs.ps1  # Windows
```

### Для продакшена
Используйте Let's Encrypt или другой доверенный CA:
```bash
sudo certbot certonly --nginx -d your-domain.com
```

Подробнее: [HTTPS_SETUP.md](HTTPS_SETUP.md)

## 💻 Интеграция с Telegram Bot

Добавьте в существующий бот (basestom):

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

async def open_mini_app(update: Update, context: ContextTypes.DEFAULT_TYPE):
    web_app_url = "https://your-domain.com"
    
    keyboard = [[InlineKeyboardButton(
        text="📱 Открыть приложение",
        web_app=WebAppInfo(url=web_app_url)
    )]]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "Откройте мини-приложение для управления лабораторией:",
        reply_markup=reply_markup
    )
```

## 🧪 Тестирование

### Backend API
```bash
cd backend
python main.py  # В одном терминале
python ../test_api.py  # В другом терминале
```

### Frontend
```bash
cd frontend
npm run dev
```

Откройте http://localhost:3000 в браузере.

## 📊 Технологический стек

### Backend
- **Framework:** FastAPI 0.136.1
- **Server:** Uvicorn 0.46.0
- **Database:** SQLite3
- **Authentication:** Bearer Token

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **State Management:** Zustand
- **Routing:** React Router DOM 6
- **HTTP Client:** Axios
- **Telegram SDK:** @telegram-apps/sdk

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **SSL:** Self-signed / Let's Encrypt

## 🔄 Разработка

### Backend Development
1. Измените код в `backend/`
2. Перезапустите контейнер: `docker-compose restart backend`
3. Протестируйте изменения через Swagger UI: http://localhost:8000/docs

### Frontend Development
1. Измените код в `frontend/src/`
2. Горячая перезагрузка автоматически
3. Проверьте изменения в браузере

### Совместная разработка
```bash
# Backend (терминал 1)
cd backend && python main.py

# Frontend (терминал 2)
cd frontend && npm run dev
```

## 📈 Следующие шаги

### Краткосрочные планы
- [ ] Детали заказа с полной информацией
- [ ] Редактирование заказа
- [ ] Загрузка фотографий заказ-нарядов
- [ ] Real-time обновления через WebSocket

### Среднесрочные планы
- [ ] Расширенные отчеты и статистика
- [ ] Экспорт в Excel/PDF
- [ ] Push уведомления
- [ ] Поиск и фильтрация

### Долгосрочные планы
- [ ] Мобильное приложение (React Native)
- [ ] Панель администратора
- [ ] Интеграция с CRM
- [ ] Аналитика и прогнозирование

## 🤝 Участие в разработке

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License - см. LICENSE файл для деталей

## 👥 Команда

- **Backend Development:** Python/FastAPI специалист
- **Frontend Development:** React/TypeScript специалист
- **DevOps:** Docker/Nginx специалист

## 📞 Поддержка

Для вопросов и поддержки:
- GitHub Issues: [создать issue](https://github.com/your-repo/stomapp/issues)
- Документация: [Wiki](https://github.com/your-repo/stomapp/wiki)

---

**Статус проекта:** ✅ Backend готов, ✅ Frontend базовая структура готова

**Версия:** 1.0.0-alpha

**Дата:** 14.05.2026