# services/auth.py
import os, jwt, datetime
from flask import request

JWT_SECRET = os.getenv("JWT_SECRET", "dev")
EXPIRES = int(os.getenv("JWT_EXPIRES_MIN", "120"))

def issue_token(game_id: str, player_id: str, role: str):
    payload = {
        "gid": game_id,
        "pid": player_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=EXPIRES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def read_token_from_header():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None
