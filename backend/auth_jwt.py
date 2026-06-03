import jwt, datetime, os, json, sqlite3

_jwt_secret = None

def get_jwt_secret():
    global _jwt_secret
    if _jwt_secret:
        return _jwt_secret
    _jwt_secret = os.getenv('JWT_SECRET', 'stomapp-jwt-secret-key-2026')
    return _jwt_secret

def create_token(user_id: int, name: str, role: str, is_admin: bool) -> str:
    payload = {
        'user_id': user_id,
        'name': name,
        'role': role,
        'is_admin': is_admin,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm='HS256')

def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
