// src/services/firebase.js
// Mock pour éviter les erreurs et permettre le développement sans Firebase

// Données statiques pour les énigmes
const mockEnigmes = {
    enigme1: {
        images: [
            "https://via.placeholder.com/300", // URL d'une image placeholder
            "https://via.placeholder.com/300",
            "https://via.placeholder.com/300",
        ],
        mode: "choose-three",
    },
    enigme2: {
        size: 5,
        solution: [true, false, true, false, true],
        datesOptions: ["1466", "2000", "2007"],
        codeToDate: { "10101": "2007" },
    },
    enigme3: {
        sounds: ["https://www.soundjay.com/buttons/sounds/button-09.mp3"],
        options: ["éléphant", "bateau", "machine"],
        correct: "éléphant",
    },
    enigme4: {
        events: [
            { id: 1, text: "Événement 1", year: 1860 },
            { id: 2, text: "Événement 2", year: 1894 },
            { id: 3, text: "Événement 3", year: 1900 },
            { id: 4, text: "Événement 4", year: 1955 },
            { id: 5, text: "Événement 5", year: 2007 },
        ],
    },
    enigme5: {
        text: "Dans les ombres de Nantes,\nUn trésor caché attend.\nTrouve la clé poétique,\nPour révéler son secret.",
        answer: "mémoire",
    },
};

// Fonction mock pour récupérer un document d'énigme
export const getEnigmeDoc = async (id) => {
    return mockEnigmes[id];
};

// Fonction mock pour récupérer des URLs de téléchargement
export const getDownloadUrls = async (paths) => {
    // Retourne simplement les paths en tant qu'URLs (ou des placeholders)
    return paths.map((path) => path || "https://via.placeholder.com/300");
};
