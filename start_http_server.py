# -*- coding: utf-8 -*-
import subprocess
import time
import os

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def start_servers():
    print("=== ЗАПУСК СЕРВЕРОВ ===")
    
    # 1. Запуск Backend
    print("1. Запуск Backend API (http://localhost:8000)...")
    backend_process = subprocess.Popen(
        ["python", "main.py"],
        cwd=r"C:\Users\crush\AppData\Roaming\projects\basestom\src",
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Даем Backend время на запуск
    time.sleep(8)
    
    # Проверяем Backend
    try:
        import requests
        response = requests.get(BACKEND_URL, timeout=3)
        if response.status_code == 200:
            print("SUCCESS: Backend API работает!")
        else:
            print(f"WARNING: Backend отвечает с кодом: {response.status_code}")
    except Exception as e:
        print(f"ERROR: Не удалось проверить Backend: {e}")
    
    # 2. Запуск Frontend через Python HTTP Server
    print("\n2. Запуск Frontend (http://localhost:3000)...")
    
    # Используем встроенный http.server из Python
    import socketserver
    import threading

    HOST = "127.0.0.1"
    PORT = 3000
    
    class RequestHandler:
        def do_GET(self):
            content = ""
            if self.path == "/":
                with open("C:\\Users\\crush\\AppData\\Roaming\\projects\\basestom\\data\\index.html", "r", encoding="utf-8") as f:
                    content += f.read()
                self.send_response(200, content_type="text/html; charset=utf-8", body=content)
            elif self.path.startswith("/api/"):
                self.send_response(200, content_type="application/json; charset=utf-8", body=b'{"error": "Use Backend API"}')
            else:
                self.send_response(404, content_type="text/plain; charset=utf-8", body="Not Found")
    
    try:
        server = socketserver.TCPServer((HOST, PORT), RequestHandler)
        print("SUCCESS: Frontend работает!")
        print(f"Frontend доступен по адресу: http://{HOST}:{PORT}")
        print("\nНажмите Ctrl+C для остановки всех серверов")
        
        server.serve_forever()
        
    except OSError as e:
        if "Address already in use" in str(e):
            print("ERROR: Порт 3000 уже занят! Возможно, Frontend уже запущен")
        else:
            print(f"ERROR: Не удалось запустить Frontend: {e}")
        
        # Останавливаем Backend если Frontend не запустился
        print("Остановка Backend...")
        if backend_process.poll() is None:
            backend_process.terminate()
        
        # Останавливаем Backend
        print("Программа завершена")

if __name__ == "__main__":
    start_servers()