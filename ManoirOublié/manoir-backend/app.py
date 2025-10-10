# app.py - Système multijoueur complet
import os, random, string, time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import Flask, jsonify, request, Response
import requests
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit, leave_room

from services.db import query_one, query_all, execute, get_conn
from services.auth import issue_token, read_token_from_header

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})
socketio = SocketIO(app, cors_allowed_origins=os.getenv("CORS_ORIGINS", "*").split(","), async_mode="threading")

# ---------- Initialisation de la base de données ----------
def init_database():
    """Initialise les tables nécessaires"""
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Créer la table game_enigmes_completed si elle n'existe pas
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS game_enigmes_completed (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        game_id VARCHAR(255) NOT NULL,
                        enigme_id INT NOT NULL,
                        completed_by VARCHAR(255) NOT NULL,
                        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_game_enigme (game_id, enigme_id),
                        INDEX idx_game_id (game_id),
                        INDEX idx_enigme_id (enigme_id),
                        INDEX idx_completed_at (completed_at)
                    ) COMMENT = 'Table pour tracker les énigmes complétées globalement par partie'
                """)
                conn.commit()
                print("✅ Table game_enigmes_completed initialisée")
    except Exception as e:
        print(f"❌ Erreur lors de l'initialisation de la base de données: {e}")

# Initialiser la base de données au démarrage
init_database()

# ---------- Helpers ----------
def gen_code(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

def now_utc():
    return datetime.now(timezone.utc)

def get_game_players(game_id):
    """Récupère la liste des joueurs d'une partie"""
    players = query_all(
        "SELECT id, nickname, role, is_connected, score_total FROM players WHERE game_id=%s",
        (game_id,)
    )
    return [{
        'id': p['id'],
        'name': p['nickname'],
        'role': p['role'],
        'ready': bool(p['is_connected']),
        'score': p['score_total']
    } for p in (players or [])]

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

# ---------- REST ENDPOINTS ----------

@app.post("/api/games")
def create_game():
    """Créer une nouvelle partie"""
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
    """Rejoindre une partie avec un code"""
    data = request.get_json(force=True) or {}
    code = (data.get("code") or "").upper().strip()
    nickname = data.get("nickname", "Agent")
    role = data.get("role", "analyst")

    g = query_one("SELECT id, status FROM games WHERE code=%s LIMIT 1", (code,))
    if not g:
        return jsonify({"error": "not_found", "message": "Code de partie invalide"}), 404
    if g["status"] not in ("waiting", "running"):
        return jsonify({"error": "closed", "message": "Cette partie est terminée"}), 403

    # Vérifier le nombre de joueurs
    player_count = query_one("SELECT COUNT(*) as count FROM players WHERE game_id=%s", (g["id"],))
    if player_count and player_count["count"] >= 4:
        return jsonify({"error": "full", "message": "Cette partie est complète (4 joueurs max)"}), 403

    pid = os.urandom(16).hex()
    execute(
        "INSERT INTO players (id, game_id, nickname, role, joined_at, is_connected) VALUES (%s,%s,%s,%s,%s,%s)",
        (pid, g["id"], nickname, role, now_utc(), 1),
    )

    token = issue_token(g["id"], pid, role)

    # Notifier les autres joueurs via Socket.IO
    socketio.emit("player:joined", {
        "player": {"id": pid, "name": nickname, "role": role, "ready": True, "score": 0}
    }, room=g["id"])

    return jsonify({"gameId": g["id"], "code": code, "playerToken": token})

