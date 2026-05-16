from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.concurrency import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import sys
import asyncio
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'basestom', 'src'))

# Импортируем функции работы с БД
def get_connection():
    """Получение соединения с БД"""
    import sqlite3
    DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'orders.db')
    return sqlite3.connect(DB_PATH)

def init_db():
    """Инициализация БД"""
    import sqlite3
    DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'orders.db')
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


security = HTTPBearer()

# Фоновая задача напоминаний (каждые 30 минут)
async def reminder_background_task():
    """Проверяет заказы с дедлайном на завтра и шлёт уведомления в Telegram"""
    while True:
        try:
            await asyncio.sleep(1800)  # 30 минут
            bot_token = os.getenv('BOT_TOKEN', '')
            if not bot_token:
                continue
            
            conn = get_connection()
            cursor = conn.cursor()
            today = datetime.now()
            tomorrow = (today + timedelta(days=1)).strftime('%Y-%m-%d')
            
            cursor.execute("""
                SELECT o.id, o.technician_id, o.patient_name, o.work_type, o.quantity, o.deadline,
                       t.name as tech_name, t.telegram_id as tech_tg
                FROM orders o
                LEFT JOIN users t ON o.technician_id = t.id
                WHERE o.deadline = ? AND o.status = 'in_progress'
                AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.order_id = o.id AND r.reminder_type = 'tomorrow')
            """, (tomorrow,))
            
            rows = cursor.fetchall()
            
            import httpx
            for row in rows:
                order_id, tech_id, patient, work, qty, deadline, tech_name, tech_tg = row
                if tech_tg:
                    msg = f"⏰ НАПОМИНАНИЕ!\n\n📋 Заказ #{order_id}\n👤 {patient or '—'}\n🔨 {work}\n📊 {qty} шт\n📅 Срок: {deadline}\n🔧 Исполнитель: {tech_name or '—'}"
                    try:
                        async with httpx.AsyncClient(timeout=10) as client:
                            await client.post(f"https://api.telegram.org/bot{bot_token}/sendMessage", json={"chat_id": tech_tg, "text": msg})
                        cursor.execute("INSERT OR IGNORE INTO reminders (order_id, reminder_type) VALUES (?, 'tomorrow')", (order_id,))
                        conn.commit()
                        print(f"[REMINDER] Sent for order #{order_id} to tech {tech_name}")
                    except Exception as e:
                        print(f"[REMINDER] Failed order #{order_id}: {e}")
            
            conn.close()
        except Exception as e:
            print(f"[REMINDER] Background task error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(reminder_background_task())
    print("Database initialized + reminder task started")
    yield
    task.cancel()


app = FastAPI(title="StomApp API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    
    query = """
        SELECT o.id, o.doctor_id, o.technician_id, o.patient_name, o.work_type, 
               o.quantity, o.deadline, o.description, o.photo_id, o.created_at, o.status,
               d.name as doctor_name, t.name as technician_name
        FROM orders o
        LEFT JOIN users d ON o.doctor_id = d.id
        LEFT JOIN users t ON o.technician_id = t.id
    """
    params = []
    conditions = []
    
    if status:
        conditions.append("o.status = ?")
        params.append(status)
    if technician_id:
        conditions.append("o.technician_id = ?")
        params.append(technician_id)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY o.created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    orders_list = [{
        "id": r[0], "doctor_id": r[1], "technician_id": r[2], "patient_name": r[3],
        "work_type": r[4], "quantity": r[5], "deadline": r[6], "description": r[7],
        "photo_id": r[8], "created_at": r[9], "status": r[10],
        "doctor_name": r[11], "technician_name": r[12]
    } for r in rows]
    
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
    
    cursor.execute("""
        SELECT o.*, d.name as doctor_name, t.name as technician_name
        FROM orders o
        LEFT JOIN users d ON o.doctor_id = d.id
        LEFT JOIN users t ON o.technician_id = t.id
        WHERE o.id = ?
    """, (order_id,))
    r = cursor.fetchone()
    conn.close()
    
    if not r:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    return {
        "id": r[0], "doctor_id": r[1], "technician_id": r[2], "patient_name": r[3],
        "work_type": r[4], "quantity": r[5], "deadline": r[6], "description": r[7],
        "photo_id": r[8], "created_at": r[9], "status": r[10],
        "doctor_name": r[11], "technician_name": r[12]
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
    references_path = os.path.join(os.path.dirname(__file__), 'data', 'references.json')
    
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


# Раздача статического фронтенда (для продакшена)
STATIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs')

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    async def root():
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "StomApp API is running", "version": "1.0.0"}

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# Загрузка фото
@app.post("/api/orders/{order_id}/photo")
async def upload_photo(order_id: int, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Загрузка фото к заказу"""
    import uuid, shutil
    ext = file.filename.split('.')[-1] if '.' in (file.filename or '') else 'jpg'
    filename = f"order_{order_id}_{uuid.uuid4().hex[:8]}.{ext}"
    upload_dir = os.path.join(os.path.dirname(__file__), 'data', 'photos')
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET photo_id = ? WHERE id = ?", (filename, order_id))
    conn.commit()
    conn.close()
    return {"message": "Фото загружено", "photo_id": filename}


# Уведомление — отправка через Telegram Bot API
@app.post("/api/notify/order-created")
async def notify_order_created(order_data: dict, current_user: dict = Depends(get_current_user)):
    """Отправить уведомление технику о новом заказе"""
    technician_id = order_data.get('technician_id')
    order_id = order_data.get('order_id', '?')
    
    if technician_id:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT telegram_id, name FROM users WHERE id = ? AND is_active = 1", (technician_id,))
        tech = cursor.fetchone()
        conn.close()
        
        if tech:
            import httpx
            bot_token = os.getenv('BOT_TOKEN', '')
            if bot_token:
                try:
                    async with httpx.AsyncClient(timeout=10) as client:
                        await client.post(
                            f"https://api.telegram.org/bot{bot_token}/sendMessage",
                            json={
                                "chat_id": tech[0],
                                "text": f"🔔 Новый заказ #{order_id}!\n\nВид работы назначен на вас.\nПроверьте приложение: https://stomapp-miniapp-1.onrender.com/order/{order_id}",
                                "parse_mode": "HTML"
                            }
                        )
                    return {"message": f"Уведомление отправлено технику {tech[1]}"}
                except Exception as e:
                    return {"message": f"Отправка не удалась: {e}", "sent": False}
    
    return {"message": "Техник не найден или бот не настроен", "sent": False}


# Синхронизация — эндпоинт для бота
class SyncOrder(BaseModel):
    doctor_id: Optional[int] = None
    technician_id: Optional[int] = None
    patient_name: Optional[str] = None
    work_type: str
    quantity: int = 1
    deadline: str
    description: Optional[str] = None
    status: str = 'in_progress'


@app.post("/api/sync/order-from-bot")
async def sync_order_from_bot(order: SyncOrder):
    """Принять заказ созданный в боте для синхронизации"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO orders (doctor_id, technician_id, patient_name, work_type, quantity, deadline, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (order.doctor_id, order.technician_id, order.patient_name, order.work_type,
          order.quantity, order.deadline, order.description, order.status))
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "ok", "order_id": order_id}


