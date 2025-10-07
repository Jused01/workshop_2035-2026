import React, { useState } from "react";
import HomeMenu from "./components/HomeMenu";
import WaitingRoom from "./components/WaitingRoom";
import EnigmeSelectionRoom from "./components/EnigmeSelectionRoom";
import GameRoom from "./components/GameRoom";

export default function App() {
    const [screen, setScreen] = useState("home");
    const [playerName, setPlayerName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [players, setPlayers] = useState([]);
    const [selectedEnigme, setSelectedEnigme] = useState(1);
    const [score, setScore] = useState(0);

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

    const handleStartGame = () => {
        setScreen("selection");
    };

    const handleSelectEnigme = (enigmeId) => {
        setSelectedEnigme(enigmeId);
        setScreen("game");
    };

    const handleEnigmeComplete = (points) => {
        setScore((prev) => prev + points);
        if (selectedEnigme < 4) {
            setSelectedEnigme((prev) => prev + 1);
        } else {
            alert("🎉 Victoire ! Vous avez résolu toutes les énigmes !");
        }
    };

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
    if (screen === "selection")
        return (
            <EnigmeSelectionRoom
                playerName={playerName}
                score={score}
                onSelectEnigme={handleSelectEnigme}
            />
        );
    if (screen === "game")
        return (
            <GameRoom
                roomCode={roomCode}
                playerName={playerName}
                players={players}
                currentEnigme={selectedEnigme}
                score={score}
                onComplete={handleEnigmeComplete}
            />
        );
}
