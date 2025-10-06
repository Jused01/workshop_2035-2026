# services/firestore.py
import os, json, base64
from google.cloud import firestore

_client = None

def get_client():
    global _client
    if _client:
        return _client

    b64 = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON_B64")
    if b64:
        creds = json.loads(base64.b64decode(b64).decode())
        _client = firestore.Client.from_service_account_info(creds)
    else:
        # utilise GOOGLE_APPLICATION_CREDENTIALS (chemin) + PROJECT_ID
        _client = firestore.Client(project=os.getenv("PROJECT_ID"))
    return _client

def games_col():
    return get_client().collection("games")

def game_doc(game_id: str):
    return games_col().document(game_id)

def players_col(game_id: str):
    return game_doc(game_id).collection("players")

def chat_col(game_id: str):
    return game_doc(game_id).collection("chat")

def runtime_state_doc(game_id: str):
    # doc unique qui porte l'état courant du puzzle
    return game_doc(game_id).collection("runtime").document("state")
