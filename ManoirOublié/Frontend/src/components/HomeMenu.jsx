import React, { useState, useEffect, useRef } from "react";
import { Trophy, DoorOpen, UserRound, BookOpen, Sparkles } from "lucide-react";

const HomeMenu = ({ onEnterManor, loading, error }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const [playerName, setPlayerName] = useState("");
    const [showNameInput, setShowNameInput] = useState(false);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

    // Compute responsive canvas size based on viewport
    useEffect(() => {
        const computeSize = () => {
            const maxWidth = Math.min(window.innerWidth - 48, 1200);
            const maxHeight = Math.max(240, window.innerHeight - 260); // leave room for title/cards
            const targetAspect = 800 / 500; // base aspect ratio
            let width = maxWidth;
            let height = Math.round(width / targetAspect);
            if (height > maxHeight) {
                height = maxHeight;
                width = Math.round(height * targetAspect);
            }
            setCanvasSize({ width, height });
        };
        computeSize();
        window.addEventListener('resize', computeSize);
        return () => window.removeEventListener('resize', computeSize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const { width, height } = canvasSize;
        canvas.width = width;
        canvas.height = height;

        const drawScene = () => {
            ctx.clearRect(0, 0, width, height);

            // === ARRIÈRE-PLAN ===
            const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
            skyGradient.addColorStop(0, "#050a28");
            skyGradient.addColorStop(1, "#1a1030");
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, height);

            // Étoiles
            for (let i = 0; i < 150; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * (height / 2), Math.random() * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Lune
            ctx.beginPath();
            ctx.fillStyle = "#f5f3ce";
            ctx.arc(width - 100, 100, Math.max(28, Math.min(40, width * 0.04)), 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "rgba(245, 243, 206, 0.2)";
            ctx.arc(width - 100, 100, Math.max(40, Math.min(60, width * 0.06)), 0, Math.PI * 2);
            ctx.fill();

            // === MUSÉE === (scale to canvas)
            const museumX = Math.round(width * 0.125);
            const museumY = Math.round(height * 0.3);
            const museumW = Math.round(width * 0.75);
            const museumH = Math.round(height * 0.6);
            ctx.fillStyle = "#2d1b3d";
            ctx.fillRect(museumX, museumY, museumW, museumH);
            ctx.beginPath();
            ctx.moveTo(museumX - Math.round(width * 0.025), museumY);
            ctx.lineTo(width / 2, Math.round(height * 0.16));
            ctx.lineTo(museumX + museumW + Math.round(width * 0.025), museumY);
            ctx.closePath();
            ctx.fillStyle = "#3d2b4c";
            ctx.fill();
            ctx.fillStyle = "#1a1030";
            const doorW = Math.max(80, Math.round(width * 0.09));
            const doorH = Math.max(130, Math.round(height * 0.26));
            const doorX = Math.round(width / 2 - doorW / 2);
            const doorY = Math.round(museumY + museumH - doorH - Math.max(20, height * 0.02));
            ctx.fillRect(doorX, doorY, doorW, doorH);
            ctx.fillStyle = "#3a241d";
            ctx.fillRect(doorX + 10, doorY + 10, doorW - 20, doorH - 20);
            ctx.beginPath();
            ctx.fillStyle = "#d4af37";
            ctx.arc(doorX + Math.round(doorW * 0.5), doorY + Math.round(doorH * 0.55), Math.max(4, Math.round(doorW * 0.06)), 0, Math.PI * 2);
            ctx.fill();

            // Enseigne
            ctx.fillStyle = "#1a1030";
            const signW = Math.max(140, Math.round(width * 0.2));
            const signH = Math.max(28, Math.round(height * 0.06));
            ctx.fillRect(Math.round(width / 2 - signW / 2), museumY - signH, signW, signH);
            ctx.font = `${Math.max(16, Math.round(signH * 0.6))}px Arial`;
            ctx.fillStyle = "#d4af37";
            ctx.textAlign = "center";
            ctx.fillText("MUSÉE OUBLIÉ", Math.round(width / 2), museumY - Math.round(signH * 0.3));

            // === SOL ===
            ctx.fillStyle = "#1a1020";
            ctx.fillRect(0, height - Math.max(40, Math.round(height * 0.1)), width, Math.max(40, Math.round(height * 0.1)));

            // === PERSONNAGE === (scale with canvas)
            const baseX = (playerX / 100) * width;
            const baseY = (playerY / 100) * height;
            const t = Date.now() / 300;
            const bobbing = Math.sin(t) * Math.max(1.5, height * 0.004);
            const legSwing = Math.sin(t * 2) * Math.max(6, height * 0.016);

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
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [playerX, playerY, canvasSize]);

    const handleKeyPress = (e) => {
        const speed = 2;
        switch (e.key) {
            case "ArrowUp": setPlayerY((p) => Math.max(20, p - speed)); break;
            case "ArrowDown": setPlayerY((p) => Math.min(100, p + speed)); break;
            case "ArrowLeft": setPlayerX((p) => Math.max(10, p - speed)); break;
            case "ArrowRight": setPlayerX((p) => Math.min(100, p + speed)); break;
            case "Enter":
                if (playerX > 40 && playerX < 60 && playerY > 70) setShowNameInput(true);
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
        <div className="landing-root">
            <div className="landing-decor">
                <div className="blob-left"></div>
                <div className="blob-right"></div>
            </div>

            <h1 className="landing-title">
                <Sparkles className="icon" />
                Le Musée Oublié
            </h1>

            <p className="landing-subtitle">
                Un trésor artistique sommeille dans les ombres de Nantes... Osez percer ses mystères.
            </p>

            <div className="game-area">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className="game-canvas"
                />

                <div className="info-grid">
                    <div className="card">
                        <div className="card-header">
                            <BookOpen className="icon" />
                            <h3 className="card-title">L'Histoire</h3>
                        </div>
                        <p className="card-text">
                            Le Musée Oublié de Nantes renferme des œuvres perdues depuis des décennies.
                            Cinq énigmes protègent son secret ultime. Résolvez-les pour découvrir la vérité cachée.
                        </p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <DoorOpen className="icon" />
                            <h3 className="card-title">Contrôles</h3>
                        </div>
                        <div className="kbd-grid">
                            {["↑", "←", "→"].map((key, idx) => (
                                <kbd key={idx} className="kbd">{key}</kbd>
                            ))}
                            <div className="kbd--down">
                                <kbd className="kbd">↓</kbd>
                            </div>
                        </div>
                        <p className="card-text">
                            Appuyez sur <kbd className="kbd">Entrée</kbd> devant la porte.
                        </p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <Trophy className="icon" />
                            <h3 className="card-title">Objectif</h3>
                        </div>
                        <p className="card-text">
                            Résolvez les 5 énigmes artistiques pour découvrir la vérité cachée du musée et déverrouiller son trésor.
                        </p>
                    </div>
                </div>
            </div>

            {showNameInput && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <UserRound className="icon" />
                            <div>
                                <h2 className="modal-title">Bienvenue, Aventurier</h2>
                                <p className="modal-subtitle">Quel est votre nom ?</p>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
                            placeholder="Ex: Indiana Jones"
                            className="text-input"
                            autoFocus
                        />
                        <button onClick={handleStartGame} disabled={loading} className="primary-btn">
                            <DoorOpen className="icon" />
                            {loading ? "Création de la partie..." : "Entrer dans le Musée"}
                        </button>
                        {error && <div className="error-box">{error}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeMenu;
