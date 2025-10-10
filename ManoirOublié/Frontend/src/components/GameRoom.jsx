import React, { useState, useEffect, useRef } from "react";
import { Clock, Trophy, MessageSquare, ArrowLeft, Send, Wifi, WifiOff } from "lucide-react";
import { useSocket } from "../services/useSocket";

// Import des énigmes
import Enigme1Puzzle from "./Enigmes/Enigme1Puzzle";
import Enigme2Lumiere from "./Enigmes/Enigme2Lumiere";
import Enigme3Son from "./Enigmes/Enigme3Son";
import Enigme4Timeline from "./Enigmes/Enigme4TimeLine";
import Enigme5Poem from "./Enigmes/Enigme5Poem";

export default function GameRoom({ gameId, roomCode, playerName, playerToken, players, currentEnigme, score, onComplete, onReturn }) {
    const [chatInput, setChatInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes par défaut
    const messagesEndRef = useRef(null);

    const socketHook = useSocket(gameId, {
        onPuzzleSolved: (data) => {
            console.log("🎯 Puzzle solved in GameRoom:", data);
            if (data.player === playerName) {
                handleEnigmeComplete(data.points || 400);
            }
        },
        onGameStateUpdate: (data) => {
            // Ne rien faire ici pour éviter les boucles infinies
        },
        onGameCompleted: (data) => {
            // Le jeu est terminé, afficher l'écran de félicitations
            console.log("🎉 Jeu terminé !", data);
            // Déclencher l'écran de félicitations via un événement personnalisé
            window.dispatchEvent(new CustomEvent('game:completed', { detail: data }));
        }
    });

    const { messages, sendMessage, isConnected, gameState, sendGameStateUpdate } = socketHook;

    // Exposer le hook socket globalement pour App.jsx
    useEffect(() => {
        window.__socketHook = socketHook;
        return () => {
            delete window.__socketHook;
        };
    }, [socketHook]);

    // Timer de la partie
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll du chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Raccourci clavier pour retourner
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                if (onReturn) onReturn();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onReturn]);

    const handleEnigmeComplete = (points) => {
        onComplete(points);
    };

    // Envoi du message chat
    const handleSendMessage = () => {
        if (chatInput.trim() && isConnected) {
            sendMessage(chatInput.trim());
            setChatInput("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="w-full flex justify-center">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="bg-gray-800/80 backdrop-blur-lg rounded-xl p-4 mb-4 flex items-center justify-between border border-gray-700">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Clock className="w-6 h-6 text-red-400" />
                            <span className="font-mono text-2xl font-bold">
                                {Math.floor(timeLeft / 60)}:
                                {(timeLeft % 60).toString().padStart(2, "0")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            <span className="font-bold text-xl">Score : {score}</span>
                        </div>
                        <div className="bg-gray-700 px-4 py-2 rounded-lg font-mono">
                            Énigme {currentEnigme}/5
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <Wifi className="w-4 h-4 text-green-400" />
                                    <span className="text-xs text-green-400">En ligne</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-4 h-4 text-red-400" />
                                    <span className="text-xs text-red-400">Hors ligne</span>
                                </>
                            )}
                        </div>
                        <button
                            onClick={() => onReturn && onReturn()}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg border border-gray-600 transition-colors"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Retour</span>
                        </button>
                    </div>
                </div>

                {/* Corps du jeu: left instructions | center puzzle | right chat */}
                <div className="game-grid">
                    {/* Left instructions panel */}
                    <div className="side-panel-left">
                        <aside className="panel bg-gray-800/80 rounded-xl p-8 border border-gray-700">
                        <h3 className="font-bold text-xl mb-3">Instructions</h3>
                        <p className="card-text mb-4">Travaillez en équipe: sélectionnez une énigme, résolvez-la et signalez la solution. Les énigmes sont partagées entre tous les joueurs.</p>
                        <ul className="card-text" style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 1.6 }}>
                            <li>Chaque énigme rapporte des points.</li>
                            <li>Soyez attentif aux indices visuels.</li>
                            <li>Utilisez le chat pour coordonner.</li>
                        </ul>
                        <div style={{ marginTop: 12 }}>
                            <button onClick={() => window.dispatchEvent(new CustomEvent('app:return'))} className="mode-btn">Retour à la sélection</button>
                        </div>
                        </aside>
                    </div>

                    {/* Center puzzle area */}
                    <main className="bg-gray-800/80 rounded-xl p-10 border border-gray-700" style={{ minHeight: '620px' }}>
                        <div className="puzzle-inner">
                            {currentEnigme === 1 && <Enigme1Puzzle onComplete={handleEnigmeComplete} />}
                            {currentEnigme === 2 && <Enigme2Lumiere onComplete={handleEnigmeComplete} />}
                            {currentEnigme === 3 && <Enigme3Son onComplete={handleEnigmeComplete} />}
                            {currentEnigme === 4 && <Enigme4Timeline onComplete={handleEnigmeComplete} />}
                            {currentEnigme === 5 && <Enigme5Poem onComplete={handleEnigmeComplete} />}
                        </div>
                    </main>

                    {/* Chat */}
                    <div className="side-panel-right">
                        <aside className="panel bg-gray-800/80 rounded-xl p-6 flex flex-col border border-gray-700" style={{ minHeight: '640px' }}>
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
                            <h3 className="font-bold flex items-center gap-2 text-lg">
                                <MessageSquare className="w-6 h-6" />
                                Chat d'équipe
                            </h3>
                            <div className="text-xs text-gray-400">
                                {players.length} {players.length > 1 ? 'joueurs' : 'joueur'}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2" style={{ scrollbarWidth: 'thin' }}>
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Aucun message pour le moment</p>
                                    <p className="text-xs mt-1">Soyez le premier à parler !</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`p-3 rounded-lg ${
                                            msg.system
                                                ? 'bg-indigo-900/30 border border-indigo-700/50'
                                                : msg.sender === playerName
                                                    ? 'bg-amber-900/30 border border-amber-700/50'
                                                    : 'bg-gray-700/40 border border-gray-600/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className={`font-semibold text-sm ${
                                                msg.system
                                                    ? 'text-indigo-300'
                                                    : msg.sender === playerName
                                                        ? 'text-amber-400'
                                                        : 'text-gray-300'
                                            }`}>
                                                {msg.sender}
                                                {msg.sender === playerName && (
                                                    <span className="ml-1 text-xs opacity-70">(vous)</span>
                                                )}
                                            </span>
                                            {msg.timestamp && (
                                                <span className="text-xs text-gray-500">
                                                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-200 text-sm break-words">{msg.text}</p>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={isConnected ? "Tapez un message..." : "Connexion..."}
                                disabled={!isConnected}
                                className="flex-1 bg-gray-700 rounded-lg px-3 py-3 text-sm text-gray-200 placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                maxLength={500}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || !isConnected}
                                className="bg-amber-700 hover:bg-amber-600 px-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                title="Envoyer (Entrée)"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {!isConnected && (
                            <div className="mt-2 text-xs text-orange-400 text-center">
                                ⚠️ Reconnexion au serveur...
                            </div>
                        )}
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Bouton flottant de retour
export function GameRoomReturnFloating({ onReturn }) {
    return (
        <button
            onClick={() => {
                if (onReturn) onReturn();
                try { window.dispatchEvent(new CustomEvent('app:return')); } catch (_) {}
            }}
            type="button"
            aria-label="Retour"
            style={{
                position: 'fixed',
                left: '16px',
                bottom: '16px',
                zIndex: 2147483647,
                pointerEvents: 'auto',
                background: 'rgba(31,41,55,0.95)',
                color: '#e5e7eb',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #4b5563',
                boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                fontWeight: 700,
                cursor: 'pointer'
            }}
        >
            <span>← Retour</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>(Esc)</span>
        </button>
    );
}