import { useState, useEffect } from "react";

// Simulation Socket.IO (à remplacer plus tard par une vraie connexion)
export const useSocket = (roomCode) => {
    const [messages, setMessages] = useState([]);
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        if (roomCode) console.log("Connecté au salon:", roomCode);
    }, [roomCode]);

    const sendMessage = (msg) => {
        const newMsg = {
            id: Date.now(),
            sender: "Vous",
            text: msg,
            time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, newMsg]);
    };

    return { messages, sendMessage, players, setPlayers, gameState, setGameState };
};