@app.get("/api/sync/check")
async def sync_check():
    """Проверка что сервер жив"""
    return {"status": "ok", "app": "stomapp-miniapp-1", "version": "2.0"}


@app.post("/api/sync/restore-from-bot")
async def restore_from_bot(data: dict):
    """Восстановить БД из бота — вызывается ботом для полной синхронизации"""
    if not data.get('secret') == 'endurance':
        raise HTTPException(status_code=403, detail="Access denied")
    
    conn = get_connection()
    cursor = conn.cursor()
    results = {"orders": 0, "users": 0}
    
    try:
        if 'users' in data:
            for u in data['users']:
                cursor.execute("""
                    INSERT OR REPLACE INTO users (id, telegram_id, name, role, is_admin, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM users WHERE id=?), CURRENT_TIMESTAMP))
                """, (u.get('id'), u.get('telegram_id'), u.get('name'), u.get('role'),
                      u.get('is_admin', 0), u.get('is_active', 1), u.get('id')))
                results['users'] += 1
        
        if 'orders' in data:
            for o in data['orders']:
                cursor.execute("""
                    INSERT OR REPLACE INTO orders (id, doctor_id, technician_id, patient_name, work_type,
                        quantity, deadline, description, photo_id, created_at, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM orders WHERE id=?), CURRENT_TIMESTAMP), ?)
                """, (o.get('id'), o.get('doctor_id'), o.get('technician_id'), o.get('patient_name'),
                      o.get('work_type'), o.get('quantity', 1), o.get('deadline', ''),
                      o.get('description'), o.get('photo_id'), o.get('id'), o.get('status', 'in_progress')))
                results['orders'] += 1
        
        conn.commit()
        conn.close()
        return {"message": "ok", "restored": results}
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


