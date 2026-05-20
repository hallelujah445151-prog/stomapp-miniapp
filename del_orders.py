import sqlite3, shutil
db = r'C:\Users\crush\AppData\Roaming\projects\basestom\data\orders.db'
c = sqlite3.connect(db).cursor()
c.execute("DELETE FROM orders")
c.execute("DELETE FROM reminders")
c.execute("DELETE FROM sqlite_sequence WHERE name = 'orders'")
c.connection.commit()
c.connection.close()
shutil.copy(db, r'C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\backend\data\orders.db')
print('All orders deleted')
