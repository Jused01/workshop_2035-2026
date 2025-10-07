from services.db import get_conn

if __name__ == "__main__":
    with get_conn() as conn:
        with conn.cursor(dictionary=True) as cur:
            cur.execute("SELECT 1 AS ok")
            row = cur.fetchone()
            print("DB OK:", row)
