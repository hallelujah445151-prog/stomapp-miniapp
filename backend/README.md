# StomApp Backend API

FastAPI backend для Telegram Mini App зуботехнической лаборатории.

## Установка

```bash
pip install -r requirements.txt
```

## Запуск

```bash
python main.py
```

API будет доступен по адресу: http://localhost:8000

## API Documentation

Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

## Основные эндпоинты

- `POST /api/auth/telegram` - Аутентификация через Telegram
- `GET /api/user/profile` - Профиль пользователя
- `GET /api/orders` - Список заказов
- `POST /api/orders` - Создание заказа
- `GET /api/orders/{id}` - Детали заказа
- `PUT /api/orders/{id}` - Обновление заказа
- `GET /api/references/doctors` - Справочник врачей
- `GET /api/references/technicians` - Справочник техников
- `GET /api/references/work-types` - Справочник видов работ