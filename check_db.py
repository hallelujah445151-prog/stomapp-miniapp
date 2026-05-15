import sqlite3

# Подключение к базе данных
conn = sqlite3.connect(r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db')
cursor = conn.cursor()

# Получение списка таблиц
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=== DATABASE TABLES ===")
for table in tables:
    print(f"\nTable: {table[0]}")
    print("-" * 50)
    
    # Получение структуры таблицы
    cursor.execute(f"PRAGMA table_info({table[0]})")
    columns = cursor.fetchall()
    
    print("Columns:")
    for col in columns:
        pk = "PRIMARY KEY" if col[5] else ""
        print(f"  - {col[1]} ({col[2]}) {pk}")
    
    # Получение количества записей
    cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
    count = cursor.fetchone()[0]
    print(f"Total records: {count}")
    
    # Получение примера данных
    if count > 0:
        cursor.execute(f"SELECT * FROM {table[0]} LIMIT 3")
        rows = cursor.fetchall()
        print("\nSample data:")
        for i, row in enumerate(rows, 1):
            print(f"  Record {i}: {row}")

conn.close()