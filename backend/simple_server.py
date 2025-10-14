"""
Servidor HTTP simple para probar la conectividad
"""

import http.server
import socketserver
import json

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "ok", "message": "Servidor funcionando"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("127.0.0.1", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Servidor ejecutándose en http://127.0.0.1:{PORT}")
        httpd.serve_forever()
