import React, { useState } from "react";
import HomeMenu from "./components/HomeMenu";
import WaitingRoom from "./components/WaitingRoom";
import GameRoom from "./components/GameRoom";

export default function App() {
    const [screen, setScreen] = useState("home");
    const [playerName, setPlayerName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [players, setPlayers] = useState([]);

    const handleEnterManor = (name) => {
        setPlayerName(name);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(code);
        setPlayers([{ name, ready: false }]);
        setScreen("waiting");
    };

    const handleReady = (name, ready) => {
        setPlayers((prev) =>
            prev.map((p) => (p.name === name ? { ...p, ready } : p))
        );
    };

    const handleStartGame = () => setScreen("game");

    if (screen === "home") return <HomeMenu onEnterManor={handleEnterManor} />;
    if (screen === "waiting")
        return (
            <WaitingRoom
                roomCode={roomCode}
                playerName={playerName}
                players={players}
                onReady={handleReady}
                onStartGame={handleStartGame}
            />
        );
    if (screen === "game")
        return (
            <GameRoom
                roomCode={roomCode}
                playerName={playerName}
                players={players}
            />
        );
}
