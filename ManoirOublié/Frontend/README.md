🎮 Le Musée Oublié - Mode Multijoueur
🌟 Fonctionnalités
✅ Ce qui fonctionne maintenant :

Création de partie

Un joueur crée une partie et reçoit un code à 6 caractères
Maximum 4 joueurs par partie


Rejoindre une partie

Avec code : Entrez le code reçu d'un ami
Aléatoire : Rejoignez automatiquement une partie en attente
Si aucune partie n'est disponible, une nouvelle est créée


Salle d'attente

Voir tous les joueurs en temps réel
Statut "Prêt" pour chaque joueur
Bouton copier le code
Indicateur de connexion Socket.IO


Chat en temps réel

Messages instantanés entre tous les joueurs
Notifications système (énigme résolue, etc.)
Indicateur "vous" pour vos propres messages
Auto-scroll vers les nouveaux messages


Synchronisation

Joueurs connectés/déconnectés en temps réel
Progression partagée
Scores individuels



🚀 Installation
Backend (Python/Flask)
bashcd backend
pip install -r requirements.txt

# Configuration .env
VITE_API_URL=http://localhost:5000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306
JWT_SECRET=votre_secret_jwt_ici

# Lancer le serveur
python app.py
Frontend (React/Vite)
bashcd frontend
npm install socket.io-client

# Configuration .env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Lancer le dev server
npm run dev
📡 Architecture Socket.IO
Événements émis par le client :

room:join - Rejoindre une room de jeu
chat:msg - Envoyer un message de chat
puzzle:state - Synchroniser l'état d'une énigme

Événements reçus par le client :

system:hello - Confirmation de connexion
room:joined - Confirmation de rejoindre la room
player:joined - Un nouveau joueur a rejoint
player:connected - Un joueur s'est reconnecté
players:update - Mise à jour de la liste des joueurs
chat:msg - Nouveau message de chat
game:started - La partie a démarré
puzzle:solved - Une énigme a été résolue

🎯 Utilisation
Pour le créateur de partie :

Cliquez sur "Créer une partie"
Entrez votre nom
Partagez le code affiché avec vos amis
Attendez que les autres joueurs rejoignent
Cliquez sur "Je suis prêt !"
Une fois tous prêts, cliquez sur "Commencer l'aventure"

Pour rejoindre une partie :
Option 1 - Avec code :

Cliquez sur "Rejoindre avec code"
Entrez votre nom
Entrez le code reçu
Cliquez sur "Rejoindre"

Option 2 - Partie aléatoire :

Cliquez sur "Rejoindre aléatoirement"
Entrez votre nom
Vous serez automatiquement ajouté à une partie en attente

Pendant la partie :

Chat : Communiquez avec votre équipe en temps réel
Énigmes : Résolvez les énigmes ensemble
Scores : Chaque joueur accumule des points
ESC : Retour à la sélection d'énigmes

🔧 Dépannage
Le chat ne fonctionne pas :

Vérifiez l'indicateur de connexion (🟢 Connecté / 🔴 Déconnecté)
Vérifiez que le serveur Socket.IO est lancé
Vérifiez les CORS dans app.py

Les joueurs ne se voient pas :

Assurez-vous que tous utilisent le même gameId
Vérifiez les logs du serveur Flask
Vérifiez la console du navigateur (F12)

Erreur "Token manquant" :

Le token est stocké dans localStorage
Vérifiez que createGame() ou joinGame() ont réussi
Vérifiez localStorage.getItem('playerToken')

📝 Structure de la base de données
sql-- Table games
id VARCHAR(36) -- UUID du jeu
code VARCHAR(16) -- Code partageable (ex: ABC123)
status VARCHAR(16) -- waiting, running, finished
created_at DATETIME
started_at DATETIME
ends_at DATETIME

-- Table players
id VARCHAR(36) -- UUID du joueur
game_id VARCHAR(36) -- Référence au jeu
nickname VARCHAR(100) -- Nom du joueur
role VARCHAR(32) -- curator ou analyst
is_connected TINYINT(1) -- Statut prêt/connecté
score_total INT -- Score accumulé
🎨 Personnalisation
Changer le nombre max de joueurs :
Dans app.py, ligne ~150 :
pythonif player_count and player_count["count"] >= 4:  # Changer 4
Changer la durée du jeu :
Dans app.py, ligne ~250 :
pythonends = now_utc() + timedelta(minutes=45)  # Changer 45
Ajouter des émojis aux messages :
Dans GameRoom.jsx, personnalisez les messages système :
javascripttext: `🎉 ${data.player} a résolu ${data.slug} !`
🐛 Debug
Mode développement :
javascript// Dans la console du navigateur
window.__appDebug.getState()  // Voir l'état actuel
window.__appDebug.setScreen('waiting')  // Changer d'écran
Logs serveur :
python# Les logs Socket.IO apparaissent avec des emoji
# ✅ = Succès
# ❌ = Erreur
# 💬 = Message chat
# 🎮 = Événement de jeu
📚 Ressources

Socket.IO Documentation
Flask-SocketIO Documentation
React Hooks Documentation

🎯 Prochaines étapes suggérées

Système de notifications push

Alertes quand un joueur résout une énigme
Notifications de nouveaux messages


Système de hints partagés

Limiter le nombre d'indices par partie
Vote pour utiliser un indice


Classement en temps réel

