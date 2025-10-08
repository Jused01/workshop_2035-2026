import os
from mysql.connector import pooling
from urllib.parse import urlparse
from dotenv import load_dotenv

# Charge le ..env local (ou variables déjà dans l'environnement Clever Cloud)
load_dotenv()

_pool = None

def _config_from_env():
    url = os.getenv("DATABASE_URL") or os.getenv("CC_MYSQL_ADDON_URI") or os.getenv("MYSQL_ADDON_URI")
    if url and url.startswith("mysql://"):
        parsed = urlparse(url)
        return {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 3306,
            "user": parsed.username or "root",
            "password": parsed.password or "",
            "database": (parsed.path or "/manoir").lstrip("/"),
        }
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", 3306)),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "manoir"),
    }

def get_pool():
    global _pool
    if _pool:
        return _pool
    cfg = _config_from_env()
    _pool = pooling.MySQLConnectionPool(
        pool_name=os.getenv("DB_POOL_NAME", "manoir_pool"),
        pool_size=int(os.getenv("DB_POOL_SIZE", 4)),
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
        autocommit=True,
    )
    return _pool

def get_conn():
    return get_pool().get_connection()

def query_one(sql: str, params: tuple = ()):
    with get_conn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            return cur.fetchone()

def query_all(sql: str, params: tuple = ()):
    with get_conn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            return cur.fetchall()

def execute(sql: str, params: tuple = ()):
    with get_conn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute(sql, params)
            return cur.lastrowid
