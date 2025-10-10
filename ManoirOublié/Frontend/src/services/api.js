// src/services/api.js
// API service to communicate with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('playerToken');
};

// Endpoints that do NOT require auth; avoid Authorization header to skip CORS preflight
const NO_AUTH_PREFIXES = ['/api/enigmes/1', '/api/enigmes/3', '/audio-proxy', '/image-proxy', '/health'];

// Helper function to make authenticated requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const isNoAuth = NO_AUTH_PREFIXES.some(p => endpoint.startsWith(p));
    const needsAuth = !!(token && !isNoAuth);
    const method = (options.method || 'GET').toUpperCase();
    const isSimpleGet = isNoAuth && method === 'GET';

    // Start with provided headers, but avoid adding headers for simple GETs to prevent preflight
    const headers = isSimpleGet ? { ...(options.headers || {}) } : {
        ...(options.headers || {}),
        ...(needsAuth ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    // Only set Content-Type automatically when sending a JSON body
    if (!isSimpleGet && options.body && !('Content-Type' in headers)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers,
        mode: options.mode || 'cors',
    };

    try {
        const response = await fetch(url, config);

        // Gérer les erreurs HTTP
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// ---------- Game API functions ----------

export const createGame = async (nickname = "Agent", role = "curator") => {
    console.log('Creating game with:', { nickname, role });
    try {
        const res = await apiRequest('/api/games', {
            method: 'POST',
            body: JSON.stringify({ nickname, role }),
        });
        console.log('Game creation response:', res);
        if (res.playerToken) {
            localStorage.setItem('playerToken', res.playerToken);
            if (res.gameId) localStorage.setItem('gameId', res.gameId);
            if (res.code) localStorage.setItem('roomCode', res.code);
        }
        return res;
    } catch (error) {
        console.error('Game creation failed:', error);
        throw error;
    }
};

export const joinGame = async (code, nickname = "Agent", role = "analyst") => {
    // Si code = "RANDOM", rejoindre une partie aléatoire
    if (code === "RANDOM") {
        const res = await apiRequest('/api/games/join-random', {
            method: 'POST',
            body: JSON.stringify({ nickname, role }),
        });
        if (res.playerToken) {
            localStorage.setItem('playerToken', res.playerToken);
        }
        return res;
    }

    const res = await apiRequest('/api/games/join', {
        method: 'POST',
        body: JSON.stringify({ code, nickname, role }),
    });
    if (res.playerToken) {
        localStorage.setItem('playerToken', res.playerToken);
    }
    return res;
};

export const startGame = async () => {
    return await apiRequest('/api/games/start', { method: 'POST' });
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

// ---------- Enigme 5 Poétique ----------

// Fonction spécifique pour l'énigme 5
export const getEnigme5Poetique = async () => {
    try {
        const data = await apiRequest("/api/games/poetique-nantes-5");
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération du poème:", error);
        throw error;
    }
};

// Mock data pour les énigmes 1 à 4 (fallback)
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

// Fallback safe pour les énigmes 1 à 4
export const getEnigmeDoc = async (id) => {
    if (id === "enigme5") {
        return await getEnigme5Poetique();
    }
    if (id === 'enigme1') {
        try {
            const data = await apiRequest(`/api/enigmes/1?r=${Date.now()}`);
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
    const bust = Date.now();
    return `${API_BASE_URL}/image-proxy?url=${encodeURIComponent(rawUrl)}&cb=${bust}`;
};

export const buildAudioProxiedUrl = (rawUrl) => {
    if (!rawUrl) return null;
    const bust = Date.now();
    return `${API_BASE_URL}/audio-proxy?url=${encodeURIComponent(rawUrl)}&cb=${bust}`;
};

export const getEnigme3 = async () => {
    try {
        const data = await apiRequest(`/api/enigmes/3?r=${Date.now()}`);
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