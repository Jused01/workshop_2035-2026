#!/usr/bin/env python3
"""
Script de test pour vérifier le système multijoueur
Usage: python test_multiplayer.py
"""

import requests
import json
from socketio import Client
import time

API_URL = "http://localhost:5000"

def test_create_game():
    """Test de création de partie"""
    print("🧪 Test 1: Création de partie...")

    response = requests.post(
        f"{API_URL}/api/games",
        json={"nickname": "TestPlayer1", "role": "curator"}
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Partie créée avec succès!")
        print(f"   Code: {data['code']}")
        print(f"   Game ID: {data['gameId']}")
        print(f"   Token: {data['playerToken'][:20]}...")
        return data
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_join_game(code):
    """Test de rejoindre une partie"""
    print(f"\n🧪 Test 2: Rejoindre la partie {code}...")

    response = requests.post(
        f"{API_URL}/api/games/join",
        json={"code": code, "nickname": "TestPlayer2", "role": "analyst"}
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Partie rejointe avec succès!")
        print(f"   Game ID: {data['gameId']}")
        print(f"   Token: {data['playerToken'][:20]}...")
        return data
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_join_random():
    """Test de rejoindre une partie aléatoire"""
    print("\n🧪 Test 3: Rejoindre une partie aléatoire...")

    response = requests.post(
        f"{API_URL}/api/games/join-random",
        json={"nickname": "TestPlayer3", "role": "analyst"}
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Partie aléatoire rejointe!")
        print(f"   Code: {data['code']}")
        print(f"   Game ID: {data['gameId']}")
        return data
    else:
        print(f"❌ Erreur: {response.status_code}")
        print(f"   {response.text}")
        return None

def test_socket_connection(game_data):
    """Test de connexion Socket.IO"""
    print("\n🧪 Test 4: Connexion Socket.IO...")

    sio = Client()
    connected = False

    @sio.on('connect')
    def on_connect():
        nonlocal connected
        connected = True
        print("✅ Socket.IO connecté!")

    @sio.on('system:hello')
    def on_hello(data):
        print(f"✅ Reçu hello du serveur: {data}")

    @sio.on('room:joined')
    def on_room_joined(data):
        print(f"✅ Room rejointe: {data}")

    try:
        sio.connect(API_URL)
        time.sleep(1)

        if connected:
            # Rejoindre la room
            sio.emit('room:join', {'token': game_data['playerToken']})
            time.sleep(1)

            # Envoyer un message de test
            print("📤 Envoi d'un message de test...")
            sio.emit('chat:msg', {
                'token': game_data['playerToken'],
                'text': 'Message de test depuis le script Python!'
            })
            time.sleep(1)

            sio.disconnect()
            print("✅ Test Socket.IO réussi!")
            return True
        else:
            print("❌ Échec de connexion Socket.IO")
            return False

    except Exception as e:
        print(f"❌ Erreur Socket.IO: {e}")
        return False

def test_get_players(game_id):
    """Test de récupération des joueurs"""
    print(f"\n🧪 Test 5: Récupération des joueurs...")

    response = requests.get(f"{API_URL}/api/games/{game_id}/players")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Joueurs récupérés: {len(data['players'])} joueur(s)")
        for player in data['players']:
            print(f"   - {player['name']} ({player['role']})")
        return data
    else:
        print(f"❌ Erreur: {response.status_code}")
        return None

def test_health():
    """Test de l'endpoint health"""
    print("🧪 Test 0: Health check...")

    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            print("✅ Serveur opérationnel!")
            return True
        else:
            print(f"❌ Serveur retourne: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Impossible de contacter le serveur: {e}")
        print(f"   Assurez-vous que le serveur Flask tourne sur {API_URL}")
        return False

def main():
    print("="*60)
    print("🎮 Test du système multijoueur - Le Musée Oublié")
    print("="*60)

    # Test 0: Health check
    if not test_health():
        print("\n❌ Le serveur n'est pas accessible. Arrêt des tests.")
        return

    # Test 1: Créer une partie
    game1 = test_create_game()
    if not game1:
        print("\n❌ Échec du test de création. Arrêt des tests.")
        return

    # Test 2: Rejoindre avec code
    game2 = test_join_game(game1['code'])
    if not game2:
        print("\n⚠️ Échec du test de rejoindre (non critique)")

    # Test 3: Rejoindre aléatoirement
    game3 = test_join_random()
    if not game3:
        print("\n⚠️ Échec du test aléatoire (non critique)")

    # Test 4: Socket.IO
    socket_ok = test_socket_connection(game1)

    # Test 5: Récupérer les joueurs
    test_get_players(game1['gameId'])

    # Résumé
    print("\n" + "="*60)
    print("📊 Résumé des tests")
    print("="*60)
    print(f"✅ Création de partie: {'OK' if game1 else 'ÉCHEC'}")
    print(f"✅ Rejoindre avec code: {'OK' if game2 else 'ÉCHEC'}")
    print(f"✅ Rejoindre aléatoirement: {'OK' if game3 else 'ÉCHEC'}")
    print(f"✅ Socket.IO: {'OK' if socket_ok else 'ÉCHEC'}")
    print("="*60)

    if game1 and socket_ok:
        print("\n🎉 Tests principaux réussis! Le système multijoueur fonctionne.")
        print(f"\n💡 Vous pouvez rejoindre la partie de test avec le code: {game1['code']}")
    else:
        print("\n⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrompus par l'utilisateur.")
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        import traceback
        traceback.print_exc()