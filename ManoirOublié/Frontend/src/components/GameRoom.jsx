import React, { useState, useEffect } from "react";
import { Clock, Trophy, MessageSquare, ArrowLeft } from "lucide-react";
import { useSocket } from "../services/Socket";
import Enigme1Puzzle from "./Enigmes/Enigme1Puzzle";
import Enigme2Lumiere from "./Enigmes/Enigme2Lumiere";
import Enigme3Son from "./Enigmes/Enigme3Son";
import Enigme4Timeline from "./Enigmes/Enigme4Timeline";

export default function GameRoom({ gameId, roomCode, playerName, players, currentEnigme, score, onComplete, onReturn }) {
    const { messages, sendMessage, isConnected } = useSocket(gameId);
    const [chatInput, setChatInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(1800);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

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

    const handleSendMessage = () => {
        if (chatInput.trim()) {
            sendMessage(chatInput);
            setChatInput("");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200 p-4">
            <div className="max-w-7xl mx-auto">
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
                            Énigme {currentEnigme}/4
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => onReturn && onReturn()}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg border border-gray-600"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Retour</span>
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-4">
                    {/* Zone énigmes */}
                    <div className="lg:col-span-2 bg-gray-800/80 rounded-xl p-8 border border-gray-700">
                        {currentEnigme === 1 && (
                            <Enigme1Puzzle onComplete={handleEnigmeComplete} />
                        )}
                        {currentEnigme === 2 && (
                            <Enigme2Lumiere onComplete={handleEnigmeComplete} />
                        )}
                        {currentEnigme === 3 && (
                            <Enigme3Son onComplete={handleEnigmeComplete} />
                        )}
                        {currentEnigme === 4 && (
                            <Enigme4Timeline onComplete={handleEnigmeComplete} />
                        )}
                    </div>

                    {/* Chat */}
                    <div className="bg-gray-800/80 rounded-xl p-4 flex flex-col h-[600px] border border-gray-700">
                        <h3 className="font-bold mb-3 flex items-center gap-2 text-lg">
                            <MessageSquare className="w-6 h-6" /> Chat d’équipe
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                            {messages.map((msg) => (
                                <div key={msg.id} className="bg-gray-700/40 p-3 rounded text-sm">
                  <span className="font-semibold text-amber-400">
                    {msg.sender}
                  </span>
                                    <p className="text-gray-300 mt-1">{msg.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder="Tapez un message..."
                                className="flex-1 bg-gray-700 rounded px-3 py-2 text-sm text-gray-200"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-amber-700 px-4 rounded font-bold"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// Floating always-on-top return button to avoid overlay issues
// Ensures navigation works even if header is overlapped
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
