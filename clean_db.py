import sqlite3, shutil

db_path = r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db'
backup_path = r'C:\Users\crush\Desktop\orders_backup_2026-05-20.db'

conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("DELETE FROM orders WHERE id NOT IN (30, 31)")
print(f'Orders deleted: {c.rowcount}')

c.execute("DELETE FROM reminders")
print(f'Reminders cleared: {c.rowcount}')

c.execute("DELETE FROM users WHERE is_admin = 0 OR is_admin IS NULL")
print(f'Users deleted: {c.rowcount}')

conn.commit()

c.execute("SELECT COUNT(*) FROM orders")
print(f'Orders left: {c.fetchone()[0]}')
c.execute("SELECT COUNT(*) FROM users")
print(f'Users left: {c.fetchone()[0]}')
c.execute("SELECT id, name, role, is_admin FROM users")
for r in c.fetchall():
    print(f'  #{r[0]} {r[1]} ({r[2]})')

conn.close()

# Copy to mini-app backend
shutil.copy(db_path, r'C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\backend\data\orders.db')
print('Copied to Mini App backend')