@app.post("/api/games/join-random")
def join_random_game():
    """Rejoindre une partie aléatoire en attente"""
    data = request.get_json(force=True) or {}
    nickname = data.get("nickname", "Agent")
    role = data.get("role", "analyst")

    # Trouver une partie en attente avec moins de 4 joueurs
    g = query_one(
        """SELECT g.id, g.code, g.status, COUNT(p.id) as player_count
           FROM games g
                    LEFT JOIN players p ON g.id = p.game_id
           WHERE g.status = 'waiting'
           GROUP BY g.id
           HAVING player_count < 4
           ORDER BY g.created_at DESC
               LIMIT 1""",
        ()
    )

    if not g:
        # Aucune partie disponible, créer une nouvelle
        return create_game()

    pid = os.urandom(16).hex()
    execute(
        "INSERT INTO players (id, game_id, nickname, role, joined_at, is_connected) VALUES (%s,%s,%s,%s,%s,%s)",
        (pid, g["id"], nickname, role, now_utc(), 1),
    )

    token = issue_token(g["id"], pid, role)

    # Notifier les autres joueurs
    socketio.emit("player:joined", {
        "player": {"id": pid, "name": nickname, "role": role, "ready": True, "score": 0}
    }, room=g["id"])

    return jsonify({"gameId": g["id"], "code": g["code"], "playerToken": token})

@app.post("/api/games/ready")
def toggle_ready():
    """Toggle player ready status"""
    claims = read_token_from_header()
    if not claims:
        return ("", 401)

    data = request.get_json(force=True) or {}
    ready = data.get("ready", True)

    gid = claims["gid"]
    pid = claims["pid"]

    execute(
        "UPDATE players SET is_connected=%s WHERE id=%s",
        (1 if ready else 0, pid)
    )

    # Notifier tous les joueurs du changement
    players = get_game_players(gid)
    socketio.emit("players:update", {"players": players}, room=gid)

    return jsonify({"ok": True})

@app.get("/api/games/<gid>/players")
def get_players(gid):
    """Récupère la liste des joueurs"""
    players = get_game_players(gid)
    return jsonify({"players": players})

@app.post("/api/games/start")
def start_game():
    """Démarrer la partie"""
    claims = read_token_from_header()
    if not claims:
        return ("", 401)

    gid = claims["gid"]
    ends = now_utc() + timedelta(minutes=45)
    execute(
        "UPDATE games SET status=%s, started_at=%s, ends_at=%s WHERE id=%s",
        ("running", now_utc(), ends, gid),
    )
    execute(
        "INSERT INTO runtime_state (game_id, room_slug, attempts, solved, puzzle_state) VALUES (%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE room_slug=VALUES(room_slug), attempts=0, solved=0, puzzle_state=NULL",
        (gid, "puzzle-nantes-1", 0, 0, None),
    )

    # Notifier tous les joueurs que la partie démarre
    socketio.emit("game:started", {"endsAt": ends.isoformat()}, room=gid)

    return jsonify({"ok": True, "endsAt": ends.isoformat()})

@app.get("/api/games/<gid>")
def get_game(gid):
    """Récupérer les informations d'une partie"""
    g = query_one("SELECT id, code, status, created_at, started_at, ends_at, current_room_index, hints_left, seed FROM games WHERE id=%s", (gid,))
    if not g:
        return ("", 404)
    s = query_one("SELECT game_id, room_slug, attempts, solved, puzzle_state FROM runtime_state WHERE game_id=%s", (gid,))
    players = get_game_players(gid)
    return jsonify({"game": g, "state": s, "players": players})

# ---------- Énigme 5 Poétique ----------
@app.get("/api/games/poetique-nantes-5")
def get_poem():
    claims = read_token_from_header()
    if not claims:
        return jsonify({"error": "Unauthorized", "message": "Token manquant ou invalide"}), 401

    try:
        enigme = query_one(
            "SELECT e.titre, p.texte_poeme, p.solution "
            "FROM Enigme5_Poetique p "
            "JOIN Enigme e ON p.id_poetique = e.id_enigme "
            "WHERE e.type_enigme = 'poetique' "
            "ORDER BY RAND() "
            "LIMIT 1"
        )

        if not enigme:
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

