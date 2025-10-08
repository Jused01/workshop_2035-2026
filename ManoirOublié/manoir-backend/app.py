# app.py
import os, random, string, time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit

from services.db import query_one, query_all, execute
from services.auth import issue_token, read_token_from_header

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})
socketio = SocketIO(app, cors_allowed_origins=os.getenv("CORS_ORIGINS", "*").split(","), async_mode="threading")

# ---------- Helpers ----------
def gen_code(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

def now_utc():
    return datetime.now(timezone.utc)

# ---------- Schema bootstrap (idempotent) ----------
INIT_SQL = [
    """
    CREATE TABLE IF NOT EXISTS games (
                                         id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(16) UNIQUE,
        status VARCHAR(16) NOT NULL,
        created_at DATETIME NOT NULL,
        started_at DATETIME NULL,
        ends_at DATETIME NULL,
        current_room_index INT NOT NULL DEFAULT 0,
        hints_left INT NOT NULL DEFAULT 3,
        seed INT NOT NULL
        ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS players (
                                           id VARCHAR(36) PRIMARY KEY,
        game_id VARCHAR(36) NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        role VARCHAR(32) NOT NULL,
        joined_at DATETIME NOT NULL,
        is_connected TINYINT(1) NOT NULL DEFAULT 1,
        score_total INT NOT NULL DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS runtime_state (
                                                 game_id VARCHAR(36) PRIMARY KEY,
        room_slug VARCHAR(64) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        solved TINYINT(1) NOT NULL DEFAULT 0,
        puzzle_state JSON NULL,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    """,
    """
    CREATE TABLE IF NOT EXISTS player_enigme (
                                                 player_id VARCHAR(36) NOT NULL,
        game_id VARCHAR(36) NOT NULL,
        slug VARCHAR(64) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        solved TINYINT(1) NOT NULL DEFAULT 0,
        score_obtenu INT NOT NULL DEFAULT 0,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (player_id, slug),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    """,
]

def ensure_schema():
    for sql in INIT_SQL:
        execute(sql)

ensure_schema()
# app.py

# ---------- Endpoint pour l'énigme 5 Poétique ----------
@app.get("/api/games/poetique-nantes-5")
def get_poem():
    claims = read_token_from_header()
    if not claims:
        return jsonify({"error": "Unauthorized", "message": "Token manquant ou invalide"}), 401

    try:
        # Récupération d'un poème aléatoire depuis la table Enigme5_Poetique
        enigme = query_one(
            "SELECT e.titre, p.texte_poeme, p.solution "
            "FROM Enigme5_Poetique p "
            "JOIN Enigme e ON p.id_poetique = e.id_enigme "
            "WHERE e.type_enigme = 'poetique' "
            "ORDER BY RAND() "
            "LIMIT 1"
        )

        if not enigme:
            # Retourner un poème de fallback si aucun n'est trouvé
            return jsonify({
                "text": "Dans les ombres du temps passé,\nUn musée se tient oublié.\nCherchez la clé de son mystère,\nDans les vers de cette prière.",
                "answer": "musée oublié"
            })

        return jsonify({
            "text": enigme["texte_poeme"],
            "answer": enigme["solution"]
        })

    except Exception as e:
        print(f"Erreur lors de la récupération du poème: {e}")
        return jsonify({
            "error": "Database error",
            "message": "Impossible de récupérer le poème"
        }), 500



# ---------- REST ----------
@app.post("/api/games")
def create_game():
    data = request.get_json(force=True) or {}
    nickname = data.get("nickname", "Agent")
    role = data.get("role", "curator")

    gid = os.urandom(16).hex()
    code = gen_code()
    seed = int(time.time()) % 100000
    execute(
        "INSERT INTO games (id, code, status, created_at, started_at, ends_at, current_room_index, hints_left, seed) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (gid, code, "waiting", now_utc(), None, None, 0, 3, seed),
    )

    pid = os.urandom(16).hex()
    execute(
        "INSERT INTO players (id, game_id, nickname, role, joined_at, is_connected) VALUES (%s,%s,%s,%s,%s,%s)",
        (pid, gid, nickname, role, now_utc(), 1),
    )

    token = issue_token(gid, pid, role)
    return jsonify({"gameId": gid, "code": code, "playerToken": token})

@app.post("/api/games/join")
def join_game():
    data = request.get_json(force=True) or {}
    code = (data.get("code") or "").upper().strip()
    nickname = data.get("nickname", "Agent")
    role = data.get("role", "analyst")

    g = query_one("SELECT id, status FROM games WHERE code=%s LIMIT 1", (code,))
    if not g:
        return jsonify({"error": "not_found"}), 404
    if g["status"] not in ("waiting", "running"):
        return jsonify({"error": "closed"}), 403

    pid = os.urandom(16).hex()
    execute(
        "INSERT INTO players (id, game_id, nickname, role, joined_at, is_connected) VALUES (%s,%s,%s,%s,%s,%s)",
        (pid, g["id"], nickname, role, now_utc(), 1),
    )
    token = issue_token(g["id"], pid, role)
    return jsonify({"gameId": g["id"], "playerToken": token})

@app.post("/api/games/start")
def start_game():
    claims = read_token_from_header()
    if not claims:
        return ("", 401)

    gid = claims["gid"]
    ends = now_utc() + timedelta(minutes=45)
    execute(
        "UPDATE games SET status=%s, started_at=%s, ends_at=%s WHERE id=%s",
        ("running", now_utc(), ends, gid),
    )
    # état initial
    execute(
        "INSERT INTO runtime_state (game_id, room_slug, attempts, solved, puzzle_state) VALUES (%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE room_slug=VALUES(room_slug), attempts=0, solved=0, puzzle_state=NULL",
        (gid, "puzzle-nantes-1", 0, 0, None),
    )
    return jsonify({"ok": True, "endsAt": ends.isoformat()})

@app.get("/api/games/<gid>")
def get_game(gid):
    g = query_one("SELECT id, code, status, created_at, started_at, ends_at, current_room_index, hints_left, seed FROM games WHERE id=%s", (gid,))
    if not g:
        return ("", 404)
    s = query_one("SELECT game_id, room_slug, attempts, solved, puzzle_state FROM runtime_state WHERE game_id=%s", (gid,))
    return jsonify({"game": g, "state": s})
# ---------- Validation des 5 énigmes Nantes ----------
EXPECTED = {
    "puzzle-nantes-1": ["reconstruit", "ok"],
    "lumiere-nantes-2": ["lumiere", "clair-obscur"],
    "son-elephant-3": ["elephant", "grand-elephant"],
    "timeline-nantes-4": ["1860 1894 1900 1955 2007"],
    "poetique-nantes-5": ["memoire de nantes", "anneaux de burel"],
}
PUZZLE_POINTS = 400

@app.post("/api/validate/<slug>")
def validate_slug(slug):
    claims = read_token_from_header()
    if not claims:
        return ("", 401)

    gid = claims["gid"]
    pid = claims["pid"]
    data = request.get_json(force=True) or {}
    attempt = (data.get("attempt") or "").strip().lower()

    ok = attempt in EXPECTED.get(slug, [])
    st = query_one("SELECT attempts, solved FROM runtime_state WHERE game_id=%s", (gid,)) or {"attempts": 0, "solved": 0}
    attempts = int(st.get("attempts", 0)) + 1
    solved = 1 if ok else int(st.get("solved", 0))
    execute(
        "INSERT INTO runtime_state (game_id, room_slug, attempts, solved, puzzle_state) VALUES (%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE attempts=%s, solved=%s",
        (gid, slug, attempts, solved, None, attempts, solved),
    )

    # per-enigme tracking for the player
    prev = query_one("SELECT attempts, solved, score_obtenu FROM player_enigme WHERE player_id=%s AND slug=%s", (pid, slug))
    p_attempts = (prev["attempts"] if prev else 0) + 1
    p_solved = 1 if ok else (prev["solved"] if prev else 0)
    p_score = (prev["score_obtenu"] if prev else 0)
    if ok and p_score == 0:
        p_score = PUZZLE_POINTS
    execute(
        "INSERT INTO player_enigme (player_id, game_id, slug, attempts, solved, score_obtenu, updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE attempts=%s, solved=%s, score_obtenu=%s, updated_at=%s",
        (pid, gid, slug, p_attempts, p_solved, p_score, now_utc(), p_attempts, p_solved, p_score, now_utc()),
    )

    if ok:
        # increment game progression
        g = query_one("SELECT current_room_index FROM games WHERE id=%s", (gid,)) or {"current_room_index": 0}
        next_idx = int(g.get("current_room_index", 0)) + 1
        execute("UPDATE games SET current_room_index=%s WHERE id=%s", (next_idx, gid))
        # increment player total score once for this puzzle
        execute("UPDATE players SET score_total = score_total + %s WHERE id=%s", (PUZZLE_POINTS, pid))

    return jsonify({"ok": ok})

# ---------- SOCKET.IO ----------
@socketio.on("connect")
def on_connect():
    emit("system:hello", {"msg": "connected"})

@socketio.on("room:join")
def on_room_join(data):
    claims = read_token_from_header()
    if not claims:
        # try token from event payload
        try:
            import jwt
            from services.auth import JWT_SECRET
            token = (data or {}).get("token")
            if token:
                claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except Exception:
            claims = None
    if not claims:
        emit("system:error", {"msg": "unauthorized"}); return
    gid = claims["gid"]
    join_room(gid)
    emit("room:joined", {"gid": gid})

@socketio.on("chat:msg")
def on_chat_msg(data):
    token_claims = read_token_from_header()
    if not token_claims:
        return
    gid = token_claims["gid"]
    txt = (data or {}).get("text", "").strip()[:500]
    if not txt:
        return
    socketio.emit("chat:msg", {"from": token_claims["pid"], "text": txt}, room=gid)

@socketio.on("puzzle:state")
def on_puzzle_state(data):
    token_claims = read_token_from_header()
    if not token_claims:
        return
    gid = token_claims["gid"]
    socketio.emit("puzzle:state", data, room=gid, include_self=False)

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
