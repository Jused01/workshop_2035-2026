import { io } from 'socket.io-client';
import { useState, useEffect, useRef } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (gameId) => {
    const [messages, setMessages] = useState([]);
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!gameId) return;

        const token = localStorage.getItem('playerToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            auth: {
                token: token
            }
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            
            // Join the game room
            socket.emit('room:join', { token });
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socket.on('system:hello', (data) => {
            console.log('Server hello:', data);
        });

        socket.on('system:error', (data) => {
            console.error('Server error:', data);
        });

        // Room events
        socket.on('room:joined', (data) => {
            console.log('Joined room:', data);
        });

        socket.on('room:players', (data) => {
            console.log('Player joined:', data);
            // Update players list when someone joins
            // This would need to be enhanced based on your backend implementation
        });

        // Chat events
        socket.on('chat:msg', (data) => {
            setMessages(prev => [...prev, {
                id: Date.now() + Math.random(),
                sender: data.from,
                text: data.text,
                timestamp: new Date()
            }]);
        });

        // Puzzle events
        socket.on('puzzle:result', (data) => {
            console.log('Puzzle result:', data);
            if (data.ok) {
                // Puzzle solved, update game state
                setGameState(prev => ({
                    ...prev,
                    currentRoomIndex: data.nextRoomIndex
                }));
            }
        });

        socket.on('puzzle:state', (data) => {
            // Sync puzzle state between clients
            setGameState(prev => ({
                ...prev,
                puzzleState: data
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [gameId]);

    const sendMessage = (text) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('chat:msg', { text });
        }
    };

    const sendPuzzleState = (state) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('puzzle:state', state);
        }
    };

    return {
        messages,
        sendMessage,
        players,
        setPlayers,
        gameState,
        setGameState,
        isConnected,
        sendPuzzleState
    };
};