@app.get("/api/enigmes/3")
def get_enigme3():
    """Retourne aléatoirement un enregistrement pour l'énigme 3 (son, options, réponse)."""
    sound_attempts = [
        ("SELECT url_audio, options_json, correct FROM Enigme3_Son ORDER BY RAND() LIMIT 1", ["url_audio", "options_json", "correct"]),
        ("SELECT sound_url, options_json, correct FROM Enigme3_Son ORDER BY RAND() LIMIT 1", ["sound_url", "options_json", "correct"]),
        ("SELECT url_son, options_json, correct FROM Enigme3_Son ORDER BY RAND() LIMIT 1", ["url_son", "options_json", "correct"]),
        ("SELECT url_son, bonne_reponse FROM Enigme3_Son ORDER BY RAND() LIMIT 1", ["url_son", "bonne_reponse"]),
        ("SELECT url_audio, option1, option2, option3, correct FROM Enigme3_Son ORDER BY RAND() LIMIT 1", ["url_audio", "option1", "option2", "option3", "correct"]),
        ("SELECT sound_url, option1, option2, option3, correct FROM Enigme3_Son ORDER BY RAND() LIMIT 1", ["sound_url", "option1", "option2", "option3", "correct"]),
        ("SELECT audio, options_json, answer as correct FROM Enigme3 ORDER BY RAND() LIMIT 1", ["audio", "options_json", "correct"]),
        ("SELECT audio_url as url_audio, options as options_json, correct FROM Enigme3 ORDER BY RAND() LIMIT 1", ["url_audio", "options_json", "correct"]),
    ]

    import json

    for sql, keys in sound_attempts:
        try:
            row = query_one(sql)
            if not row:
                continue

            def g(k):
                return row.get(k) if isinstance(row, dict) else row[k]

            # URL du son
            sound_key = None
            for k in ("url_audio", "sound_url", "url_son", "audio"):
                if k in keys:
                    sound_key = k
                    break
            sound_url = g(sound_key) if sound_key else None

            # Options
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
                tmp = []
                for k in ("option1", "option2", "option3", "option4"):
                    if k in keys:
                        v = g(k)
                        if v:
                            tmp.append(str(v))
                options = [o for o in tmp if o]

            # Réponse correcte
            correct = None
            if "correct" in keys:
                c = g("correct"); correct = str(c) if c is not None else None
            elif "bonne_reponse" in keys:
                c = g("bonne_reponse"); correct = str(c) if c is not None else None

            resp = {
                "sounds": [sound_url] if sound_url else [],
                "options": options,
                "correct": correct,
            }

            # Générer des options si vides mais réponse dispo
            if (not resp["options"]) and resp["correct"]:
                base_opts = [resp["correct"], "éléphant", "machine"]
                uniq = []
                for o in base_opts:
                    s = str(o)
                    if s not in uniq:
                        uniq.append(s)
                random.shuffle(uniq)
                resp["options"] = uniq

            if resp["sounds"] or resp["options"] or resp["correct"]:
                return jsonify(resp)
        except Exception:
            continue

    return jsonify({"sounds": [], "options": [], "correct": None})

@app.get("/api/enigmes/1")
def get_enigme1():
    """Retourne une image aléatoire parmi toutes les images de la table Enigme1_Puzzle.
    Chaque enregistrement peut contenir jusqu'à trois colonnes d'URL (url_photo_1..3).
    """
    try:
        rows = query_all("SELECT url_photo_1, url_photo_2, url_photo_3 FROM Enigme1_Puzzle")
        if not rows:
            return jsonify({"images": []})

        # Collecter toutes les URLs non vides de tous les enregistrements
        all_images = []
        for row in rows:
            if isinstance(row, dict):
                candidates = [row.get("url_photo_1"), row.get("url_photo_2"), row.get("url_photo_3")]
            else:
                candidates = [row["url_photo_1"], row["url_photo_2"], row["url_photo_3"]]
            for u in candidates:
                if u:
                    all_images.append(str(u))

        if not all_images:
            return jsonify({"images": []})

        # Choisir une image aléatoire
        selected = random.choice(all_images)
        return jsonify({"images": [selected]})
    except Exception as e:
        return jsonify({"images": [], "error": str(e)}), 500
