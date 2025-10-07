import React, { useState, useEffect, useRef } from "react";
import { Trophy, DoorOpen, UserRound, BookOpen, Sparkles } from "lucide-react";

const HomeMenu = ({ onEnterManor }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const [playerName, setPlayerName] = useState("");
    const [showNameInput, setShowNameInput] = useState(false);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const canvasWidth = 800;
    const canvasHeight = 500;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const drawScene = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // === ARRIÈRE-PLAN ===
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, "#050a28");
            skyGradient.addColorStop(1, "#1a1030");
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Étoiles
            for (let i = 0; i < 150; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(Math.random() * canvas.width, Math.random() * (canvas.height / 2), Math.random() * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Lune
            ctx.beginPath();
            ctx.fillStyle = "#f5f3ce";
            ctx.arc(700, 100, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "rgba(245, 243, 206, 0.2)";
            ctx.arc(700, 100, 60, 0, Math.PI * 2);
            ctx.fill();

            // === MUSÉE ===
            ctx.fillStyle = "#2d1b3d";
            ctx.fillRect(100, 150, 600, 300);
            ctx.beginPath();
            ctx.moveTo(80, 150);
            ctx.lineTo(400, 80);
            ctx.lineTo(720, 150);
            ctx.closePath();
            ctx.fillStyle = "#3d2b4c";
            ctx.fill();
            ctx.fillStyle = "#1a1030";
            ctx.fillRect(350, 250, 100, 150);
            ctx.fillStyle = "#3a241d";
            ctx.fillRect(360, 260, 80, 130);
            ctx.beginPath();
            ctx.fillStyle = "#d4af37";
            ctx.arc(400, 325, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#1a1030";
            ctx.fillRect(370, 120, 160, 40);
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#d4af37";
            ctx.textAlign = "center";
            ctx.fillText("MUSÉE OUBLIÉ", 450, 150);

            // === SOL ===
            ctx.fillStyle = "#1a1020";
            ctx.fillRect(0, 450, canvas.width, 50);

            // === PERSONNAGE ===
            const baseX = playerX * 8;
            const baseY = playerY * 5;
            const t = Date.now() / 300;
            const bobbing = Math.sin(t) * 2;
            const legSwing = Math.sin(t * 2) * 8;

            // Ombre
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(baseX - 12, baseY + 45, 24, 4);

            // Jambes
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(baseX - 8, baseY + 25 + bobbing, 8, 15 - legSwing);
            ctx.fillRect(baseX + 0, baseY + 25 + bobbing, 8, 15 + legSwing);
            ctx.fillStyle = "#1a202c";
            ctx.fillRect(baseX - 8, baseY + 40 + bobbing - legSwing, 8, 5);
            ctx.fillRect(baseX + 0, baseY + 40 + bobbing + legSwing, 8, 5);

            // Corps
            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 12, baseY - 5 + bobbing, 24, 25);
            ctx.fillStyle = "#4c6ef5";
            ctx.fillRect(baseX - 12, baseY - 5 + bobbing, 4, 25);
            ctx.fillStyle = "#748ffc";
            ctx.fillRect(baseX + 8, baseY - 5 + bobbing, 4, 25);

            // Bras
            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 18, baseY + 5 + bobbing, 6, 18);
            ctx.fillRect(baseX + 12, baseY + 5 + bobbing, 6, 18);
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 18, baseY + 23 + bobbing, 6, 5);
            ctx.fillRect(baseX + 12, baseY + 23 + bobbing, 6, 5);

            // Tête
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 12, baseY - 15 + bobbing, 24, 20);
            ctx.fillStyle = "#ffcaa0";
            ctx.fillRect(baseX - 12, baseY - 15 + bobbing, 4, 20);
            ctx.fillStyle = "#ffe0cc";
            ctx.fillRect(baseX + 8, baseY - 15 + bobbing, 4, 20);
            ctx.fillStyle = "#8b5a3c";
            ctx.fillRect(baseX - 12, baseY - 20 + bobbing, 24, 5);
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 8, baseY - 10 + bobbing, 3, 4);
            ctx.fillRect(baseX + 5, baseY - 10 + bobbing, 3, 4);
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 3, baseY + 3 + bobbing, 6, 2);

            rafRef.current = requestAnimationFrame(drawScene);
        };

        rafRef.current = requestAnimationFrame(drawScene);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playerX, playerY]);

    const handleKeyPress = (e) => {
        const speed = 2;
        switch (e.key) {
            case "ArrowUp": setPlayerY((p) => Math.max(20, p - speed)); break;
            case "ArrowDown": setPlayerY((p) => Math.min(100, p + speed)); break;
            case "ArrowLeft": setPlayerX((p) => Math.max(10, p - speed)); break;
            case "ArrowRight": setPlayerX((p) => Math.min(100, p + speed)); break;
            case "Enter":
                if (playerX > 40 && playerX < 60 && playerY > 70) {
                    setShowNameInput(true);
                }
                break;
            default: break;
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [playerX, playerY]);

    const handleStartGame = () => {
        if (playerName.trim()) onEnterManor(playerName.trim());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-900 text-gray-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Décorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-64 bg-purple-900/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-900/20 rounded-full blur-3xl"></div>
            </div>

            {/* Titre */}
            <h1 className="text-6xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-lg z-10">
                <Sparkles className="inline-block mr-4 w-12 h-12 text-amber-400" />
                Le Musée Oublié
            </h1>

            {/* Sous-titre */}
            <p className="text-xl mb-8 text-center text-indigo-200 italic max-w-2xl z-10">
                Un trésor artistique sommeille dans les ombres de Nantes... Osez percer ses mystères.
            </p>

            {/* Zone de jeu */}
            <div className="relative mb-8 w-full max-w-5xl z-10">
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="border-4 border-indigo-600/50 rounded-2xl shadow-2xl bg-gray-900/50 mx-auto block"
                />

                {/* Cadrans d'information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {/* Histoire */}
                    <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-xl border-2 border-indigo-600/30 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <BookOpen className="w-6 h-6 text-indigo-400" />
                            <h3 className="text-lg font-bold text-indigo-100">L'Histoire</h3>
                        </div>
                        <p className="text-indigo-200 text-sm leading-relaxed">
                            Le Musée Oublié de Nantes renferme des œuvres perdues depuis des décennies.
                            Cinq énigmes protègent son secret ultime. Résolvez-les pour découvrir la vérité cachée.
                        </p>
                    </div>

                    {/* Contrôles */}
                    <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-xl border-2 border-indigo-600/30 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <DoorOpen className="w-6 h-6 text-indigo-400" />
                            <h3 className="text-lg font-bold text-indigo-100">Contrôles</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {["↑", "←", "→"].map((key, idx) => (
                                <kbd key={idx} className="bg-indigo-600 text-white px-2 py-2 rounded-lg text-center font-bold shadow-md text-sm">
                                    {key}
                                </kbd>
                            ))}
                            <div className="col-start-2">
                                <kbd className="bg-indigo-600 text-white px-2 py-2 rounded-lg text-center font-bold shadow-md text-sm block">
                                    ↓
                                </kbd>
                            </div>
                        </div>
                        <p className="text-indigo-200 text-xs">
                            Appuyez sur <kbd className="bg-amber-500 text-black px-2 py-1 rounded font-bold">Entrée</kbd> devant la porte.
                        </p>
                    </div>

                    {/* Objectif */}
                    <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-xl border-2 border-indigo-600/30 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Trophy className="w-6 h-6 text-amber-400" />
                            <h3 className="text-lg font-bold text-indigo-100">Objectif</h3>
                        </div>
                        <p className="text-indigo-200 text-sm leading-relaxed">
                            Résolvez les 5 énigmes artistiques pour découvrir la vérité cachée du musée et déverrouiller son trésor.
                        </p>
                    </div>
                </div>
            </div>

            {/* Pop-up pour le nom */}
            {showNameInput && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="bg-gray-800/95 backdrop-blur-lg p-10 rounded-2xl border border-indigo-600 shadow-2xl max-w-md w-full">
                        <div className="flex items-center gap-4 mb-6">
                            <UserRound className="w-12 h-12 text-indigo-400" />
                            <div>
                                <h2 className="text-3xl font-bold text-indigo-100">Bienvenue, Aventurier</h2>
                                <p className="text-indigo-300 text-sm mt-1">Quel est votre nom ?</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
                            placeholder="Ex: Indiana Jones"
                            className="w-full bg-gray-700/60 border border-indigo-600 rounded-lg px-5 py-4 mb-8 text-indigo-100 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                            autoFocus
                        />
                        <button
                            onClick={handleStartGame}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 rounded-lg font-bold text-xl text-white hover:scale-105 transition-transform hover:shadow-lg flex items-center justify-center gap-3"
                        >
                            <DoorOpen className="w-6 h-6" />
                            Entrer dans le Musée
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeMenu;
