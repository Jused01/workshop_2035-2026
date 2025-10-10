# Système de Progression Temps Réel

## 🎯 Vue d'ensemble

Le système de progression temps réel permet à tous les joueurs de partager la même progression dans le jeu. Quand un joueur termine une énigme, elle devient inaccessible aux autres joueurs et tous voient la progression globale en temps réel.

## 🔧 Fonctionnalités

### ✅ Progression Globale
- **Partagée** : Tous les joueurs voient les mêmes énigmes complétées
- **Temps réel** : Mise à jour instantanée via Socket.IO
- **Persistante** : Sauvegardée en base de données

### 🚫 Blocage d'Accès
- **Énigmes terminées** : Marquées visuellement et inaccessibles
- **Messages d'erreur** : Alerte si tentative d'accès à une énigme terminée
- **Interface claire** : Indicateurs visuels "TERMINÉE" en vert

### 🏆 Fin de Jeu Collective
- **Déclenchement automatique** : Quand toutes les énigmes sont résolues
- **Écran de félicitations** : Affiché pour tous les joueurs simultanément
- **Message personnalisable** : Modifiable dans `App.jsx`

## 🗄️ Base de Données

### Table `game_enigmes_completed`
```sql
CREATE TABLE game_enigmes_completed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    enigme_id INT NOT NULL,
    completed_by VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_game_enigme (game_id, enigme_id)
);
```

## 🔄 Flux de Synchronisation

1. **Joueur A termine l'énigme 1**
   - Backend : Enregistre dans `game_enigmes_completed`
   - Socket.IO : Émet `puzzle:solved` à tous les joueurs
   - Frontend : Met à jour l'interface pour tous

2. **Joueur B essaie d'accéder à l'énigme 1**
   - Frontend : Vérifie `globalCompletedEnigmes`
   - Résultat : Message d'erreur + accès bloqué

3. **Toutes les énigmes terminées**
   - Backend : Détecte 5 énigmes complétées
   - Socket.IO : Émet `game:completed`
   - Frontend : Affiche l'écran de félicitations

## 🎮 Interface Utilisateur

### Salle de Sélection
- **Énigmes disponibles** : Bordure dorée, icône dorée
- **Énigmes terminées** : Bordure verte, icône verte, texte "✓ TERMINÉE"
- **Compteur global** : "Énigmes: X/5" mis à jour en temps réel

### Messages d'Erreur
- **Tentative d'accès** : "Cette énigme a déjà été résolue par un autre joueur !"
- **Sélection bloquée** : Alerte automatique

## 🔧 Configuration

### Message de Félicitations
Modifiable dans `src/App.jsx` ligne 394 :
```jsx
customMessage="Bravo ! Vous avez découvert tous les mystères du Musée Oublié de Nantes..."
```

### Événements Socket.IO
- `puzzle:solved` : Énigme résolue
- `game:completed` : Jeu terminé
- `game:state:update` : Mise à jour de l'état
- `player:enigme:select` : Sélection d'énigme

## 🧪 Test

### Scripts de Test
- `test_table.py` : Vérifie l'existence de la table
- `create_table.py` : Crée la table si nécessaire

### Test Multi-joueurs
1. Ouvrir plusieurs onglets/fenêtres
2. Créer une partie avec un joueur
3. Rejoindre avec un autre joueur
4. Tester la synchronisation en temps réel

## 🚀 Démarrage

1. **Backend** : `python app.py`
2. **Frontend** : `npm run dev`
3. **Test** : Ouvrir plusieurs onglets pour tester le multi-joueurs

## 📝 Notes Techniques

- **Performance** : Index sur `game_id` et `enigme_id` pour des requêtes rapides
- **Sécurité** : Vérification des tokens JWT pour toutes les opérations
- **Robustesse** : Gestion des erreurs et reconnexions automatiques
- **Scalabilité** : Pool de connexions MySQL pour gérer plusieurs joueurs
