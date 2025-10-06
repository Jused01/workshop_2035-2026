# app.py
import os, random, string, time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, emit

from services.firestore import (
    games_col, game_doc, players_col, chat_col, runtime_state_doc
)
from services.auth import issue_token, read_token_from_header

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})
socketio = SocketIO(app,
                    cors_allowed_origins=os.getenv("CORS_ORIGINS","*").split(","),
                    async_mode="threading")

# ---------- Helpers ----------
def gen_code(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))

def now_utc():
    return datetime.now(timezone.utc)

# ---------- REST ----------
@app.post("/api/games")
def create_game():
    data = request.get_json(force=True) or {}
    nickname = data.get("nickname","Agent")
    role = data.get("role","curator")
    ref = games_col().document()

    game = {
        "code": gen_code(),
        "status": "waiting",
        "createdAt": now_utc(),
        "startedAt": None,
        "endsAt": None,
        "currentRoomIndex": 0,
        "hintsLeft": 3,
        "seed": int(time.time()) % 100000
    }
    ref.set(game)

    pref = players_col(ref.id).document()
    pref.set({
        "nickname": nickname,
        "role": role,
        "joinedAt": now_utc(),
        "isConnected": True
    })

    token = issue_token(ref.id, pref.id, role)
    return jsonify({"gameId": ref.id, "code": game["code"], "playerToken": token})

@app.post("/api/games/join")
def join_game():
    data = request.get_json(force=True) or {}
    code = (data.get("code") or "").upper().strip()
    nickname = data.get("nickname","Agent")
    role = data.get("role","analyst")

    qs = games_col().where("code","==",code).limit(1).stream()
    doc = next(qs, None)
    if not doc:
        return jsonify({"error":"not_found"}), 404

    if doc.get("status") not in ("waiting","running"):
        return jsonify({"error":"closed"}), 403

    pref = players_col(doc.id).document()
    pref.set({
        "nickname": nickname,
        "role": role,
        "joinedAt": now_utc(),
        "isConnected": True
    })
    token = issue_token(doc.id, pref.id, role)
    return jsonify({"gameId": doc.id, "playerToken": token})

@app.post("/api/games/start")
def start_game():
    claims = read_token_from_header()
    if not claims:
        return ("",401)

    gid = claims["gid"]
    ends = now_utc() + timedelta(minutes=45)
    game_ref = game_doc(gid)
    game_ref.update({"status":"running","startedAt": now_utc(),"endsAt": ends})

    # état initial de la première salle
    runtime_state_doc(gid).set({
        "roomSlug":"puzzle-nantes-1",
        "puzzleState": {},
        "attempts": 0,
        "solved": False
    })
    return jsonify({"ok": True, "endsAt": ends.isoformat()})

@app.get("/api/games/<gid>")
def get_game(gid):
    gdoc = game_doc(gid).get()
    if not gdoc.exists:
        return ("",404)
    g = gdoc.to_dict()
    sdoc = runtime_state_doc(gid).get()
    s = sdoc.to_dict() if sdoc.exists else None
    return jsonify({"game": g, "state": s})

# ---------- Validation des 5 énigmes Nantes ----------
# 1) Puzzle visuel (œuvre nantaise reconstituée) -> on attend un "code" donné par le front quand terminé
# 2) Jeu de lumière -> mot-clé (ex: "clair-obscur" ou "lumiere")
# 3) Son de l'Eléphant -> "elephant" ou le titre du son
# 4) Timeline événements artistiques à Nantes -> ordre validé
# 5) Enigme poétique -> mot/phrase clé, qui débloque la fin

EXPECTED = {
    "puzzle-nantes-1": ["reconstruit", "ok"],               # le front envoie "ok" quand le puzzle est fini
    "lumiere-nantes-2": ["lumiere", "clair-obscur"],
    "son-elephant-3": ["elephant", "grand-elephant"],
    "timeline-nantes-4": ["1860 1894 1900 1955 2007"],      # exemple d'ordre (à ajuster)
    "poetique-nantes-5": ["memoire de nantes", "anneaux de burel"]  # exemples (à adapter à ton texte)
}

@app.post("/api/validate/<slug>")
def validate_slug(slug):
    claims = read_token_from_header()
    if not claims:
        return ("",401)

    gid = claims["gid"]
    data = request.get_json(force=True) or {}
    attempt = (data.get("attempt") or "").strip().lower()

    ok = attempt in EXPECTED.get(slug, [])
    st_ref = runtime_state_doc(gid)
    cur = st_ref.get().to_dict() or {}
    cur["attempts"] = int(cur.get("attempts",0)) + 1
    if ok:
        cur["solved"] = True
    st_ref.set(cur, merge=True)

    if ok:
        # avancer la salle
        gref = game_doc(gid)
        g = gref.get().to_dict()
        next_idx = int(g.get("currentRoomIndex",0)) + 1
        gref.update({"currentRoomIndex": next_idx})
        # choisir le prochain slug en fonction de l'index
        next_slug = ["puzzle-nantes-1","lumiere-nantes-2","son-elephant-3","timeline-nantes-4","poetique-nantes-5"]
        if next_idx < len(next_slug):
            st_ref.set({"roomSlug": next_slug[next_idx], "puzzleState": {}, "solved": False}, merge=True)
        else:
            gref.update({"status":"finished"})
        socketio.emit("puzzle:result", {"slug": slug, "ok": True, "nextRoomIndex": next_idx}, room=gid)
    else:
        socketio.emit("puzzle:result", {"slug": slug, "ok": False}, room=gid)

    return jsonify({"ok": ok})

# ---------- SOCKET.IO ----------
@socketio.on("connect")
def on_connect():
    # connexion ok ; on répond au client
    emit("system:hello", {"msg":"connected"})

@socketio.on("room:join")
def on_room_join(data):
    # le front doit envoyer {token: "..."} dans l'event
    token = (data or {}).get("token")
    # astuce: on met le token dans l'en-tête sur le front si tu préfères
    # ici, on utilise la même fonction de parsing que pour REST :
    claims = read_token_from_header()
    # si pas trouvé en header, on tente via payload:
    if not claims and token:
        try:
            import jwt, os
            claims = jwt.decode(token, os.getenv("JWT_SECRET","dev"), algorithms=["HS256"])
        except Exception:
            claims = None

    if not claims:
        emit("system:error", {"msg":"unauthorized"}); return

    gid = claims["gid"]
    join_room(gid)
    emit("room:joined", {"gid": gid})
    socketio.emit("room:players", {"joined": claims["pid"]}, room=gid)

@socketio.on("chat:msg")
def on_chat_msg(data):
    token_claims = read_token_from_header()
    if not token_claims:
        return
    gid = token_claims["gid"]
    txt = (data or {}).get("text","")
    txt = (txt[:500]).strip()
    if not txt:
        return
    # broadcast
    socketio.emit("chat:msg", {"from": token_claims["pid"], "text": txt}, room=gid)

@socketio.on("puzzle:state")
def on_puzzle_state(data):
    # sync d'état visuel léger entre clients (ex: positions des pièces)
    token_claims = read_token_from_header()
    if not token_claims:
        return
    gid = token_claims["gid"]
    socketio.emit("puzzle:state", data, room=gid, include_self=False)

@app.get("/health")
def health():
    return {"ok": True}

# ---------- MAIN ----------
if __name__ == "__main__":
    # eventlet est requis pour websockets en dev simple
    socketio.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
