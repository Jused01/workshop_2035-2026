// src/services/api.js
// API service to communicate with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('playerToken');
};

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// Game API functions
export const createGame = async (nickname = "Agent", role = "curator") => {
    return await apiRequest('/api/games', {
        method: 'POST',
        body: JSON.stringify({ nickname, role }),
    });
};

export const joinGame = async (code, nickname = "Agent", role = "analyst") => {
    return await apiRequest('/api/games/join', {
        method: 'POST',
        body: JSON.stringify({ code, nickname, role }),
    });
};

export const startGame = async () => {
    return await apiRequest('/api/games/start', {
        method: 'POST',
    });
};

export const getGame = async (gameId) => {
    return await apiRequest(`/api/games/${gameId}`);
};

export const validatePuzzle = async (slug, attempt) => {
    return await apiRequest(`/api/validate/${slug}`, {
        method: 'POST',
        body: JSON.stringify({ attempt }),
    });
};

// Mock data for enigmes (keeping for now as fallback)
const mockEnigmes = {
    enigme1: {
        images: [
            "https://via.placeholder.com/300",
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

// Fallback functions for enigme data
export const getEnigmeDoc = async (id) => {
    if (id === 'enigme1') {
        try {
            const data = await apiRequest('/api/enigmes/1');
            if (data && Array.isArray(data.images) && data.images.length) {
                return { images: data.images, mode: 'choose-three' };
            }
        } catch (e) {
            // fall through to mock
        }
    }
    return mockEnigmes[id];
};

export const getDownloadUrls = async (paths) => {
    return paths.map((path) => path || "https://via.placeholder.com/300");
};

// Helper to proxy media through backend to avoid CORS/mixed content
export const buildProxiedUrl = (rawUrl) => {
    if (!rawUrl) return null;
    try {
        const url = new URL(rawUrl);
        // if already same origin as backend, no need to proxy
        const backend = new URL(API_BASE_URL);
        if (url.origin === backend.origin) return rawUrl;
    } catch (_) {
        // if invalid URL, return as-is (backend might still handle)
    }
    return `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(rawUrl)}`;
};

export const buildAudioProxiedUrl = (rawUrl) => {
    if (!rawUrl) return null;
    return `${API_BASE_URL}/audio-proxy?url=${encodeURIComponent(rawUrl)}`;
};

export const getEnigme3 = async () => {
    try {
        const data = await apiRequest('/api/enigmes/3');
        if (data) return {
            sounds: Array.isArray(data.sounds) ? data.sounds : [],
            options: Array.isArray(data.options) ? data.options : [],
            correct: typeof data.correct === 'string' ? data.correct : null,
        };
    } catch (e) {
        // swallow, fallback in component
    }
    return { sounds: [], options: [], correct: null };
};