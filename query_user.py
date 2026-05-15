import sqlite3, json
conn = sqlite3.connect(r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db')
cursor = conn.cursor()
cursor.execute('SELECT id, name, role, telegram_id, is_admin, is_active FROM users WHERE telegram_id = 5563461010')
row = cursor.fetchone()
if row:
    data = {"id": row[0], "name": row[1], "role": row[2], "telegram_id": row[3], "is_admin": bool(row[4]), "is_active": bool(row[5])}
    with open(r'C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\user_info.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("OK")
conn.close()