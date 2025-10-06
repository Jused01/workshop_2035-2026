import React, { useState } from "react";
import HomeMenu from "./components/HomeMenu";
import WaitingRoom from "./components/WaitingRoom";
import EnigmeSelectionRoom from "./components/EnigmeSelectionRoom"; // Nouvelle salle
import GameRoom from "./components/GameRoom";

export default function App() {
    const [screen, setScreen] = useState("home");
    const [playerName, setPlayerName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [players, setPlayers] = useState([]);
    const [selectedEnigme, setSelectedEnigme] = useState(1); // Énigme sélectionnée

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
        setScreen("selection"); // Passe à la salle de sélection
    };

    const handleSelectEnigme = (enigmeId) => {
        setSelectedEnigme(enigmeId);
        setScreen("game"); // Passe à la GameRoom avec l'énigme choisie
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
                onSelectEnigme={handleSelectEnigme}
            />
        );
    if (screen === "game")
        return (
            <GameRoom
                roomCode={roomCode}
                playerName={playerName}
                players={players}
                currentEnigme={selectedEnigme} // Passe l'énigme sélectionnée
            />
        );
}
