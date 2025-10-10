import React, { useEffect, useState } from "react";
import HomeMenu from "./components/HomeMenu";
import WaitingRoom from "./components/WaitingRoom";
import EnigmeSelectionRoom from "./components/EnigmeSelectionRoom";
import GameRoom, { GameRoomReturnFloating } from "./components/GameRoom";
import CongratulationsScreen from "./components/CongratulationsScreen";
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
    const [completedEnigmes, setCompletedEnigmes] = useState(new Set());
    const [globalCompletedEnigmes, setGlobalCompletedEnigmes] = useState(new Set());
    const [isGameCompleted, setIsGameCompleted] = useState(false);
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
            const savedCompleted = sessionStorage.getItem("app:completedEnigmes");

            if (savedScreen && savedScreen !== "home") {
                setScreen(savedScreen);
            } else if (token && gid) {
                // Si on a un token mais pas d'écran sauvegardé, retour à la waiting room
                setScreen("waiting");
            }

            if (savedEnigme) {
                setSelectedEnigme(parseInt(savedEnigme, 10) || 1);
            }

            if (savedCompleted) {
                try {
                    const completed = JSON.parse(savedCompleted);
                    setCompletedEnigmes(new Set(completed));
                } catch (e) {
                    console.error("Erreur lors de la restauration des énigmes complétées:", e);
                }
            }
            
            // Charger l'état global des énigmes complétées
            const savedGlobalCompleted = sessionStorage.getItem("app:globalCompletedEnigmes");
            if (savedGlobalCompleted) {
                try {
                    const globalCompleted = JSON.parse(savedGlobalCompleted);
                    setGlobalCompletedEnigmes(new Set(globalCompleted));
                } catch (e) {
                    console.error("Erreur lors de la restauration des énigmes globales complétées:", e);
                }
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

    useEffect(() => {
        try {
            sessionStorage.setItem("app:completedEnigmes", JSON.stringify([...completedEnigmes]));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde des énigmes complétées:", e);
        }
    }, [completedEnigmes]);

    useEffect(() => {
        try {
            sessionStorage.setItem("app:globalCompletedEnigmes", JSON.stringify([...globalCompletedEnigmes]));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde des énigmes globales complétées:", e);
        }
    }, [globalCompletedEnigmes]);

    // Synchroniser la progression globale avec les événements socket
    useEffect(() => {
        const checkSocketState = () => {
            const { gameState } = window.__socketHook || {};
            if (gameState && gameState.completedEnigmes) {
                console.log("🔄 [App] Updating global completed enigmes:", gameState.completedEnigmes);
                setGlobalCompletedEnigmes(new Set(gameState.completedEnigmes));
            }
        };
        
        // Vérifier immédiatement
        checkSocketState();
        
        // Vérifier périodiquement
        const interval = setInterval(checkSocketState, 1000);
        
        return () => clearInterval(interval);
    }, []);


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
            setScreen("waiting");
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
        // Vérifier si l'énigme n'est pas déjà complétée globalement
        if (globalCompletedEnigmes.has(enigmeId)) {
            alert("Cette énigme a déjà été résolue par un autre joueur !");
            return;
        }
        
        setSelectedEnigme(enigmeId);
        setScreen("game");
        
        // Notifier les autres joueurs de la sélection
        try {
            const { sendEnigmeSelection } = window.__socketHook || {};
            if (sendEnigmeSelection) {
                sendEnigmeSelection(enigmeId);
            }
        } catch (e) {
            console.warn("Impossible d'envoyer la sélection d'énigme:", e);
        }
    };

    const handleEnigmeComplete = (points) => {
        setScore((prev) => prev + points);

        // Mark locally completed
        setCompletedEnigmes((prev) => {
            const newSet = new Set(prev);
            newSet.add(selectedEnigme);
            return newSet;
        });

        // Optimistically update global set so UI reflects it immediately
        const newGlobal = new Set(globalCompletedEnigmes);
        newGlobal.add(selectedEnigme);
        setGlobalCompletedEnigmes(newGlobal);

        console.log(`✅ Énigme ${selectedEnigme} complétée ! +${points} points`);

        // If all enigmes are completed, show congratulations screen and mark game completed
        if (newGlobal.size >= 5) {
            setIsGameCompleted(true);
            setScreen("congratulations");
        } else if (!isGameCompleted) {
            // otherwise return to selection
            setScreen("selection");
        }
    };

    const handleReturnToSelection = () => {
        console.log("[App] Retour à la sélection");
        setScreen("selection");
    };

    const handleReturnHome = () => {
        // Nettoyer la session
        localStorage.removeItem('playerToken');
        localStorage.removeItem('gameId');
        localStorage.removeItem('roomCode');
        localStorage.removeItem('playerName');
        sessionStorage.removeItem("app:screen");
        sessionStorage.removeItem("app:selectedEnigme");
        sessionStorage.removeItem("app:completedEnigmes");
        
        // Reset des états
        setPlayerName("");
        setRoomCode("");
        setGameId("");
        setPlayerToken("");
        setPlayers([]);
        setSelectedEnigme(1);
        setScore(0);
        setCompletedEnigmes(new Set());
        setScreen("home");
    };

    const handleRestartGame = () => {
        // Reset des énigmes complétées et du score
        setCompletedEnigmes(new Set());
        setScore(0);
        setSelectedEnigme(1);
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
        const onGameCompleted = (e) => {
            console.log("🎉 Jeu terminé reçu:", e.detail);
            setScreen("congratulations");
        };

        window.addEventListener("keydown", onKey);
        window.addEventListener("app:return", onAppReturn);
        window.addEventListener("game:completed", onGameCompleted);

        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("app:return", onAppReturn);
            window.removeEventListener("game:completed", onGameCompleted);
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
                    completedEnigmes: [...completedEnigmes],
                }),
            };
        }
    }, [screen, playerName, roomCode, gameId, players, selectedEnigme, score, completedEnigmes]);

    // Rendu conditionnel des écrans, tous centrés via .app-root
    if (screen === "home") {
        return (
            <div className="app-root">
                <div className="app-container">
                    <HomeMenu
                        onEnterManor={handleEnterManor}
                        onJoinGame={handleJoinGame}
                        loading={loading}
                        error={error}
                    />
                </div>
            </div>
        );
    }

    if (screen === "waiting") {
        return (
            <div className="app-root">
                <div className="app-container">
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
                </div>
            </div>
        );
    }

    if (screen === "selection") {
        return (
            <div className="app-root">
                <div className="app-container">
                    <EnigmeSelectionRoom
                        playerName={playerName}
                        players={players}
                        score={score}
                        completedEnigmes={completedEnigmes}
                        globalCompletedEnigmes={globalCompletedEnigmes}
                        onSelectEnigme={handleSelectEnigme}
                    />
                </div>
            </div>
        );
    }

    if (screen === "game") {
        return (
            <div className="app-root">
                <div className="app-container">
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
                </div>
            </div>
        );
    }

    if (screen === "congratulations") {
        return (
            <div className="app-root">
                <div className="app-container">
                    <CongratulationsScreen
                        playerName={playerName}
                        score={score}
                        onReturnHome={handleReturnHome}
                        onRestartGame={handleRestartGame}
                        customMessage="Félicitations ! Vous avez résolu toutes les énigmes du Manoir Oublié ! Votre perspicacité et votre détermination ont permis de révéler tous les secrets cachés de ce mystérieux lieu."
                    />
                </div>
            </div>
        );
    }

    // Fallback
    return (
        <div className="app-root">
            <div className="app-container">
                <div className="panel centered">Écran inconnu</div>
            </div>
        </div>
    );
}