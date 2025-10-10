import React from "react";
import { Trophy, Star, Sparkles, Home, RotateCcw } from "lucide-react";

export default function CongratulationsScreen({ 
    playerName, 
    score, 
    onReturnHome, 
    onRestartGame,
    customMessage = "Félicitations ! Vous avez résolu toutes les énigmes du Manoir Oublié !"
}) {
    // Debug helper pour le développement
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🎉 CongratulationsScreen affiché:', { playerName, score, customMessage });
        }
    }, [playerName, score, customMessage]);
    return (
        <div className="w-full flex justify-center">
            <div className="max-w-4xl w-full panel text-center" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.06), rgba(139,92,246,0.04))' }}>
                {/* Animation de confettis simulée avec des étoiles */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 flex justify-center items-center">
                        {[...Array(12)].map((_, i) => (
                            <Star
                                key={i}
                                className="absolute w-6 h-6 text-yellow-400 animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${1 + Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Trophée principal */}
                    <div className="relative z-10">
                        <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6 animate-bounce" />
                    </div>
                </div>

                {/* Titre principal */}
                <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 mb-6 drop-shadow-2xl">
                    FÉLICITATIONS !
                </h1>

                {/* Message personnalisé */}
                <div className="bg-gradient-to-r from-amber-800/30 to-purple-800/30 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-amber-500/30 shadow-2xl">
                    <p className="text-2xl md:text-3xl text-amber-100 leading-relaxed font-medium">
                        {customMessage}
                    </p>
                </div>

                {/* Informations du joueur */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-800/30 to-indigo-800/30 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Sparkles className="w-8 h-8 text-blue-400" />
                            <h3 className="text-xl font-bold text-blue-200">Joueur</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-100">{playerName}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-800/30 to-emerald-800/30 backdrop-blur-lg rounded-xl p-6 border border-green-500/30">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <Trophy className="w-8 h-8 text-green-400" />
                            <h3 className="text-xl font-bold text-green-200">Score Final</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-100">{score} points</p>
                    </div>
                </div>

                {/* Message de remerciement */}
                <div className="bg-gradient-to-r from-purple-800/20 to-pink-800/20 backdrop-blur-lg rounded-xl p-6 mb-8 border border-purple-500/30">
                    <p className="text-lg text-purple-200 leading-relaxed">
                        Merci d'avoir exploré les mystères du Manoir Oublié. 
                        Votre perspicacité et votre détermination ont permis de révéler tous les secrets cachés.
                    </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={onRestartGame}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <RotateCcw className="w-6 h-6" />
                        Rejouer
                    </button>
                    
                    <button
                        onClick={onReturnHome}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <Home className="w-6 h-6" />
                        Retour au Menu
                    </button>
                </div>

            </div>
        </div>
    );
}
