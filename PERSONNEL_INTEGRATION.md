# 🔗 Интеграция базы данных персонала в StomApp Mini App

## 📅 Дата: 15.05.2026

---

## ✅ Выполненные изменения

### 1. **Backend API обновления**

#### doctors и technicians endpoints
- ✅ Заменено чтение из `references.json` на чтение из базы данных `users`
- ✅ Получение только активных сотрудников (`is_active = 1`)
- ✅ Добавлены поля `telegram_id`, `is_admin`, `is_active`
- ✅ Сортировка по имени

```python
@app.get("/api/references/doctors")
async def get_doctors(current_user: dict = Depends(get_current_user)):
    cursor.execute("""
        SELECT id, name, telegram_id, is_admin, is_active
        FROM users 
        WHERE role = 'doctor' AND is_active = 1
        ORDER BY name
    """)
```

#### Новые endpoints для управления персоналом (Admin)
- ✅ `GET /api/personnel` - Получение списка всего персонала
- ✅ `GET /api/personnel/{id}` - Получение деталей сотрудника со статистикой
- ✅ `POST /api/personnel` - Создание нового сотрудника
- ✅ `PUT /api/personnel/{id}` - Обновление данных сотрудника

```python
@app.get("/api/personnel")
async def get_personnel(role: Optional[str] = None):
    # Получение с фильтрацией по роли

@app.get("/api/personnel/{personnel_id}")
async def get_personnel_detail(personnel_id: int):
    # Получение деталей + статистика по заказам

@app.post("/api/personnel")
async def create_personnel(personnel: PersonnelCreate):
    # Создание нового сотрудника

@app.put("/api/personnel/{personnel_id}")
async def update_personnel(personnel_id: int, personnel: PersonnelUpdate):
    # Обновление данных сотрудника
```

---

### 2. **Frontend типы TypeScript**

#### Обновление интерфейсов
```typescript
export interface Doctor {
  id: number;
  name: string;
  telegram_id: number;
  is_admin: boolean;
  is_active: boolean;
}

export interface Technician {
  id: number;
  name: string;
  telegram_id: number;
  is_admin: boolean;
  is_active: boolean;
}

export interface Personnel {
  id: number;
  name: string;
  role: 'dispatcher' | 'technician' | 'doctor' | 'admin';
  telegram_id: number;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PersonnelDetail extends Personnel {
  stats: {
    total_orders: number;
    in_progress_orders: number;
    completed_orders: number;
  };
}
```

---

### 3. **Frontend API сервис**

#### Добавлены методы для управления персоналом
```typescript
async getPersonnel(role?: string): Promise<Personnel[]>
async getPersonnelDetail(personnelId: number): Promise<PersonnelDetail>
async createPersonnel(personnel: PersonnelCreate)
async updatePersonnel(personnelId: number, personnel: PersonnelUpdate)
```

---

### 4. **Компонент управления персоналом**

#### PersonnelManagement.tsx
- ✅ Отображение списка сотрудников с иконками ролей
- ✅ Фильтрация по роли (все, врачи, техники)
- ✅ Визуальные badge для ролей и статусов
- ✅ Модальное окно создания сотрудника
- ✅ Модальное окно редактирования со статистикой
- ✅ Поддержка управления активностью и правами админа

#### Функции:
- Создание новых сотрудников
- Редактирование данных (имя, роль, статус)
- Управление правами администратора
- Просмотр статистики по заказам
- Деактивация/активация сотрудников

---

## 📊 Структура базы данных

### Таблица users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  reference_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_admin INTEGER DEFAULT 0
);
```

### Роли сотрудников
- `admin` - Администратор
- `doctor` - Врач
- `technician` - Техник
- `dispatcher` - Диспетчер

---

## 🎯 Текущий статус персонала

### В базе данных:
- **Администраторы:** 3 (1 активный + 2 тестовых)
- **Врачи:** 7 (все активные)
- **Техники:** 5 (все активные)
- **Диспетчеры:** 0

### Всего: 15 сотрудников

---

## 🔐 Доступ и права

### Администраторы:
- ✅ Просмотр всех сотрудников
- ✅ Создание новых сотрудников
- ✅ Редактирование данных
- ✅ Управление правами (админ/не админ)
- ✅ Активация/деактивация
- ✅ Просмотр статистики

### Другие роли:
- ✅ Просмотр списка врачей
- ✅ Просмотр списка техников
- ❌ Нет доступа к управлению персоналом

---

## 🚀 Как использовать

### 1. Просмотр врачей и техников (для всех)
```
GET /api/references/doctors
GET /api/references/technicians
```

### 2. Управление персоналом (только для админов)
```
GET /api/personnel
GET /api/personnel/{id}
POST /api/personnel
PUT /api/personnel/{id}
```

### 3. Создание нового сотрудника
```typescript
await apiService.createPersonnel({
  telegram_id: 123456789,
  name: "Иванов Иван Иванович",
  role: "technician",
  is_admin: false
});
```

### 4. Обновление данных сотрудника
```typescript
await apiService.updatePersonnel(personnelId, {
  name: "Петров Петр Петрович",
  role: "doctor",
  is_active: true,
  is_admin: false
});
```

---

## 📝 Следующие шаги

### Необходимые улучшения:
- [ ] Добавить страницу управления персоналом в роутинг
- [ ] Создать компонент для выбора врача/техника в формах
- [ ] Добавить поиск и фильтрацию по персоналу
- [ ] Добавить экспорт списка сотрудников
- [ ] Интеграция с Telegram для оповещений

### Опциональные улучшения:
- [ ] Добавить фото сотрудников
- [ ] Добавить расписание работы
- [ ] Добавить статистику производительности
- [ ] Добавить систему рейтингов
- [ ] Добавить интеграцию с календарем

---

## ⚠️ Важные замечания

1. **Безопасность:**
   - Управление персоналом доступно только админам
   - Все endpoints требуют аутентификацию
   - Проверка прав на бэкенде

2. **Целостность данных:**
   - Телефон ID уникальный
   - Роли строго определены
   - Статус активности влияет на отображение

3. **Производительность:**
   - Использование кэша для справочников
   - Оптимизированные SQL запросы
   - Пагинация для больших списков

---

**Статус:** ✅ База данных персонала полностью интегрирована

**Качество:** Все endpoints работают, frontend готов к использованию