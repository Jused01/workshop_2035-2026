import React, { useState, useEffect, useRef } from "react";
import { Trophy, DoorOpen, UserRound, BookOpen, Sparkles, Users, Hash } from "lucide-react";

const HomeMenu = ({ onEnterManor, onJoinGame, loading, error }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const [playerName, setPlayerName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [showNameInput, setShowNameInput] = useState(false);
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [joinMode, setJoinMode] = useState("create"); // "create", "code", "random"
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prevOverflow; };
    }, []);

    useEffect(() => {
        const computeSize = () => {
            const containerMaxWidth = Math.min(1100, window.innerWidth - 24);
            const targetAspect = 16 / 9;
            let width = containerMaxWidth;
            let height = Math.round(width / targetAspect);
            const reserved = 280;
            const maxHeight = Math.max(220, window.innerHeight - reserved);
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
            const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
            skyGradient.addColorStop(0, "#050a28");
            skyGradient.addColorStop(1, "#1a1030");
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < 110; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * (height / 2), Math.random() * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.beginPath();
            ctx.fillStyle = "#f5f3ce";
            ctx.arc(width - 90, 90, Math.max(22, Math.min(36, width * 0.035)), 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "rgba(245, 243, 206, 0.2)";
            ctx.arc(width - 90, 90, Math.max(34, Math.min(54, width * 0.055)), 0, Math.PI * 2);
            ctx.fill();

            const museumX = Math.round(width * 0.1);
            const museumY = Math.round(height * 0.26);
            const museumW = Math.round(width * 0.8);
            const museumH = Math.round(height * 0.62);
            ctx.fillStyle = "#2d1b3d";
            ctx.fillRect(museumX, museumY, museumW, museumH);
            ctx.beginPath();
            ctx.moveTo(museumX - Math.round(width * 0.02), museumY);
            ctx.lineTo(width / 2, Math.round(height * 0.15));
            ctx.lineTo(museumX + museumW + Math.round(width * 0.02), museumY);
            ctx.closePath();
            ctx.fillStyle = "#3d2b4c";
            ctx.fill();
            ctx.fillStyle = "#1a1030";
            const doorW = Math.max(68, Math.round(width * 0.08));
            const doorH = Math.max(110, Math.round(height * 0.25));
            const doorX = Math.round(width / 2 - doorW / 2);
            const doorY = Math.round(museumY + museumH - doorH - Math.max(14, height * 0.016));
            ctx.fillRect(doorX, doorY, doorW, doorH);
            ctx.fillStyle = "#3a241d";
            ctx.fillRect(doorX + 8, doorY + 8, doorW - 16, doorH - 16);
            ctx.beginPath();
            ctx.fillStyle = "#d4af37";
            ctx.arc(doorX + Math.round(doorW * 0.5), doorY + Math.round(doorH * 0.55), Math.max(4, Math.round(doorW * 0.06)), 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#1a1030";
            const signW = Math.max(120, Math.round(width * 0.18));
            const signH = Math.max(22, Math.round(height * 0.05));
            ctx.fillRect(Math.round(width / 2 - signW / 2), museumY - signH, signW, signH);
            ctx.font = `${Math.max(13, Math.round(signH * 0.6))}px Arial`;
            ctx.fillStyle = "#d4af37";
            ctx.textAlign = "center";
            ctx.fillText("MUSÉE OUBLIÉ", Math.round(width / 2), museumY - Math.round(signH * 0.3));

            ctx.fillStyle = "#1a1020";
            ctx.fillRect(0, height - Math.max(28, Math.round(height * 0.08)), width, Math.max(28, Math.round(height * 0.08)));

            const baseX = (playerX / 100) * width;
            const baseY = (playerY / 100) * height;
            const t = Date.now() / 300;
            const bobbing = Math.sin(t) * Math.max(1, height * 0.003);
            const legSwing = Math.sin(t * 2) * Math.max(4, height * 0.012);

            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(baseX - 12, baseY + 45, 24, 4);

            ctx.fillStyle = "#4a5568";
            ctx.fillRect(baseX - 8, baseY + 25 + bobbing, 8, 15 - legSwing);
            ctx.fillRect(baseX + 0, baseY + 25 + bobbing, 8, 15 + legSwing);
            ctx.fillStyle = "#1a202c";
            ctx.fillRect(baseX - 8, baseY + 40 + bobbing - legSwing, 8, 5);
            ctx.fillRect(baseX + 0, baseY + 40 + bobbing + legSwing, 8, 5);

            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 12, baseY - 5 + bobbing, 24, 25);
            ctx.fillStyle = "#4c6ef5";
            ctx.fillRect(baseX - 12, baseY - 5 + bobbing, 4, 25);
            ctx.fillStyle = "#748ffc";
            ctx.fillRect(baseX + 8, baseY - 5 + bobbing, 4, 25);

            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 18, baseY + 5 + bobbing, 6, 18);
            ctx.fillRect(baseX + 12, baseY + 5 + bobbing, 6, 18);
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 18, baseY + 23 + bobbing, 6, 5);
            ctx.fillRect(baseX + 12, baseY + 23 + bobbing, 6, 5);

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
        const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
        if (keys.includes(e.key)) {
            e.preventDefault();
        }
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
        window.addEventListener("keydown", handleKeyPress, { passive: false });
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [playerX, playerY]);

    const handleStartGame = () => {
        if (!playerName.trim()) return;

        if (joinMode === "create") {
            onEnterManor(playerName.trim());
        } else if (joinMode === "code") {
            if (!joinCode.trim()) {
                alert("Veuillez entrer un code de partie");
                return;
            }
            onJoinGame(joinCode.trim().toUpperCase(), playerName.trim());
        } else if (joinMode === "random") {
            // Appel API pour rejoindre partie aléatoire
            onJoinGame("RANDOM", playerName.trim());
        }
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
                            Cinq énigmes protègent son secret ultime.
                        </p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <DoorOpen className="icon" />
                            <h3 className="card-title">Contrôles</h3>
                        </div>
                        <div className="kbd-grid">
                            {["↑", "←", "→"].map((key, idx) => (<kbd key={idx} className="kbd">{key}</kbd>))}
                            <div className="kbd--down"><kbd className="kbd">↓</kbd></div>
                        </div>
                        <p className="card-text">Appuyez sur <kbd className="kbd">Entrée</kbd> devant la porte.</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <Trophy className="icon" />
                            <h3 className="card-title">Objectif</h3>
                        </div>
                        <p className="card-text">
                            Résolvez les 5 énigmes pour découvrir la vérité cachée du musée.
                        </p>
                    </div>
                </div>
            </div>

            {/* Visible control panel so users can start without using keyboard */}
            <div className="panel" style={{ width: '100%', maxWidth: 860, marginTop: 18 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Votre nom"
                        className="text-input"
                        style={{ flex: '1 1 240px', minWidth: 220 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
                    />

                    <div style={{ flex: '0 0 320px' }}>
                        <div className="modes">
                            <button onClick={() => setJoinMode("create")} className={`mode-btn ${joinMode === "create" ? "active" : ""}`}>
                                <DoorOpen size={18} />
                                <span style={{ fontSize: '13px' }}>Créer</span>
                            </button>
                            <button onClick={() => setJoinMode("code")} className={`mode-btn ${joinMode === "code" ? "active" : ""}`}>
                                <Hash size={18} />
                                <span style={{ fontSize: '13px' }}>Code</span>
                            </button>
                            <button onClick={() => setJoinMode("random")} className={`mode-btn ${joinMode === "random" ? "active" : ""}`}>
                                <Users size={18} />
                                <span style={{ fontSize: '13px' }}>Aléatoire</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: '0 0 220px' }}>
                        {joinMode === 'code' ? (
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Code (ex: ABC123)"
                                className="text-input"
                                maxLength={6}
                                style={{ textTransform: 'uppercase' }}
                            />
                        ) : null}
                    </div>

                    <div style={{ flex: '0 0 180px' }}>
                        <button onClick={handleStartGame} disabled={loading} className="primary-btn btn-accent">
                            {loading ? 'Connexion...' : (joinMode === 'create' ? 'Créer une partie' : joinMode === 'code' ? 'Rejoindre' : 'Partie aléatoire')}
                        </button>
                    </div>
                </div>

                {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
            </div>

            {showNameInput && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <UserRound className="icon" />
                            <div>
                                <h2 className="modal-title">Bienvenue, Aventurier</h2>
                                <p className="modal-subtitle">Comment souhaitez-vous jouer ?</p>
                            </div>
                        </div>

                        {/* Mode de jeu */}
                        <div style={{ marginBottom: '16px' }}>
                            <div className="modes">
                                <button onClick={() => setJoinMode("create")} className={`mode-btn ${joinMode === "create" ? "active" : ""}`}>
                                    <DoorOpen size={20} />
                                    <span style={{ fontSize: '13px' }}>Créer</span>
                                </button>

                                <button onClick={() => setJoinMode("code")} className={`mode-btn ${joinMode === "code" ? "active" : ""}`}>
                                    <Hash size={20} />
                                    <span style={{ fontSize: '13px' }}>Code</span>
                                </button>

                                <button onClick={() => setJoinMode("random")} className={`mode-btn ${joinMode === "random" ? "active" : ""}`}>
                                    <Users size={20} />
                                    <span style={{ fontSize: '13px' }}>Aléatoire</span>
                                </button>
                            </div>
                        </div>

                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
                            placeholder="Votre nom"
                            className="text-input"
                            autoFocus
                        />

                        {joinMode === "code" && (
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
                                placeholder="Code de la partie (ex: ABC123)"
                                className="text-input"
                                maxLength={6}
                                style={{ textTransform: 'uppercase' }}
                            />
                        )}

                        <button onClick={handleStartGame} disabled={loading} className="primary-btn btn-accent">
                            {joinMode === "create" && <DoorOpen className="icon" />}
                            {joinMode === "code" && <Hash className="icon" />}
                            {joinMode === "random" && <Users className="icon" />}
                            {loading ? "Connexion..." :
                                joinMode === "create" ? "Créer une partie" :
                                    joinMode === "code" ? "Rejoindre avec le code" :
                                        "Rejoindre une partie"}
                        </button>

                        {error && <div className="error-box">{error}</div>}

                        <button
                            onClick={() => {
                                setShowNameInput(false);
                                setPlayerName("");
                                setJoinCode("");
                            }}
                            style={{
                                marginTop: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeMenu;