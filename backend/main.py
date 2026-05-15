from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import sys
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'basestom', 'src'))

# Импортируем функции работы с БД
def get_connection():
    """Получение соединения с БД"""
    import sqlite3
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'basestom', 'data', 'orders.db'))
    return sqlite3.connect(DB_PATH)

def init_db():
    """Инициализация БД"""
    import sqlite3
    DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'basestom', 'data', 'orders.db')
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            reference_id INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER,
            technician_id INTEGER,
            patient_name TEXT,
            work_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            deadline TEXT NOT NULL,
            description TEXT,
            photo_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'in_progress',
            FOREIGN KEY (doctor_id) REFERENCES users(id),
            FOREIGN KEY (technician_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            reminder_type TEXT NOT NULL,
            sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    ''')

    conn.commit()
    conn.close()

app = FastAPI(title="StomApp API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Инициализация базы данных при старте приложения
@app.on_event("startup")
async def startup_event():
    """Инициализация БД при запуске"""
    init_db()
    print("Database initialized successfully")


class TelegramAuth(BaseModel):
    init_data: str
    user_id: int

class LoginRequest(BaseModel):
    telegram_id: int

class OrderCreate(BaseModel):
    doctor_id: int
    technician_id: int
    patient_name: str
    work_type: str
    quantity: int
    deadline: str
    description: Optional[str] = None


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None


def verify_telegram_auth(init_data: str) -> dict:
    """Временная упрощенная проверка auth данных"""
    return {"valid": True, "user_id": 123456}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Получение текущего пользователя по токену"""
    token = credentials.credentials
    if token == "test_token":
        return {"id": 1, "name": "Test User", "role": "dispatcher", "is_admin": 1}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные данные аутентификации"
    )


@app.get("/")
async def root():
    return {"message": "StomApp API is running", "version": "1.0.0"}


@app.post("/api/auth/telegram")
async def auth_telegram(auth: TelegramAuth):
    """Аутентификация через Telegram Mini App"""
    user_data = verify_telegram_auth(auth.init_data)
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE telegram_id = ?", (auth.user_id,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user:
        return {
            "access_token": "test_token",
            "user": {
                "id": user[0],
                "name": user[2],
                "role": user[3],
                "is_admin": bool(user[4])
            }
        }
    else:
        raise HTTPException(status_code=404,         detail="Пользователь не найден")


@app.post("/api/auth/login")
async def login_by_telegram_id(login_data: LoginRequest):
    """Вход по Telegram ID - поиск в базе users"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, name, role, telegram_id, is_admin, is_active FROM users WHERE telegram_id = ? AND is_active = 1",
        (login_data.telegram_id,)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"Пользователь с Telegram ID {login_data.telegram_id} не найден. Обратитесь к администратору."
        )
    
    return {
        "access_token": "test_token",
        "user": {
            "id": user[0],
            "name": user[1],
            "role": user[2],
            "telegram_id": user[3],
            "is_admin": bool(user[4]),
            "is_active": bool(user[5])
        }
    }


@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Получение профиля пользователя"""
    return {"user": current_user}


@app.get("/api/orders")
async def get_orders(
    status: Optional[str] = None,
    technician_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Получение списка заказов с фильтрацией"""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM orders"
    params = []
    
    if status:
        query += " WHERE status = ?"
        params.append(status)
    elif technician_id:
        query += " WHERE technician_id = ?"
        params.append(technician_id)
    
    cursor.execute(query, params)
    orders = cursor.fetchall()
    
    conn.close()
    
    orders_list = []
    for order in orders:
        orders_list.append({
            "id": order[0],
            "doctor_id": order[1],
            "technician_id": order[2],
            "patient_name": order[3],
            "work_type": order[4],
            "quantity": order[5],
            "deadline": order[6],
            "description": order[7],
            "photo_id": order[8],
            "created_at": order[9],
            "status": order[10]
        })
    
    return {"orders": orders_list}


@app.post("/api/orders")
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    """Создание нового заказа"""
    if current_user["role"] != "dispatcher" and not current_user["is_admin"]:
        raise HTTPException(status_code=403,         detail="Только диспетчеры могут создавать заказы")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO orders (doctor_id, technician_id, patient_name, work_type, quantity, deadline, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress')
    """, (order.doctor_id, order.technician_id, order.patient_name, order.work_type, 
          order.quantity, order.deadline, order.description))
    
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"message": "Order created successfully", "order_id": order_id}


@app.get("/api/orders/{order_id}")
async def get_order(order_id: int, current_user: dict = Depends(get_current_user)):
    """Получение деталей заказа"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    order = cursor.fetchone()
    
    conn.close()
    
    if not order:
        raise HTTPException(status_code=404,         detail="Заказ не найден")
    
    return {
        "id": order[0],
        "doctor_id": order[1],
        "technician_id": order[2],
        "patient_name": order[3],
        "work_type": order[4],
        "quantity": order[5],
        "deadline": order[6],
        "description": order[7],
        "photo_id": order[8],
        "created_at": order[9],
        "status": order[10]
    }


@app.put("/api/orders/{order_id}")
async def update_order(order_id: int, order_update: OrderUpdate, current_user: dict = Depends(get_current_user)):
    """Обновление заказа"""
    conn = get_connection()
    cursor = conn.cursor()
    
    update_fields = []
    params = []
    
    if order_update.status:
        update_fields.append("status = ?")
        params.append(order_update.status)
    
    if order_update.description:
        update_fields.append("description = ?")
        params.append(order_update.description)
    
    if update_fields:
        params.append(order_id)
        cursor.execute(f"UPDATE orders SET {', '.join(update_fields)} WHERE id = ?", params)
        conn.commit()
    
    conn.close()
    
    return {"message": "Order updated successfully"}


@app.get("/api/references/doctors")
async def get_doctors(current_user: dict = Depends(get_current_user)):
    """Получение справочника врачей из базы данных"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Получаем активных врачей из базы данных
        cursor.execute("""
            SELECT id, name, telegram_id, is_admin, is_active
            FROM users 
            WHERE role = 'doctor' AND is_active = 1
            ORDER BY name
        """)
        
        doctors = []
        for row in cursor.fetchall():
            doctors.append({
                "id": row[0],
                "name": row[1],
                "telegram_id": row[2],
                "is_admin": bool(row[3]),
                "is_active": bool(row[4])
            })
        
        conn.close()
        return {"doctors": doctors}
    except Exception as e:
        conn.close()
        return {"doctors": [], "error": f"Error fetching doctors: {str(e)}"}


@app.get("/api/references/technicians")
async def get_technicians(current_user: dict = Depends(get_current_user)):
    """Получение справочника техников из базы данных"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Получаем активных техников из базы данных
        cursor.execute("""
            SELECT id, name, telegram_id, is_admin, is_active
            FROM users 
            WHERE role = 'technician' AND is_active = 1
            ORDER BY name
        """)
        
        technicians = []
        for row in cursor.fetchall():
            technicians.append({
                "id": row[0],
                "name": row[1],
                "telegram_id": row[2],
                "is_admin": bool(row[3]),
                "is_active": bool(row[4])
            })
        
        conn.close()
        return {"technicians": technicians}
    except Exception as e:
        conn.close()
        return {"technicians": [], "error": f"Error fetching technicians: {str(e)}"}


@app.get("/api/references/work-types")
async def get_work_types(current_user: dict = Depends(get_current_user)):
    """Получение справочника видов работ из references.json"""
    import json
    references_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'basestom', 'data', 'references.json'))
    
    try:
        with open(references_path, 'r', encoding='utf-8') as f:
            references = json.load(f)
        return {"work_types": references.get("work_types", [])}
    except FileNotFoundError:
        return {"work_types": [], "error": f"Файл справочников не найден: {references_path}"}
    except Exception as e:
        return {"work_types": [], "error": f"Ошибка чтения файла: {str(e)}"}


# Новые endpoints для управления персоналом (для админов)
@app.get("/api/personnel")
async def get_personnel(
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Получение списка персонала (админам)"""
    if current_user["role"] != "admin" and not current_user["is_admin"]:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать персонал")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        query = "SELECT id, name, role, telegram_id, is_admin, is_active, created_at FROM users"
        params = []
        
        if role:
            query += " WHERE role = ?"
            params.append(role)
        
        query += " ORDER BY role, name"
        
        cursor.execute(query, params)
        personnel = []
        
        for row in cursor.fetchall():
            personnel.append({
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "telegram_id": row[3],
                "is_admin": bool(row[4]),
                "is_active": bool(row[5]),
                "created_at": row[6]
            })
        
        conn.close()
        return {"personnel": personnel}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Ошибка при получении персонала: {str(e)}")


@app.get("/api/personnel/{personnel_id}")
async def get_personnel_detail(
    personnel_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Получение детальной информации о сотруднике"""
    if current_user["role"] != "admin" and not current_user["is_admin"]:
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать детали")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, name, role, telegram_id, is_admin, is_active, created_at
            FROM users 
            WHERE id = ?
        """, (personnel_id,))
        
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Получаем статистику по заказам
        cursor.execute("""
            SELECT COUNT(*) as total_orders,
                   COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_orders,
                   COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
            FROM orders 
            WHERE technician_id = ? OR doctor_id = ?
        """, (personnel_id, personnel_id))
        
        stats = cursor.fetchone()
        
        conn.close()
        
        return {
            "personnel": {
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "telegram_id": row[3],
                "is_admin": bool(row[4]),
                "is_active": bool(row[5]),
                "created_at": row[6],
                "stats": {
                    "total_orders": stats[0],
                    "in_progress_orders": stats[1],
                    "completed_orders": stats[2]
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Ошибка при получении деталей: {str(e)}")


class PersonnelUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


@app.put("/api/personnel/{personnel_id}")
async def update_personnel(
    personnel_id: int,
    personnel_update: PersonnelUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Обновление информации о сотруднике"""
    if current_user["role"] != "admin" and not current_user["is_admin"]:
        raise HTTPException(status_code=403, detail="Только администраторы могут редактировать персонал")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        update_fields = []
        params = []
        
        if personnel_update.name:
            update_fields.append("name = ?")
            params.append(personnel_update.name)
        
        if personnel_update.role:
            update_fields.append("role = ?")
            params.append(personnel_update.role)
        
        if personnel_update.is_admin is not None:
            update_fields.append("is_admin = ?")
            params.append(1 if personnel_update.is_admin else 0)
        
        if personnel_update.is_active is not None:
            update_fields.append("is_active = ?")
            params.append(1 if personnel_update.is_active else 0)
        
        if update_fields:
            params.append(personnel_id)
            cursor.execute(f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?", params)
            conn.commit()
            
            conn.close()
            return {"message": "Информация о сотруднике обновлена"}
        else:
            conn.close()
            raise HTTPException(status_code=400, detail="Нет данных для обновления")
    except HTTPException:
        raise
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении: {str(e)}")


class PersonnelCreate(BaseModel):
    telegram_id: int
    name: str
    role: str
    is_admin: bool = False


@app.post("/api/personnel")
async def create_personnel(
    personnel: PersonnelCreate,
    current_user: dict = Depends(get_current_user)
):
    """Создание нового сотрудника"""
    if current_user["role"] != "admin" and not current_user["is_admin"]:
        raise HTTPException(status_code=403, detail="Только администраторы могут создавать сотрудников")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO users (telegram_id, name, role, is_admin, is_active, created_at)
            VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        """, (personnel.telegram_id, personnel.name, personnel.role, 
              1 if personnel.is_admin else 0))
        
        personnel_id = cursor.lastrowid
        conn.commit()
        
        conn.close()
        return {"message": "Сотрудник создан", "personnel_id": personnel_id}
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании сотрудника: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    
    # Конфигурация для HTTPS (раскомментируйте для продакшена)
    ssl_keyfile = None
    ssl_certfile = None
    
    # Для локального тестирования с самоподписанными сертификатами:
    # ssl_keyfile = "../certs/privkey.pem"
    # ssl_certfile = "../certs/fullchain.pem"
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile
    )