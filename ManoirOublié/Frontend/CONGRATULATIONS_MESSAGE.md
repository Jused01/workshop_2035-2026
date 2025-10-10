# Message de Félicitations Personnalisable

## Comment modifier le message de félicitations

Le message de félicitations qui s'affiche quand toutes les énigmes sont terminées peut être facilement personnalisé.

### Localisation du message

Le message se trouve dans le fichier `src/App.jsx` à la ligne 342 :

```jsx
<CongratulationsScreen
    playerName={playerName}
    score={score}
    onReturnHome={handleReturnHome}
    onRestartGame={handleRestartGame}
    customMessage="Félicitations ! Vous avez résolu toutes les énigmes du Manoir Oublié ! Votre perspicacité et votre détermination ont permis de révéler tous les secrets cachés de ce mystérieux lieu."
/>
```

### Comment modifier le message

1. Ouvrez le fichier `src/App.jsx`
2. Trouvez la ligne avec `customMessage="..."`
3. Remplacez le texte entre les guillemets par votre message personnalisé
4. Sauvegardez le fichier

### Exemple de personnalisation

```jsx
customMessage="Bravo ! Vous avez maîtrisé tous les défis du Manoir Oublié ! Votre intelligence et votre courage ont triomphé de tous les mystères. Vous êtes maintenant un véritable explorateur des secrets de Nantes !"
```

### Caractéristiques du message

- Le message s'affiche dans un encadré stylisé avec un fond dégradé
- Il est centré et mis en évidence sur l'écran de félicitations
- Il peut contenir plusieurs phrases et paragraphes
- Il supporte les caractères spéciaux et les emojis

### Fonctionnalités de l'écran de félicitations

- **Animation** : Trophée animé avec des étoiles scintillantes
- **Informations du joueur** : Nom et score final affichés
- **Boutons d'action** : 
  - "Rejouer" : Remet à zéro les énigmes et retourne à la sélection
  - "Retour au Menu" : Retourne au menu principal et nettoie la session
- **Effets visuels** : Particules animées en arrière-plan

L'écran s'affiche automatiquement quand le joueur complète la 5ème énigme.
