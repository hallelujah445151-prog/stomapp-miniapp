import sqlite3, json
conn = sqlite3.connect(r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db')
c = conn.cursor()
c.execute('SELECT id, name FROM users WHERE id IN (2,5)')
users = [{'id': r[0], 'name': r[1]} for r in c.fetchall()]
c.execute('SELECT id, technician_id, work_type FROM orders WHERE id IN (28,29)')
orders = [{'id': r[0], 'tech_id': r[1], 'work': r[2]} for r in c.fetchall()]
conn.close()
with open(r'C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\db_check.json', 'w', encoding='utf-8') as f:
    json.dump({'users': users, 'orders': orders}, f, ensure_ascii=False, indent=2)
print('done')