import sqlite3

conn = sqlite3.connect(r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db')
cursor = conn.cursor()

cursor.execute('SELECT id, name, role, telegram_id, is_admin, is_active FROM users WHERE role IN ("technician", "doctor")')
rows = cursor.fetchall()

print('=== PERSONNEL FROM DATABASE ===')
for r in rows:
    print(f'ID: {r[0]}, Name: {r[1]}, Role: {r[2]}, Telegram: {r[3]}, Admin: {r[4]}, Active: {r[5]}')

conn.close()