Tableau des scores
Statistiques par joueur


Replay de partie

Sauvegarder l'historique des actions
Revoir la progression


Salons vocaux

Intégration WebRTC pour voice chat
Alternative au chat texte



🔐 Sécurité
Points importants :

JWT Tokens sont utilisés pour l'authentification
Tous les événements Socket.IO vérifient le token
Les messages sont limités à 500 caractères
Les parties expirent après 45 minutes

Recommandations production :
python# app.py - Production settings
CORS(app, resources={
r"/*": {
"origins": ["https://votredomaine.com"],
"methods": ["GET", "POST"],
"allow_headers": ["Content-Type", "Authorization"]
}
})
🚀 Déploiement
Backend (Heroku/Railway/Render)
bash# Procfile
web: gunicorn --worker-class eventlet -w 1 app:app

# runtime.txt
python-3.11.0

# requirements.txt (ajouter)
gunicorn==21.2.0
Frontend (Vercel/Netlify)
bash# .env.production
VITE_API_URL=https://votre-backend.herokuapp.com
VITE_SOCKET_URL=https://votre-backend.herokuapp.com
Configuration CORS production
python# app.py
CORS(app, resources={
r"/*": {
"origins": [
"https://votre-frontend.vercel.app",
"https://www.votredomaine.com"
]
}
})

socketio = SocketIO(
app,
cors_allowed_origins=[
"https://votre-frontend.vercel.app",
"https://www.votredomaine.com"
],
async_mode="threading"
)
📊 Monitoring
Logs utiles à surveiller :
python# Dans app.py, ajoutez des logs
import logging
logging.basicConfig(level=logging.INFO)

@socketio.on("chat:msg")
def on_chat_msg(data):
logging.info(f"Chat message from {claims['pid']}: {txt}")
# ... reste du code
Métriques importantes :

Nombre de parties actives
Nombre de joueurs connectés
Messages par seconde
Taux de déconnexion

🎮 Exemples d'utilisation
Créer une partie privée entre amis :
javascript// 1. Joueur 1 crée la partie
onEnterManor("Alice")
// Reçoit le code: "ABC123"

// 2. Joueur 2 rejoint avec le code
onJoinGame("ABC123", "Bob")

// 3. Joueur 3 rejoint avec le code
onJoinGame("ABC123", "Charlie")

// 4. Tous cliquent sur "Prêt"
// 5. Le créateur lance la partie
Rejoindre une partie publique :
javascript// Cliquer sur "Rejoindre aléatoirement"
onJoinGame("RANDOM", "David")
// Rejoint automatiquement une partie en attente
// ou crée une nouvelle si aucune n'est disponible
🛠️ Tests
Tester le multijoueur en local :

Ouvrez plusieurs onglets du navigateur
Utilisez le mode incognito pour simuler différents utilisateurs
Créez une partie dans le premier onglet
Rejoignez avec le code dans les autres onglets

Test du chat :
javascript// Dans la console du navigateur
window.__appDebug.getState().gameId
// Vérifiez que tous les joueurs ont le même gameId
🐛 Problèmes connus et solutions
1. "Token manquant ou invalide"
   Cause : Le token JWT n'est pas transmis correctement
   Solution :
   javascript// Vérifier que le token existe
   console.log(localStorage.getItem('playerToken'))

// Si absent, recréer la partie
localStorage.clear()
// Puis créer une nouvelle partie
2. Messages de chat ne s'affichent pas
   Cause : Socket.IO pas connecté ou mauvaise room
   Solution :
   javascript// Vérifier la connexion Socket.IO
   // Dans GameRoom.jsx, observer isConnected

// Vérifier les logs serveur
# Dans le terminal Flask, chercher :
# ✅ Player [nom] joined room [gameId]
# 💬 Chat from [nom] in [gameId]: [message]
3. Les joueurs ne se voient pas dans la waiting room
   Cause : Socket.IO ne propage pas l'événement player:joined
   Solution :
   python# Dans app.py, vérifier que l'événement est émis
   @app.post("/api/games/join")
   def join_game():
   # ... code ...
   socketio.emit("player:joined", {
   "player": {"id": pid, "name": nickname, ...}
   }, room=g["id"])  # ← Vérifier que room=g["id"]
4. Déconnexions fréquentes
   Cause : Timeout Socket.IO ou problème réseau
   Solution :
   javascript// Dans useSocket.js, augmenter les paramètres de reconnexion
   socketRef.current = io(SOCKET_URL, {
   reconnection: true,
   reconnectionAttempts: 10,  // Au lieu de 5
   reconnectionDelay: 1000,
   timeout: 20000,  // Ajouter un timeout plus long
   });
   📞 Support
   Pour toute question ou problème :

Vérifiez les logs dans la console navigateur (F12)
Vérifiez les logs du serveur Flask
Consultez le README pour les problèmes courants
Testez avec curl pour vérifier l'API :

bash# Test création de partie
curl -X POST http://localhost:5000/api/games \
-H "Content-Type: application/json" \
-d '{"nickname":"TestUser","role":"curator"}'

# Test rejoindre partie
curl -X POST http://localhost:5000/api/games/join \
-H "Content-Type: application/json" \
-d '{"code":"ABC123","nickname":"TestUser2","role":"analyst"}'
🎉 Bon jeu !
Profitez de votre aventure multijoueur dans le Musée Oublié de Nantes !