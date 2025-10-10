// src/services/useSocket.js
import { io } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (gameId, opts = {}) => {
    const [messages, setMessages] = useState([]);
    const [players, setPlayers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [gameState, setGameState] = useState({
        currentEnigme: null,
        completedEnigmes: new Set(),
        scores: {},
        gamePhase: 'waiting' // waiting, playing, completed
    });
    const socketRef = useRef(null);
    const isInitializedRef = useRef(false);
    const cleanupRef = useRef(null);

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

        // Prevent multiple initializations (React Strict Mode protection)
        if (isInitializedRef.current) {
            console.log('[Socket] Already initialized, skipping');
            return;
        }

        // Clean up any existing connection
        if (socketRef.current) {
            console.log('[Socket] Cleaning up existing connection...');
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        console.log('[Socket] Initializing connection...');
        isInitializedRef.current = true;

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 10,  // Increase attempts
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,            // Add timeout
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('✅ [Socket] Connected to server');
            setIsConnected(true);
            setError(null);

            // Join the game room
            socket.emit('room:join', { token });
            
            // Request current game state to sync completion status
            setTimeout(() => {
                if (socket.connected) {
                    console.log('🔄 [Socket] Requesting current game state...');
                    socket.emit('game:state:request', { token });
                }
            }, 500);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ [Socket] Disconnected:', reason);
            setIsConnected(false);
            
            // Add reconnection logic
            if (reason === 'io server disconnect') {
                // Server disconnected, try reconnecting
                socket.connect();
            }
            // Don't reconnect for client disconnects
            if (reason === 'io client disconnect') {
                return;
            }
        });

        // Add connection recovery handler
        socket.on('reconnect', (attemptNumber) => {
            console.log(`🔄 [Socket] Reconnected after ${attemptNumber} attempts`);
            // Re-join room and request state after reconnection
            const token = localStorage.getItem('playerToken');
            socket.emit('room:join', { token });
            requestGameState();
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
            if (data.gameState) {
                setGameState(prev => ({
                    ...prev,
                    ...data.gameState,
                    completedEnigmes: new Set(data.gameState.completedEnigmes || [])
                }));
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
            
            // Mettre à jour l'état du jeu
            setGameState(prev => {
                const newCompleted = new Set(prev.completedEnigmes);
                const enigmeId = data.enigmeId || data.slug;
                newCompleted.add(enigmeId);
                
                const newScores = { ...prev.scores };
                newScores[data.player] = (newScores[data.player] || 0) + data.points;
                
                return {
                    ...prev,
                    completedEnigmes: newCompleted,
                    scores: newScores
                };
            });
            
            
            try {
                if (opts && typeof opts.onPuzzleSolved === 'function') {
                    opts.onPuzzleSolved(data);
                }
            } catch (_) {}
        });

        // Puzzle state sync
        socket.on('puzzle:state', (data) => {
            console.log('🔄 [Socket] Puzzle state update:', data);
            try {
                if (opts && typeof opts.onPuzzleState === 'function') {
                    opts.onPuzzleState(data);
                }
            } catch (e) {
                // ignore
            }
        });

        // Game state synchronization
        socket.on('game:state:update', (data) => {
            console.log('🔄 [Socket] Game state update:', data);
            setGameState(prev => ({
                ...prev,
                ...data,
                completedEnigmes: new Set(data.completedEnigmes || prev.completedEnigmes)
            }));
            
            try {
                if (opts && typeof opts.onGameStateUpdate === 'function') {
                    opts.onGameStateUpdate(data);
                }
            } catch (e) {
                // ignore
            }
        });

        // Player enigme selection
        socket.on('player:enigme:select', (data) => {
            console.log('🎯 [Socket] Player selected enigme:', data);
            setGameState(prev => ({
                ...prev,
                currentEnigme: data.enigmeId
            }));
            
            try {
                if (opts && typeof opts.onEnigmeSelected === 'function') {
                    opts.onEnigmeSelected(data);
                }
            } catch (e) {
                // ignore
            }
        });

        // Player position in selection room
        socket.on('player:position:update', (data) => {
            console.log('📍 [Socket] Player position update:', data);
            try {
                if (opts && typeof opts.onPlayerPositionUpdate === 'function') {
                    opts.onPlayerPositionUpdate(data);
                }
            } catch (e) {
                // ignore
            }
        });

        // Game completed event
        socket.on('game:completed', (data) => {
            console.log('🎉 [Socket] Game completed:', data);
            setGameState(prev => ({
                ...prev,
                gamePhase: 'completed',
                completedEnigmes: new Set(data.completedEnigmes || [])
            }));
            
            try {
                if (opts && typeof opts.onGameCompleted === 'function') {
                    opts.onGameCompleted(data);
                }
            } catch (e) {
                // ignore
            }
        });

        // Game state response
        socket.on('game:state:response', (data) => {
            console.log('🔄 [Socket] Game state response:', data);
            setGameState(prev => ({
                ...prev,
                ...data,
                completedEnigmes: new Set(data.completedEnigmes || prev.completedEnigmes)
            }));
        });

        // Store cleanup function
        cleanupRef.current = () => {
            console.log('🔌 [Socket] Disconnecting...');
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            isInitializedRef.current = false;
        };

        return cleanupRef.current;
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

    const sendGameStateUpdate = (state) => {
        if (socketRef.current && isConnected) {
            const token = localStorage.getItem('playerToken');
            socketRef.current.emit('game:state:update', {
                ...state,
                token
            });
        }
    };

    const sendEnigmeSelection = (enigmeId) => {
        if (socketRef.current && isConnected) {
            const token = localStorage.getItem('playerToken');
            socketRef.current.emit('player:enigme:select', {
                enigmeId,
                token
            });
        }
    };

    const sendPlayerPosition = (x, y) => {
        if (socketRef.current && isConnected) {
            const token = localStorage.getItem('playerToken');
            socketRef.current.emit('player:position:update', {
                x,
                y,
                token
            });
        }
    };

    const requestGameState = () => {
        if (socketRef.current && isConnected) {
            const token = localStorage.getItem('playerToken');
            socketRef.current.emit('game:state:request', {
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
        gameState,
        setGameState,
        sendPuzzleState,
        sendGameStateUpdate,
        sendEnigmeSelection,
        sendPlayerPosition,
        requestGameState
    };
};