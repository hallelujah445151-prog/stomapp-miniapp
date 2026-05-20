import sqlite3, shutil

db = r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db'
conn = sqlite3.connect(db)
c = conn.cursor()

c.execute("SELECT id, work_type, patient_name, deadline, status FROM orders ORDER BY id")
orders = [(r[0], r[1], r[2], r[3], r[4]) for r in c.fetchall()]
print(f"Current: {[o[0] for o in orders]}")

c.execute("DELETE FROM orders")
c.execute("DELETE FROM sqlite_sequence WHERE name = 'orders'")
c.execute("DELETE FROM reminders")

for i, (oid, wt, pn, dl, st) in enumerate(orders, 1):
    c.execute(
        "INSERT INTO orders(id, work_type, patient_name, deadline, status, quantity, created_at) VALUES(?,?,?,?,?,1,CURRENT_TIMESTAMP)",
        (i, wt, pn, dl, st)
    )

conn.commit()

c.execute("SELECT id, work_type, patient_name, deadline, status FROM orders")
for r in c.fetchall():
    print(f"  #{r[0]} {r[1]} — {r[2]} | {r[3]} | {r[4]}")

conn.close()

shutil.copy(db, r'C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\backend\data\orders.db')
print("Done — synced to Mini App")
