// src/components/HomeMenu.jsx
import React, { useState, useEffect, useRef } from "react";
import { Trophy } from "lucide-react";

const HomeMenu = ({ onEnterManor }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const [playerName, setPlayerName] = useState("");
    const [showNameInput, setShowNameInput] = useState(false);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = 600;
        canvas.height = 350;

        let last = Date.now();

        const drawScene = () => {
            const now = Date.now();
            const dt = now - last;
            last = now;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background gradient (terne)
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#151516");
            gradient.addColorStop(1, "#2a2a2b");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Manoir (gris)
            ctx.fillStyle = "#373737";
            ctx.fillRect(150, 100, 300, 250);
            // Shadow/texture
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fillRect(150, 180, 300, 40);

            // Porte (bois terne)
            ctx.fillStyle = "#5b3f2a";
            ctx.fillRect(270, 250, 60, 100);
            // Doorknob
            ctx.beginPath();
            ctx.fillStyle = "#a78b56";
            ctx.arc(322, 300, 4, 0, Math.PI * 2);
            ctx.fill();

            // Windows (dimmed warm light)
            ctx.fillStyle = "#bfa86d";
            ctx.fillRect(180, 150, 40, 50);
            ctx.fillRect(380, 150, 40, 50);

            // Moon (faint)
            ctx.beginPath();
            ctx.fillStyle = "#d8d4ad";
            ctx.arc(500, 60, 36, 0, Math.PI * 2);
            ctx.fill();

            // Ground
            ctx.fillStyle = "#222";
            ctx.fillRect(0, 320, canvas.width, 40);

            // Stickman animated
            const baseX = playerX * 6;
            const baseY = playerY * 3.5;
            // slightly change amplitude based on dt for smoother movement
            const t = now / 150;
            const step = Math.sin(t) * 1.2; // amplitude

            ctx.strokeStyle = "#e6e6e6";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";

            // Head
            ctx.beginPath();
            ctx.arc(baseX, baseY, 8, 0, Math.PI * 2);
            ctx.stroke();

            // Body
            ctx.beginPath();
            ctx.moveTo(baseX, baseY + 8);
            ctx.lineTo(baseX, baseY + 28);
            ctx.stroke();

            // Arms (swing a little)
            ctx.beginPath();
            ctx.moveTo(baseX - 10, baseY + 15 + Math.sin(t / 2) * 0.8);
            ctx.lineTo(baseX + 10, baseY + 15 - Math.sin(t / 2) * 0.8);
            ctx.stroke();

            // Legs (animated)
            ctx.beginPath();
            ctx.moveTo(baseX, baseY + 28);
            ctx.lineTo(baseX - 6 - 4 * step, baseY + 40);
            ctx.moveTo(baseX, baseY + 28);
            ctx.lineTo(baseX + 6 + 4 * step, baseY + 40);
            ctx.stroke();

            rafRef.current = requestAnimationFrame(drawScene);
        };

        rafRef.current = requestAnimationFrame(drawScene);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playerX, playerY]);

    // Movement handler
    const handleKeyPress = (e) => {
        const speed = 2;
        switch (e.key) {
            case "ArrowUp":
                setPlayerY((p) => Math.max(20, p - speed));
                break;
            case "ArrowDown":
                setPlayerY((p) => Math.min(90, p + speed));
                break;
            case "ArrowLeft":
                setPlayerX((p) => Math.max(10, p - speed));
                break;
            case "ArrowRight":
                setPlayerX((p) => Math.min(90, p + speed));
                break;
            case "Enter":
                // If chest/door area
                if (playerX > 40 && playerX < 60 && playerY > 70) {
                    setShowNameInput(true);
                }
                break;
            default:
                break;
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
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-200 p-8 flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">
                🏰 Le Manoir Oublié de Nantes
            </h1>
            <p className="text-lg mb-8 text-gray-400 text-center italic">
                “Un mystère artistique s’éveille dans la poussière du temps...”
            </p>

            <div className="relative mb-8">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={350}
                    className="border-4 border-gray-700 rounded-lg shadow-2xl bg-gray-800"
                />
                <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg text-sm text-gray-300">
                    Utilisez les flèches ⬆️⬇️⬅️➡️ pour vous déplacer
                    <br />
                    Appuyez sur{" "}
                    <kbd className="bg-amber-600 text-black px-2 py-1 rounded">Entrée</kbd>{" "}
                    devant la porte
                </div>
            </div>

            {showNameInput && (
                <div className="bg-gray-800/90 backdrop-blur-lg p-6 rounded-xl w-96 border border-gray-600 shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 text-center text-gray-100">
                        Entrez votre nom
                    </h3>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Votre nom d'aventurier..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-100 placeholder-gray-400"
                        autoFocus
                    />
                    <button
                        onClick={handleStartGame}
                        className="w-full bg-gradient-to-r from-gray-700 to-gray-600 py-3 rounded-lg font-bold text-lg hover:scale-105 transition-transform text-gray-200"
                    >
                        🚪 Entrer dans le Manoir
                    </button>
                </div>
            )}

            <div className="mt-8 bg-gray-800/80 backdrop-blur-lg p-6 rounded-xl max-w-2xl border border-gray-700 shadow-inner">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-100">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    Histoire
                </h3>
                <p className="text-gray-400 leading-relaxed">
                    Le célèbre Manoir des Arts de Nantes, oublié depuis plus d’un demi-siècle,
                    renfermerait un trésor d’artistes disparus. Cinq énigmes, imaginées par
                    les maîtres de la création nantaise, protègent le secret ultime. Ceux
                    capables de les résoudre révéleront la vérité enfouie dans les ombres...
                </p>
            </div>
        </div>
    );
};

export default HomeMenu;
