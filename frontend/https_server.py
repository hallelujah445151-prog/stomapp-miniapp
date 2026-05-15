"""
HTTPS Server для StomApp Mini App
Работает на порту 8443 с самоподписанными сертификатами
"""

import http.server
import ssl
import os
import json
from http.server import SimpleHTTPRequestHandler

PORT = 8443
HOST = 'localhost'
CERT_DIR = r"C:\Users\crush\AppData\Roaming\projects\stomapp\mini-app\certs"
CERT_FILE = os.path.join(CERT_DIR, "localhost.crt")
KEY_FILE = os.path.join(CERT_DIR, "localhost.key")

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'')
        return

class RequestHandler(CORSRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        
        try:
            file_path = self.path.lstrip('/')
            if os.path.exists(file_path) and os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                content_type = self.guess_type(file_path)
                if content_type != 'text/plain':
                    self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'404 Not Found')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'500 Server Error: {str(e)}'.encode())
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b''
        
        try:
            data = json.loads(post_data)
            result = self.process_api_request(data)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False, indent=2).encode())
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}, ensure_ascii=False, indent=2).encode())
    
    def process_api_request(self, data):
        path = data.get('path', '')
        method = data.get('method', 'GET')
        
        if path == '/api/orders':
            return {
                "orders": [
                    {
                        "id": 1,
                        "doctor_id": 1,
                        "technician_id": 1,
                        "patient_name": "Тестовый пациент",
                        "work_type": "Цирконевая коронка на импланте",
                        "quantity": 3,
                        "deadline": "15.05.2026",
                        "description": "Тестовое описание",
                        "photo_id": None,
                        "created_at": "2026-05-14 15:00:00",
                        "status": "in_progress"
                    }
                ]
            }
        
        return {"error": "Invalid endpoint"}
    
    def guess_type(self, path):
        types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        }
        ext = os.path.splitext(path)[1].lower()
        return types.get(ext, 'text/plain')

def run_https_server():
    server_address = (HOST, PORT)
    
    # Создаем HTTP сервер
    httpd = http.server.HTTPServer(server_address, RequestHandler)
    
    # Настраиваем SSL
    ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    ssl_context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
    
    httpd.socket = ssl_context.wrap_socket(httpd.socket, server_side=True)
    
    print("Starting HTTPS Server...")
    print(f"Server running at: https://{HOST}:{PORT}")
    print(f"Certificate: {CERT_FILE}")
    print(f"Key: {KEY_FILE}")
    print("Press Ctrl+C to stop")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"\nServer error: {e}")

if __name__ == '__main__':
    run_https_server()