# ---------- Validation des énigmes ----------
EXPECTED = {
    "puzzle-nantes-1": ["reconstruit", "ok", "la source"],
    "lumiere-nantes-2": ["lumiere", "clair-obscur", "5638", "6142"],
    "son-elephant-3": ["elephant", "grand-elephant", "machines de l'île"],
    "timeline-nantes-4": ["1860 1894 1900 1955 2007", "ok"],
    "poetique-nantes-5": ["memoire de nantes", "anneaux de burel", "passage pommeraye"],
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

    allowed = set(EXPECTED.get(slug, []))
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
        # Mapper le slug vers l'ID de l'énigme
        enigme_mapping = {
            "puzzle-nantes-1": 1,
            "lumiere-nantes-2": 2,
            "son-elephant-3": 3,
            "timeline-nantes-4": 4,
            "poetique-nantes-5": 5
        }
        enigme_id = enigme_mapping.get(slug, 0)
        
        # Vérifier si cette énigme n'a pas déjà été complétée globalement
        global_completed = query_one("SELECT id FROM game_enigmes_completed WHERE game_id=%s AND enigme_id=%s", (gid, enigme_id))
        
        if not global_completed:
            # Marquer l'énigme comme complétée globalement
            execute("INSERT INTO game_enigmes_completed (game_id, enigme_id, completed_by, completed_at) VALUES (%s,%s,%s,%s)", 
                   (gid, enigme_id, pid, now_utc()))
            
            # Mettre à jour le score du joueur
            execute("UPDATE players SET score_total = score_total + %s WHERE id=%s", (PUZZLE_POINTS, pid))
            
            # Notifier tous les joueurs de la réussite
            player = query_one("SELECT nickname FROM players WHERE id=%s", (pid,))
            
            # Récupérer toutes les énigmes complétées pour cette partie
            completed_enigmes = query_all("SELECT enigme_id FROM game_enigmes_completed WHERE game_id=%s", (gid,))
            completed_ids = [row["enigme_id"] for row in completed_enigmes]
            
            socketio.emit("puzzle:solved", {
                "player": player["nickname"] if player else "Un joueur",
                "slug": slug,
                "enigmeId": enigme_id,
                "points": PUZZLE_POINTS,
                "globalCompletedEnigmes": completed_ids
            }, room=gid)
            
            # Vérifier si toutes les énigmes sont complétées
            if len(completed_ids) >= 5:
                socketio.emit("game:completed", {
                    "message": "Toutes les énigmes ont été résolues !",
                    "completedEnigmes": completed_ids
                }, room=gid)
        else:
            # L'énigme a déjà été complétée par quelqu'un d'autre
            return jsonify({"ok": False, "message": "Cette énigme a déjà été résolue par un autre joueur"})

    return jsonify({"ok": ok})

@app.get("/api/game/<game_id>/enigmes-completed")
def get_completed_enigmes(game_id):
    """Récupérer les énigmes complétées pour une partie"""
    claims = read_token_from_header()
    if not claims:
        return ("", 401)
    
    gid = claims["gid"]
    if gid != game_id:
        return ("", 403)
    
    try:
        completed_enigmes = query_all("SELECT enigme_id, completed_by, completed_at FROM game_enigmes_completed WHERE game_id=%s ORDER BY completed_at", (gid,))
        completed_ids = [row["enigme_id"] for row in completed_enigmes]
        
        return jsonify({
            "completedEnigmes": completed_ids,
            "details": completed_enigmes
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- SOCKET.IO ----------
@socketio.on("connect")
def on_connect():
    print("✅ Client connected")
    emit("system:hello", {"msg": "connected"})

@socketio.on("disconnect")
def on_disconnect():
    print("❌ Client disconnected")

@socketio.on("room:join")
def on_room_join(data):
    """Rejoindre une room Socket.IO"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            emit("system:error", {"msg": "No token provided"})
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]
        pid = claims["pid"]

        join_room(gid)

        # Récupérer et envoyer la liste des joueurs
        players = get_game_players(gid)
        
        # Récupérer les énigmes complétées globalement
        completed_enigmes = query_all("SELECT enigme_id FROM game_enigmes_completed WHERE game_id=%s", (gid,))
        completed_ids = [row["enigme_id"] for row in completed_enigmes]
        
        emit("room:joined", {
            "gid": gid, 
            "players": players,
            "gameState": {
                "completedEnigmes": completed_ids,
                "gamePhase": "completed" if len(completed_ids) >= 5 else "playing"
            }
        })

        # Notifier les autres joueurs
        player = query_one("SELECT nickname FROM players WHERE id=%s", (pid,))
        emit("player:connected", {
            "player": player["nickname"] if player else "Un joueur"
        }, room=gid, include_self=False)

        print(f"✅ Player {player['nickname'] if player else pid} joined room {gid}")

    except Exception as e:
        print(f"❌ Error in room:join: {e}")
        emit("system:error", {"msg": "unauthorized"})

@socketio.on("chat:msg")
def on_chat_msg(data):
    """Gérer les messages de chat"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]
        pid = claims["pid"]

        txt = (data or {}).get("text", "").strip()[:500]
        if not txt:
            return

        player = query_one("SELECT nickname FROM players WHERE id=%s", (pid,))
        sender_name = player["nickname"] if player else "Anonyme"

        print(f"💬 Chat from {sender_name} in {gid}: {txt}")

        socketio.emit("chat:msg", {
            "from": pid,
            "sender": sender_name,
            "text": txt,
            "timestamp": datetime.now().isoformat()
        }, room=gid)

    except Exception as e:
        print(f"❌ Error in chat:msg: {e}")

@socketio.on("puzzle:state")
def on_puzzle_state(data):
    """Synchroniser l'état des puzzles entre joueurs"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]

        socketio.emit("puzzle:state", data, room=gid, include_self=False)

    except Exception as e:
        print(f"❌ Error in puzzle:state: {e}")

@socketio.on("game:state:update")
def on_game_state_update(data):
    """Synchroniser l'état global du jeu entre joueurs"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]

        socketio.emit("game:state:update", data, room=gid, include_self=False)

    except Exception as e:
        print(f"❌ Error in game:state:update: {e}")

@socketio.on("player:enigme:select")
def on_player_enigme_select(data):
    """Notifier la sélection d'énigme d'un joueur"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]
        pid = claims["pid"]

        player = query_one("SELECT nickname FROM players WHERE id=%s", (pid,))
        player_name = player["nickname"] if player else "Un joueur"

        socketio.emit("player:enigme:select", {
            "enigmeId": data.get("enigmeId"),
            "playerName": player_name
        }, room=gid, include_self=False)

    except Exception as e:
        print(f"❌ Error in player:enigme:select: {e}")

@socketio.on("player:position:update")
def on_player_position_update(data):
    """Synchroniser la position des joueurs dans la salle de sélection"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]
        pid = claims["pid"]

        player = query_one("SELECT nickname FROM players WHERE id=%s", (pid,))
        player_name = player["nickname"] if player else "Un joueur"

        socketio.emit("player:position:update", {
            "x": data.get("x"),
            "y": data.get("y"),
            "playerName": player_name
        }, room=gid, include_self=False)

    except Exception as e:
        print(f"❌ Error in player:position:update: {e}")

@socketio.on("game:state:request")
def on_game_state_request(data):
    """Demander l'état actuel du jeu"""
    try:
        import jwt
        from services.auth import JWT_SECRET

        token = (data or {}).get("token")
        if not token:
            return

        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        gid = claims["gid"]
        
        # Récupérer les énigmes complétées globalement
        completed_enigmes = query_all("SELECT enigme_id FROM game_enigmes_completed WHERE game_id=%s", (gid,))
        completed_ids = [row["enigme_id"] for row in completed_enigmes]
        
        emit("game:state:response", {
            "completedEnigmes": completed_ids,
            "gamePhase": "completed" if len(completed_ids) >= 5 else "playing"
        })

    except Exception as e:
        print(f"❌ Error in game:state:request: {e}")

# ---------- Proxy pour médias ----------
@app.get("/audio-proxy")
def audio_proxy():
    """Proxy audio pour contourner les problèmes CORS"""
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "missing_url"}), 400

    try:
        range_header = request.headers.get('Range')
        req_headers = {"Range": range_header} if range_header else {}
        r = requests.get(url, headers=req_headers, stream=True, timeout=15)
        if r.status_code not in (200, 206):
            return jsonify({"error": "fetch_failed", "status": r.status_code}), 400

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

@app.get("/health")
def health():
    return {"ok": True, "timestamp": now_utc().isoformat()}

if __name__ == "__main__":
    print("🚀 Server starting...")
    socketio.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))