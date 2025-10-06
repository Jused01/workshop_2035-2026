# seed_firestore.py
import os
from datetime import datetime, timezone
from google.cloud import firestore
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.getenv("PROJECT_ID")
CRED_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

assert PROJECT_ID, "PROJECT_ID manquant dans .env"
assert CRED_PATH and os.path.exists(CRED_PATH), "Clé service manquante (GOOGLE_APPLICATION_CREDENTIALS)"

db = firestore.Client(project=PROJECT_ID)

def upsert(col, doc_id, data):
    db.collection(col).document(doc_id).set(data, merge=True)
    print(f"✓ {col}/{doc_id}")

def main():
    now = datetime.now(timezone.utc)

    # 1) Un joueur de test
    upsert("joueurs", "player_demo", {
        "nom": "Durand",
        "prenom": "Emma",
        "score_total": 0,
        "date_creation": now.isoformat()
    })

    # 2) Enigmes (table centrale)
    enigmes = [
        {
            "id": "e1",
            "titre": "Puzzle de Nantes",
            "type": "puzzle",
            "description": "Reconstituer une œuvre d'art nantaise pour obtenir le mot-clé.",
            "points": 50,
            "date_creation": now.isoformat()
        },
        {
            "id": "e2",
            "titre": "Jeu de lumière",
            "type": "lumiere",
            "description": "Décoder une séquence lumineuse (Nantes) pour trouver le terme clé.",
            "points": 40,
            "date_creation": now.isoformat()
        },
        {
            "id": "e3",
            "titre": "Le son de l'Éléphant",
            "type": "son",
            "description": "Identifier le son emblématique de l'Éléphant de Nantes.",
            "points": 30,
            "date_creation": now.isoformat()
        },
        {
            "id": "e4",
            "titre": "Timeline artistique nantaise",
            "type": "timeline",
            "description": "Remettre des événements artistiques de Nantes dans le bon ordre.",
            "points": 60,
            "date_creation": now.isoformat()
        },
        {
            "id": "e5",
            "titre": "Clé poétique",
            "type": "poetique",
            "description": "Résoudre l’énigme poétique liée à un événement nantais.",
            "points": 70,
            "date_creation": now.isoformat()
        },
    ]
    for e in enigmes:
        upsert("enigmes", e["id"], e)

    # 3) Détails par type (collections spécialisées)
    upsert("enigmes_puzzle", "e1", {
        "id_enigme": "e1",
        "url_photo_1": "https://exemple/puzzle1.jpg",
        "url_photo_2": "https://exemple/puzzle2.jpg",
        "url_photo_3": "https://exemple/puzzle3.jpg",
        "date_photos": "2024-06-01",
        "auteur_photo": "Collectif local",
        "solution": "voyage a nantes"  # mot-clé attendu côté backend
    })

    upsert("enigmes_lumiere", "e2", {
        "id_enigme": "e2",
        "code_lumiere": "RVB-132",
        "date_cle": "2023-04-21",
        "indice": "Cherche la lueur des Anneaux…"
    })

    upsert("enigmes_son", "e3", {
        "id_enigme": "e3",
        "url_son": "https://exemple/elephant.mp3",
        "nom_son": "Elephant de Nantes",
        "date_association": "2010-06-01",
        "bonne_reponse": "elephant"
    })

    upsert("enigmes_timeline", "e4", {
        "id_enigme": "e4",
        # Exemples (à ajuster à vos vraies dates/événements)
        "evenements": [
            {"texte": "Ouverture musée (ex.)", "annee": 1890},
            {"texte": "Grande expo (ex.)", "annee": 1955},
            {"texte": "Création Machines de l'Île (ex.)", "annee": 2007},
        ],
        # Ordre correct = indices de la liste evenements (0,1,2…)
        "ordre_correct": [0, 1, 2],
        "source": "Sources locales"
    })

    upsert("enigmes_poetique", "e5", {
        "id_enigme": "e5",
        "texte_poeme": "Sous les anneaux, la mémoire se réveille…",
        "date_poeme": "2025-01-01",
        "auteur": "Votre équipe",
        "solution": "memoire de nantes"
    })

    # 4) Historique de résolution (joueur_enigmes) — vide au départ
    # Exemple d’insertion si besoin :
    # upsert("joueur_enigmes", "player_demo__e1", {
    #     "id_joueur": "player_demo",
    #     "id_enigme": "e1",
    #     "date_realisation": now.isoformat(),
    #     "score_obtenu": 50,
    #     "temps_realisation": 260
    # })

    print("\n✅ Seed terminé. Va voir Firestore → tu dois voir les collections :")
    print("   joueurs, enigmes, enigmes_puzzle, enigmes_lumiere, enigmes_son, enigmes_timeline, enigmes_poetique")

if __name__ == "__main__":
    main()
