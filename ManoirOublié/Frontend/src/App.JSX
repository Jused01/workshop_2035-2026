import React, { useState } from "react";
import HomeMenu from "./components/HomeMenu";
import WaitingRoom from "./components/WaitingRoom";
import EnigmeSelectionRoom from "./components/EnigmeSelectionRoom";
import GameRoom from "./components/GameRoom";
import { createGame, joinGame, startGame, getGame } from "./services/api";

export default function App() {
    const [screen, setScreen] = useState("home");
    const [playerName, setPlayerName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [gameId, setGameId] = useState("");
    const [playerToken, setPlayerToken] = useState("");
    const [players, setPlayers] = useState([]);
    const [selectedEnigme, setSelectedEnigme] = useState(1);
    const [score, setScore] = useState(0);
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleEnterManor = async (name) => {
        setLoading(true);
        setError("");
        try {
            const response = await createGame(name, "curator");
            setPlayerName(name);
            setRoomCode(response.code);
            setGameId(response.gameId);
            setPlayerToken(response.playerToken);
            localStorage.setItem('playerToken', response.playerToken);
            setPlayers([{ name, ready: false }]);
            setScreen("waiting");
        } catch (err) {
            setError("Erreur lors de la création de la partie: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGame = async (code, name) => {
        setLoading(true);
        setError("");
        try {
            const response = await joinGame(code, name, "analyst");
            setPlayerName(name);
            setRoomCode(code);
            setGameId(response.gameId);
            setPlayerToken(response.playerToken);
            localStorage.setItem('playerToken', response.playerToken);
            setScreen("waiting");
        } catch (err) {
            setError("Erreur lors de la connexion à la partie: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReady = (name, ready) => {
        setPlayers((prev) =>
            prev.map((p) => (p.name === name ? { ...p, ready } : p))
        );
    };

    const handleStartGame = async () => {
        setLoading(true);
        try {
            await startGame();
            setScreen("selection");
        } catch (err) {
            setError("Erreur lors du démarrage de la partie: " + err.message);
        } finally {
            setLoading(false);
        }
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

    if (screen === "home") return <HomeMenu onEnterManor={handleEnterManor} loading={loading} error={error} />;
    if (screen === "waiting")
        return (
            <WaitingRoom
                roomCode={roomCode}
                playerName={playerName}
                players={players}
                onReady={handleReady}
                onStartGame={handleStartGame}
                loading={loading}
                error={error}
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
                gameId={gameId}
                roomCode={roomCode}
                playerName={playerName}
                players={players}
                currentEnigme={selectedEnigme}
                score={score}
                onComplete={handleEnigmeComplete}
            />
        );
}
