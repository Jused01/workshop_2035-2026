import React, { useState, useEffect } from "react";
import { Users, Trophy, DoorOpen, Wifi, WifiOff, Copy, Check } from "lucide-react";
import { useSocket } from "../services/useSocket";

export default function WaitingRoom({ roomCode, gameId, playerName, playerToken, players, setPlayers, onReady, onStartGame, onLeaveRoom, loading, error }) {
    const [isReady, setIsReady] = useState(false);
    const [copied, setCopied] = useState(false);
    const { isConnected, players: socketPlayers } = useSocket(gameId);

    // Synchroniser les joueurs depuis le socket
    useEffect(() => {
        if (socketPlayers && socketPlayers.length > 0) {
            setPlayers(socketPlayers);
        }
    }, [socketPlayers, setPlayers]);

    const allReady = players.length >= 1 && players.every((p) => p.ready);

    const handleReady = () => {
        setIsReady(!isReady);
        onReady(playerName, !isReady);
    };

    const copyCodeToClipboard = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200 p-8">
            <div className="max-w-4xl mx-auto">
                {/* En-tête */}
                <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold text-indigo-100">
                            <DoorOpen className="inline-block mr-2 w-8 h-8" />
                            Salle d'attente
                        </h2>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <Wifi className="w-5 h-5 text-green-400" />
                                    <span className="text-sm text-green-400">Connecté</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-5 h-5 text-red-400" />
                                    <span className="text-sm text-red-400">Déconnecté</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-amber-600/80 text-black px-6 py-4 rounded-lg text-center font-mono text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                            <span>Code: {roomCode}</span>
                            <button
                                onClick={copyCodeToClipboard}
                                className="bg-amber-700 hover:bg-amber-800 p-2 rounded-lg transition-colors"
                                title="Copier le code"
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-gray-400">
                        Partagez ce code avec des amis ! (Jouable en solo ou à plusieurs - max 4 joueurs)
                    </p>
                </div>

                {/* Liste des joueurs */}
                <div className="bg-gray-800/80 rounded-2xl p-8 mb-6 border border-gray-700">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-indigo-100">
                        <Users className="w-7 h-7" />
                        Joueurs ({players.length}/4)
                    </h3>

                    {players.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>En attente de joueurs...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {players.map((player, idx) => (
                                <div
                                    key={player.id || idx}
                                    className="bg-gray-700/60 p-5 rounded-lg flex items-center justify-between border border-gray-600 transition-all hover:border-indigo-500"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">🎭</span>
                                        <div>
                                            <span className="font-semibold text-lg block">
                                                {player.name}
                                                {player.name === playerName && (
                                                    <span className="ml-2 text-xs text-amber-400">(Vous)</span>
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {player.role === "curator" ? "Créateur" : "Joueur"}
                                            </span>
                                        </div>
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

                            {/* Slots vides */}
                            {[...Array(4 - players.length)].map((_, idx) => (
                                <div
                                    key={`empty-${idx}`}
                                    className="bg-gray-700/30 p-5 rounded-lg flex items-center justify-center border border-dashed border-gray-600"
                                >
                                    <span className="text-gray-500">Slot disponible</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleReady}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                            isReady
                                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                                : "bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700"
                        }`}
                    >
                        {isReady ? "❌ Annuler" : "✅ Je suis prêt !"}
                    </button>

                    {allReady && (
                        <button
                            onClick={onStartGame}
                            disabled={loading || !isConnected}
                            className="flex-1 bg-gradient-to-r from-amber-700 to-amber-600 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DoorOpen className="inline-block mr-2 w-5 h-5" />
                            {loading ? "Démarrage..." : "🚀 Commencer l'aventure"}
                        </button>
                    )}
                </div>

                {/* ✅ Bouton pour quitter la salle */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onLeaveRoom}
                        className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold text-gray-200 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <DoorOpen className="w-5 h-5" />
                        Quitter la salle
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-200 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {!isConnected && (
                    <div className="mt-4 p-3 bg-orange-600/20 border border-orange-600 rounded-lg text-orange-200 text-sm">
                        ⚠️ Connexion au serveur en cours... Les mises à jour en temps réel seront disponibles une fois connecté.
                    </div>
                )}
            </div>
        </div>
    );
};
