// src/services/useSocket.js
import { io } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (gameId) => {
    const [messages, setMessages] = useState([]);
    const [players, setPlayers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!gameId) {
            console.warn('[Socket] No gameId provided');
            return;
        }

        const token = localStorage.getItem('playerToken');
        if (!token) {
            console.error('[Socket] No auth token found');
            setError('Token non trouvé');
            return;
        }

        console.log('[Socket] Initializing connection...');

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('✅ [Socket] Connected to server');
            setIsConnected(true);
            setError(null);

            // Join the game room
            socket.emit('room:join', { token });
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ [Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ [Socket] Connection error:', err);
            setError('Erreur de connexion');
        });

        socket.on('system:hello', (data) => {
            console.log('👋 [Socket] Server hello:', data);
        });

        socket.on('system:error', (data) => {
            console.error('❌ [Socket] Server error:', data);
            setError(data.msg || 'Erreur serveur');
        });

        // Room events
        socket.on('room:joined', (data) => {
            console.log('🎮 [Socket] Joined room:', data.gid);
            if (data.players) {
                setPlayers(data.players);
            }
        });

        // Player events
        socket.on('player:joined', (data) => {
            console.log('👤 [Socket] Player joined:', data.player);
            setPlayers(prev => [...prev, data.player]);
        });

        socket.on('player:connected', (data) => {
            console.log('🟢 [Socket] Player connected:', data.player);
        });

        socket.on('players:update', (data) => {
            console.log('🔄 [Socket] Players update:', data.players);
            setPlayers(data.players);
        });

        // Chat events
        socket.on('chat:msg', (data) => {
            console.log('💬 [Socket] Chat message:', data);
            setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                sender: data.sender || 'Anonyme',
                text: data.text,
                from: data.from,
                timestamp: data.timestamp || new Date().toISOString()
            }]);
        });

        // Game events
        socket.on('game:started', (data) => {
            console.log('🚀 [Socket] Game started:', data);
        });

        socket.on('puzzle:solved', (data) => {
            console.log('🎉 [Socket] Puzzle solved:', data);
            // Afficher une notification
            setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                sender: 'Système',
                text: `${data.player} a résolu ${data.slug} (+${data.points} points) !`,
                system: true,
                timestamp: new Date().toISOString()
            }]);
        });

        // Puzzle state sync
        socket.on('puzzle:state', (data) => {
            console.log('🔄 [Socket] Puzzle state update:', data);
            // Les composants d'énigmes peuvent écouter cet événement
        });

        return () => {
            console.log('🔌 [Socket] Disconnecting...');
            socket.disconnect();
        };
    }, [gameId]);

    const sendMessage = (text) => {
        if (socketRef.current && isConnected && text.trim()) {
            const token = localStorage.getItem('playerToken');
            socketRef.current.emit('chat:msg', {
                text: text.trim(),
                token
            });
            console.log('📤 [Socket] Message sent:', text);
        } else {
            console.warn('[Socket] Cannot send message:', {
                connected: isConnected,
                text
            });
        }
    };

    const sendPuzzleState = (state) => {
        if (socketRef.current && isConnected) {
            const token = localStorage.getItem('playerToken');
            socketRef.current.emit('puzzle:state', {
                ...state,
                token
            });
        }
    };

    return {
        messages,
        sendMessage,
        players,
        setPlayers,
        isConnected,
        error,
        sendPuzzleState
    };
};