# Напоминания (из ReminderService бота)
@app.get("/api/reminders/upcoming")
async def get_upcoming_deadlines(days: int = 3, current_user: dict = Depends(get_current_user)):
    """Заказы с дедлайном в ближайшие N дней"""
    from datetime import datetime, timedelta
    conn = get_connection()
    cursor = conn.cursor()
    today = datetime.now().strftime('%Y-%m-%d')
    deadline = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
    cursor.execute("""
        SELECT o.*, d.name as doctor_name, t.name as technician_name
        FROM orders o
        LEFT JOIN users d ON o.doctor_id = d.id
        LEFT JOIN users t ON o.technician_id = t.id
        WHERE o.deadline BETWEEN ? AND ? AND o.status = 'in_progress'
        ORDER BY o.deadline ASC
    """, (today, deadline))
    rows = cursor.fetchall()
    conn.close()
    return {"reminders": [{"id":r[0],"doctor_id":r[1],"technician_id":r[2],"patient_name":r[3],"work_type":r[4],"quantity":r[5],"deadline":r[6],"description":r[7],"status":r[10],"doctor_name":r[11],"technician_name":r[12]} for r in rows]}


@app.get("/api/reminders/overdue")
async def get_overdue_orders(current_user: dict = Depends(get_current_user)):
    """Просроченные заказы (дедлайн прошёл, статус ещё в работе)"""
    from datetime import datetime
    conn = get_connection()
    cursor = conn.cursor()
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute("""
        SELECT o.*, d.name as doctor_name, t.name as technician_name
        FROM orders o
        LEFT JOIN users d ON o.doctor_id = d.id
        LEFT JOIN users t ON o.technician_id = t.id
        WHERE o.deadline < ? AND o.status = 'in_progress'
        ORDER BY o.deadline ASC
    """, (today,))
    rows = cursor.fetchall()
    conn.close()
    return {"overdue": [{"id":r[0],"doctor_id":r[1],"technician_id":r[2],"patient_name":r[3],"work_type":r[4],"quantity":r[5],"deadline":r[6],"description":r[7],"status":r[10],"doctor_name":r[11],"technician_name":r[12]} for r in rows]}


# Расширенные отчёты (из ReportService бота)
@app.get("/api/reports/workload")
async def get_workload(current_user: dict = Depends(get_current_user)):
    """Загрузка по техникам: активные заказы и ближайшие дедлайны"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.name,
               COUNT(o.id) as active_orders,
               MIN(o.deadline) as next_deadline
        FROM users u
        LEFT JOIN orders o ON o.technician_id = u.id AND o.status = 'in_progress'
        WHERE u.role = 'technician' AND u.is_active = 1
        GROUP BY u.id
        ORDER BY active_orders DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return {"workload": [{"id":r[0],"name":r[1],"active":r[2],"next_deadline":r[3]} for r in rows]}


# Отчёты и статистика
@app.get("/api/reports/summary")
async def get_summary(current_user: dict = Depends(get_current_user)):
    """Сводка по заказам"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT COUNT(*) FROM orders")
        total = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'in_progress'")
        in_progress = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'completed'")
        completed = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'in_progress' AND deadline <= date('now', '+2 days')")
        urgent = cursor.fetchone()[0]
        conn.close()
        return {"total": total, "in_progress": in_progress, "completed": completed, "urgent": urgent}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/by-doctor")
async def get_by_doctor(current_user: dict = Depends(get_current_user)):
    """Статистика по врачам"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT u.id, u.name, 
                   COUNT(o.id) as total,
                   SUM(CASE WHEN o.status='in_progress' THEN 1 ELSE 0 END) as active,
                   SUM(CASE WHEN o.status='completed' THEN 1 ELSE 0 END) as done
            FROM users u LEFT JOIN orders o ON o.doctor_id = u.id
            WHERE u.role = 'doctor' AND u.is_active = 1
            GROUP BY u.id ORDER BY total DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "name": r[1], "total": r[2], "active": r[3], "done": r[4]} for r in rows]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports/by-technician")
async def get_by_technician(current_user: dict = Depends(get_current_user)):
    """Статистика по техникам"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT u.id, u.name,
                   COUNT(o.id) as total,
                   SUM(CASE WHEN o.status='in_progress' THEN 1 ELSE 0 END) as active,
                   SUM(CASE WHEN o.status='completed' THEN 1 ELSE 0 END) as done
            FROM users u LEFT JOIN orders o ON o.technician_id = u.id
            WHERE u.role = 'technician' AND u.is_active = 1
            GROUP BY u.id ORDER BY total DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "name": r[1], "total": r[2], "active": r[3], "done": r[4]} for r in rows]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


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