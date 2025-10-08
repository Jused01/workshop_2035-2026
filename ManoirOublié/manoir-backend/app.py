# app.py
import os, random, string, time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import Flask, jsonify, request, Response
import requests
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

    # Accept static expected answers
    allowed = set(EXPECTED.get(slug, []))
    # Additionally, for the first puzzle, accept the DB solution if present
    if slug == "puzzle-nantes-1":
        row = query_one("SELECT solution FROM Enigme1_Puzzle ORDER BY id_puzzle DESC LIMIT 1")
        if row:
            sol = (row.get("solution") if isinstance(row, dict) else row["solution"]) or ""
            if sol:
                allowed.add(str(sol).strip().lower())

    ok = attempt in allowed

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

@app.get("/api/enigmes/1")
def get_enigme1():
    try:
        row = query_one(
            "SELECT url_photo_1, url_photo_2, url_photo_3 FROM Enigme1_Puzzle ORDER BY id_puzzle DESC LIMIT 1"
        )
        if not row:
            return jsonify({"images": []})
        images = [row.get("url_photo_1"), row.get("url_photo_2"), row.get("url_photo_3")] \
            if isinstance(row, dict) else [row["url_photo_1"], row["url_photo_2"], row["url_photo_3"]]
        return jsonify({"images": [u for u in images if u]})
    except Exception as e:
        return jsonify({"images": [], "error": str(e)}), 500

@app.get("/api/enigmes/3")
def get_enigme3():
    """Retourne l'URL du son pour l'énigme 3 depuis MySQL.
    Essaie plusieurs noms de colonnes/tables possibles et renvoie la plus récente.
    """
    # Try a few common schemas without crashing the app if one doesn't exist
    sound_attempts = [
        ("SELECT url_audio, options_json, correct FROM Enigme3_Son ORDER BY id DESC LIMIT 1", ["url_audio", "options_json", "correct"]),
        ("SELECT sound_url, options_json, correct FROM Enigme3_Son ORDER BY id DESC LIMIT 1", ["sound_url", "options_json", "correct"]),
        ("SELECT url_son, options_json, correct FROM Enigme3_Son ORDER BY id DESC LIMIT 1", ["url_son", "options_json", "correct"]),
        ("SELECT url_son, bonne_reponse FROM Enigme3_Son ORDER BY id_son DESC LIMIT 1", ["url_son", "bonne_reponse"]),
        ("SELECT url_audio, option1, option2, option3, correct FROM Enigme3_Son ORDER BY id DESC LIMIT 1", ["url_audio", "option1", "option2", "option3", "correct"]),
        ("SELECT sound_url, option1, option2, option3, correct FROM Enigme3_Son ORDER BY id DESC LIMIT 1", ["sound_url", "option1", "option2", "option3", "correct"]),
        ("SELECT audio, options_json, answer as correct FROM Enigme3 ORDER BY id DESC LIMIT 1", ["audio", "options_json", "correct"]),
        ("SELECT audio_url as url_audio, options as options_json, correct FROM Enigme3 ORDER BY id DESC LIMIT 1", ["url_audio", "options_json", "correct"]),
    ]

    import json

    for sql, keys in sound_attempts:
        try:
            row = query_one(sql)
            if not row:
                continue
            # Normalize dict-like access
            def g(k):
                return row.get(k) if isinstance(row, dict) else row[k]

            # Extract sound URL candidate
            sound_key = None
            for k in ("url_audio", "sound_url", "url_son", "audio"):
                if k in keys:
                    sound_key = k
                    break
            sound_url = g(sound_key) if sound_key else None

            # Extract options
            options = []
            if "options_json" in keys:
                raw = g("options_json")
                if raw:
                    try:
                        parsed = json.loads(raw) if isinstance(raw, str) else raw
                        if isinstance(parsed, list):
                            options = [str(x) for x in parsed if x]
                    except Exception:
                        options = []
            else:
                opts = []
                for k in ("option1", "option2", "option3", "option4"):
                    if k in keys:
                        v = g(k)
                        if v:
                            opts.append(str(v))
                options = [o for o in opts if o]

            correct = None
            if "correct" in keys:
                c = g("correct")
                correct = str(c) if c is not None else None
            elif "bonne_reponse" in keys:
                c = g("bonne_reponse")
                correct = str(c) if c is not None else None

            resp = {
                "sounds": [sound_url] if sound_url else [],
                "options": options,
                "correct": correct,
            }
            # If no options provided from DB but we have a correct answer, synthesize simple options
            if (not resp["options"]) and resp["correct"]:
                base_opts = [resp["correct"], "éléphant", "machine"]
                # de-duplicate and keep strings
                opts_unique = []
                for o in base_opts:
                    s = str(o)
                    if s not in opts_unique:
                        opts_unique.append(s)
                random.shuffle(opts_unique)
                resp["options"] = opts_unique
            # Return as soon as we have at least sound or options/correct
            if resp["sounds"] or resp["options"] or resp["correct"]:
                return jsonify(resp)
        except Exception:
            continue

    # As a last resort, return empty payload
    return jsonify({"sounds": [], "options": [], "correct": None})

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

@app.get("/audio-proxy")
def audio_proxy():
    """Proxy audio pour contourner les problèmes CORS"""
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "missing_url"}), 400

    try:
        # Forward Range header if present for streaming support
        range_header = request.headers.get('Range')
        req_headers = {"Range": range_header} if range_header else {}
        r = requests.get(url, headers=req_headers, stream=True, timeout=15)
        if r.status_code not in (200, 206):
            return jsonify({"error": "fetch_failed", "status": r.status_code}), 400

        # Best-effort content type detection
        ct = r.headers.get("Content-Type") or ""
        if not ct or ct == "application/octet-stream":
            lower = url.lower()
            if lower.endswith('.mp3'):
                ct = 'audio/mpeg'
            elif lower.endswith('.wav'):
                ct = 'audio/wav'
            elif lower.endswith('.ogg') or lower.endswith('.oga'):
                ct = 'audio/ogg'
            else:
                ct = 'audio/mpeg'

        headers = {
            "Content-Type": ct,
            "Access-Control-Allow-Origin": "*",
        }
        # Pass through range/length headers if present
        for h in ("Content-Range", "Accept-Ranges", "Content-Length"):
            if r.headers.get(h):
                headers[h] = r.headers[h]

        status = r.status_code
        return Response(r.iter_content(chunk_size=65536), headers=headers, status=status)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.get("/image-proxy")
def image_proxy():
    """Proxy image pour contourner les problèmes CORS/mixed content"""
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "missing_url"}), 400

    try:
        r = requests.get(url, stream=True, timeout=10)
        if r.status_code != 200:
            return jsonify({"error": "fetch_failed", "status": r.status_code}), 400

        content_type = r.headers.get("Content-Type", "image/jpeg")
        headers = {
            "Content-Type": content_type,
            "Access-Control-Allow-Origin": "*"
        }
        return Response(r.iter_content(chunk_size=4096), headers=headers)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
