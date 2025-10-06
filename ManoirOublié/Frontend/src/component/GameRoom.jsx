import React, { useState, useEffect } from "react";
import { Clock, Trophy, MessageSquare } from "lucide-react";
import { useSocket } from "../services/socket";
import Enigme1Puzzle from "./Enigmes/Enigme1Puzzle";
import Enigme2Lumiere from "./Enigmes/Enigme2Lumiere";
import Enigme3Son from "./Enigmes/Enigme3Son";
import Enigme4Timeline from "./Enigmes/Enigme4Timeline";

export default function GameRoom({ roomCode, playerName, players }) {
    const { messages, sendMessage } = useSocket(roomCode);
    const [chatInput, setChatInput] = useState("");
    const [currentEnigme, setCurrentEnigme] = useState(1);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(1800);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleEnigmeComplete = (points) => {
        setScore((prev) => prev + points);
        if (currentEnigme < 4) setCurrentEnigme((prev) => prev + 1);
        else alert("🎉 Victoire ! Vous avez résolu toutes les énigmes !");
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
