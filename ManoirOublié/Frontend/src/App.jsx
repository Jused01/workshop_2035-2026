import React, { useEffect, useState } from "react";
import HomeMenu from "./components/HomeMenu";
import WaitingRoom from "./components/WaitingRoom";
import EnigmeSelectionRoom from "./components/EnigmeSelectionRoom";
import GameRoom, { GameRoomReturnFloating } from "./components/GameRoom";
import { createGame, joinGame, startGame } from "./services/api";

export default function App() {
    const [screen, setScreen] = useState("home");
    const [playerName, setPlayerName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [gameId, setGameId] = useState("");
    const [playerToken, setPlayerToken] = useState("");
    const [players, setPlayers] = useState([]);
    const [selectedEnigme, setSelectedEnigme] = useState(1);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Restaurer la session au chargement
    useEffect(() => {
        try {
            const token = localStorage.getItem('playerToken');
            const gid = localStorage.getItem('gameId');
            const code = localStorage.getItem('roomCode');
            const name = localStorage.getItem('playerName');

            if (token) setPlayerToken(token);
            if (gid) setGameId(gid);
            if (code) setRoomCode(code);
            if (name) setPlayerName(name);

            const savedScreen = sessionStorage.getItem("app:screen");
            const savedEnigme = sessionStorage.getItem("app:selectedEnigme");

            if (savedScreen && savedScreen !== "home") {
                setScreen(savedScreen);
            } else if (token && gid) {
                // Si on a un token mais pas d'écran sauvegardé, retour à la waiting room
                setScreen("waiting");
            }

            if (savedEnigme) {
                setSelectedEnigme(parseInt(savedEnigme, 10) || 1);
            }
        } catch (e) {
            console.error("Erreur lors de la restauration de session:", e);
        }
    }, []);

    // Persister les changements d'écran
    useEffect(() => {
        try {
            sessionStorage.setItem("app:screen", screen);
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'écran:", e);
        }
    }, [screen]);

    useEffect(() => {
        try {
            sessionStorage.setItem("app:selectedEnigme", String(selectedEnigme));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de l'énigme:", e);
        }
    }, [selectedEnigme]);

    const handleEnterManor = async (name) => {
        setLoading(true);
        setError("");
        try {
            const response = await createGame(name, "curator");
            setPlayerName(name);
            setRoomCode(response.code);
            setGameId(response.gameId);
            setPlayerToken(response.playerToken);

            // Persister en localStorage
            localStorage.setItem('playerToken', response.playerToken);
            localStorage.setItem('gameId', response.gameId);
            localStorage.setItem('roomCode', response.code);
            localStorage.setItem('playerName', name);

            setPlayers([{ id: 'temp', name, ready: false, role: 'curator', score: 0 }]);
            setScreen("home");
        } catch (err) {
            console.error("Erreur création partie:", err);
            setError("Erreur lors de la création de la partie: " + (err.message || err));
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
            setRoomCode(response.code);
            setGameId(response.gameId);
            setPlayerToken(response.playerToken);

            // Persister en localStorage
            localStorage.setItem('playerToken', response.playerToken);
            localStorage.setItem('gameId', response.gameId);
            localStorage.setItem('roomCode', response.code);
            localStorage.setItem('playerName', name);

            // Les joueurs seront chargés via Socket.IO
            setPlayers([{ id: 'temp', name, ready: false, role: 'analyst', score: 0 }]);
            setScreen("waiting");
        } catch (err) {
            console.error("Erreur connexion partie:", err);
            const errorMsg = err.message || err;
            if (errorMsg.includes("404")) {
                setError("Code de partie invalide");
            } else if (errorMsg.includes("403")) {
                setError("Cette partie est complète ou déjà terminée");
            } else {
                setError("Erreur lors de la connexion: " + errorMsg);
            }
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
        setError("");
        try {
            await startGame();
            setScreen("selection");
        } catch (err) {
            console.error("Erreur démarrage partie:", err);
            setError("Erreur lors du démarrage de la partie: " + (err.message || err));
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

        // Afficher une notification de succès
        console.log(`✅ Énigme ${selectedEnigme} complétée ! +${points} points`);

        // Retour à la salle de sélection après 2 secondes
        setTimeout(() => {
            setScreen("selection");
        }, 2000);
    };

    const handleReturnToSelection = () => {
        console.log("[App] Retour à la sélection");
        setScreen("selection");
    };

    // Raccourci clavier ESC pour retourner
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && screen === "game") {
                setScreen("selection");
            }
        };
        const onAppReturn = () => setScreen("selection");

        window.addEventListener("keydown", onKey);
        window.addEventListener("app:return", onAppReturn);

        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("app:return", onAppReturn);
        };
    }, [screen]);

    // Helpers de debug (développement uniquement)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            window.__appDebug = {
                getScreen: () => screen,
                setScreen: (s) => setScreen(s),
                getState: () => ({
                    screen,
                    playerName,
                    roomCode,
                    gameId,
                    players,
                    selectedEnigme,
                    score,
                }),
            };
        }
    }, [screen, playerName, roomCode, gameId, players, selectedEnigme, score]);

    // Rendu conditionnel des écrans
    if (screen === "home") {
        return (
            <HomeMenu
                onEnterManor={handleEnterManor}
                onJoinGame={handleJoinGame}
                loading={loading}
                error={error}
            />
        );
    }

    if (screen === "waiting") {
        return (
            <WaitingRoom
                roomCode={roomCode}
                gameId={gameId}
                playerName={playerName}
                playerToken={playerToken}
                players={players}
                setPlayers={setPlayers}
                onReady={handleReady}
                onStartGame={handleStartGame}
                onLeaveRoom={() => setScreen("home")}
                loading={loading}
                error={error}
            />
        );
    }

    if (screen === "selection") {
        return (
            <EnigmeSelectionRoom
                playerName={playerName}
                players={players}
                score={score}
                onSelectEnigme={handleSelectEnigme}
            />
        );
    }

    if (screen === "game") {
        return (
            <>
                <GameRoom
                    gameId={gameId}
                    roomCode={roomCode}
                    playerName={playerName}
                    playerToken={playerToken}
                    players={players}
                    currentEnigme={selectedEnigme}
                    score={score}
                    onComplete={handleEnigmeComplete}
                    onReturn={handleReturnToSelection}
                />
                <GameRoomReturnFloating onReturn={handleReturnToSelection} />
            </>
        );
    }

    // Fallback
    return <div>Écran inconnu</div>;
}