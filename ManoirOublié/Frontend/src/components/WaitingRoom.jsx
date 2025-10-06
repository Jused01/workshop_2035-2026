import React, { useState } from "react";
import { Users, Trophy } from "lucide-react";

export default function WaitingRoom({
                                        roomCode,
                                        playerName,
                                        players,
                                        onReady,
                                        onStartGame,
                                    }) {
    const [isReady, setIsReady] = useState(false);

    // Modification ici : on accepte 1 joueur prêt au lieu de 2
    const allReady = players.length >= 1 && players.every((p) => p.ready);

    const handleReady = () => {
        setIsReady(!isReady);
        onReady(playerName, !isReady);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-gray-700">
                    <h2 className="text-3xl font-bold mb-4 text-center">
                        🚪 Salle d’attente du Musée
                    </h2>
                    <div className="bg-amber-600/80 text-black px-6 py-4 rounded-lg text-center font-mono text-3xl font-bold mb-4">
                        Code du Salon : {roomCode}
                    </div>
                    <p className="text-center text-gray-400">
                        Partagez ce code avec un ami ! (Minimum 1 joueur requis)
                    </p>
                </div>

                <div className="bg-gray-800/80 rounded-2xl p-8 mb-6 border border-gray-700">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Users className="w-7 h-7" />
                        Aventuriers Présents ({players.length}/4)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {players.map((player, idx) => (
                            <div
                                key={idx}
                                className="bg-gray-700/60 p-5 rounded-lg flex items-center justify-between border border-gray-600"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">🎭</span>
                                    <span className="font-semibold text-lg">{player.name}</span>
                                </div>
                                {player.ready ? (
                                    <span className="bg-green-600 px-4 py-2 rounded-full text-sm font-bold">
                    ✓ Prêt
                  </span>
                                ) : (
                                    <span className="bg-gray-600 px-4 py-2 rounded-full text-sm">
                    En attente...
                  </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleReady}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                            isReady
                                ? "bg-gradient-to-r from-red-600 to-red-700"
                                : "bg-gradient-to-r from-green-700 to-emerald-600"
                        }`}
                    >
                        {isReady ? "❌ Annuler" : "✅ Je suis prêt !"}
                    </button>
                    {allReady && (
                        <button
                            onClick={onStartGame}
                            className="flex-1 bg-gradient-to-r from-amber-700 to-amber-600 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                        >
                            🔥 Commencer l'aventure
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
