import http.server
import socketserver
import os
import json
import socket
from http.server import SimpleHTTPRequestHandler

PORT = 3000

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

def run_server():
    # Попробуем разные адреса
    addresses = ['127.0.0.1', '0.0.0.0', 'localhost']
    
    for addr in addresses:
        try:
            server_address = (addr, PORT)
            httpd = http.server.HTTPServer(server_address, RequestHandler)
            print(f"Server started on {addr}:{PORT}")
            print(f"Test with: curl http://{addr}:{PORT}")
            httpd.serve_forever()
            return
        except OSError as e:
            print(f"Failed to bind to {addr}:{PORT} - {e}")
            continue
    
    print("Could not start server on any address")

if __name__ == '__main__':
    run_server()