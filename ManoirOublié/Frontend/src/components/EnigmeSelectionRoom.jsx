import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Lightbulb, Music, Calendar, Sparkles, Trophy, UserRound } from "lucide-react";

const EnigmeSelectionRoom = ({ playerName, players = [], score = 0, onSelectEnigme }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const canvasWidth = 1200;
    const canvasHeight = 700;

    // 5 énigmes avec positions et hitbox
    const enigmes = [
        { id: 1, title: "Puzzle Artistique", icon: <BookOpen />, color: "#3b82f6", posX: 150, posY: 250, hitbox: { x1: 150, x2: 270, y1: 250, y2: 430 } },
        { id: 2, title: "Lumière Mystérieuse", icon: <Lightbulb />, color: "#facc15", posX: 350, posY: 250, hitbox: { x1: 350, x2: 470, y1: 250, y2: 430 } },
        { id: 3, title: "Mélodie Perdue", icon: <Music />, color: "#a78bfa", posX: 550, posY: 250, hitbox: { x1: 550, x2: 670, y1: 250, y2: 430 } },
        { id: 4, title: "Chronologie Oubliée", icon: <Calendar />, color: "#22c55e", posX: 750, posY: 250, hitbox: { x1: 750, x2: 870, y1: 250, y2: 430 } },
        { id: 5, title: "Énigme d'un Autre Temps", icon: <Sparkles />, color: "#ec4899", posX: 950, posY: 250, hitbox: { x1: 950, x2: 1070, y1: 250, y2: 430 } },
    ];

    // Joueurs multijoueur simulés
    const playerPositions = [
        { x: 30, y: 70, color: "#5c7cfa" },
        { x: 70, y: 70, color: "#e64980" },
        { x: 30, y: 30, color: "#ffd4b8" },
        { x: 70, y: 30, color: "#6c8cd5" },
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const drawScene = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // === Arrière-plan ciel étoilé ===
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, "#050a28");
            skyGradient.addColorStop(1, "#1a1030");
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Étoiles
            for (let i = 0; i < 300; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(Math.random() * canvas.width, Math.random() * (canvas.height / 2), Math.random() * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Lune
            ctx.beginPath();
            ctx.fillStyle = "#f5f3ce";
            ctx.arc(1000, 100, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "rgba(245, 243, 206, 0.2)";
            ctx.arc(1000, 100, 70, 0, Math.PI * 2);
            ctx.fill();

            // === Musée ===
            ctx.fillStyle = "#2d1b3d";
            ctx.fillRect(50, 150, 1100, 400);
            // Toit
            ctx.beginPath();
            ctx.moveTo(30, 150);
            ctx.lineTo(550, 80);
            ctx.lineTo(1170, 150);
            ctx.closePath();
            ctx.fillStyle = "#3d2b4c";
            ctx.fill();
            // Porte principale
            ctx.fillStyle = "#5c3a21";
            ctx.fillRect(500, 350, 200, 200);
            ctx.fillStyle = "#3a241d";
            ctx.fillRect(510, 360, 180, 180);
            ctx.beginPath();
            ctx.fillStyle = "#d4af37";
            ctx.arc(600, 450, 8, 0, Math.PI * 2);
            ctx.fill();
            // Panneau Musée
            ctx.fillStyle = "#1a1030";
            ctx.fillRect(520, 120, 160, 40);
            ctx.font = "bold 24px Arial";
            ctx.fillStyle = "#d4af37";
            ctx.textAlign = "center";
            ctx.fillText("MUSÉE OUBLIÉ", 600, 150);

            // Sol
            ctx.fillStyle = "#1a1020";
            ctx.fillRect(0, 550, canvas.width, 150);

            // === Portes des énigmes ===
            enigmes.forEach((enigme) => {
                ctx.fillStyle = enigme.color + "33";
                ctx.fillRect(enigme.posX, enigme.posY, 120, 180);
                ctx.fillStyle = "#1a1030";
                ctx.fillRect(enigme.posX + 10, enigme.posY + 10, 100, 160);
                ctx.beginPath();
                ctx.fillStyle = "#d4af37";
                ctx.arc(enigme.posX + 60, enigme.posY + 100, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.font = "bold 16px Arial";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(enigme.title, enigme.posX + 60, enigme.posY + 50);
            });

            // === Joueur principal ===
            const baseX = playerX * 12;
            const baseY = playerY * 7;
            const t = Date.now() / 300;
            const bobbing = Math.sin(t) * 2;
            const legSwing = Math.sin(t * 2) * 8;
            drawPlayer(ctx, baseX, baseY, bobbing, legSwing, "#5c7cfa", playerName);

            // Autres joueurs
            players.forEach((player, index) => {
                if (player.name !== playerName) {
                    const pos = playerPositions[index % playerPositions.length];
                    drawPlayer(ctx, pos.x * 12, pos.y * 7, Math.sin(t) * 2, Math.sin(t * 2) * 8, pos.color, player.name);
                }
            });

            rafRef.current = requestAnimationFrame(drawScene);
        };

        const drawPlayer = (ctx, baseX, baseY, bobbing, legSwing, color, name) => {
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(baseX - 12, baseY + 50, 24, 4);
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(baseX - 8, baseY + 30 + bobbing, 8, 15 - legSwing);
            ctx.fillRect(baseX, baseY + 30 + bobbing, 8, 15 + legSwing);
            ctx.fillStyle = color;
            ctx.fillRect(baseX - 12, baseY + 10 + bobbing, 24, 25);
            ctx.fillStyle = color;
            ctx.fillRect(baseX - 18, baseY + 15 + bobbing, 6, 18);
            ctx.fillRect(baseX + 12, baseY + 15 + bobbing, 6, 18);
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 12, baseY - 15 + bobbing, 24, 20);
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 8, baseY - 10 + bobbing, 3, 4);
            ctx.fillRect(baseX + 5, baseY - 10 + bobbing, 3, 4);
            ctx.fillRect(baseX - 3, baseY + 5 + bobbing, 6, 2);
            ctx.font = "bold 12px Arial";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.fillText(name, baseX, baseY - 25 + bobbing);
        };

        drawScene();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playerX, playerY, players]);

    const handleKeyPress = (e) => {
        const speed = 2;
        switch (e.key) {
            case "ArrowUp": setPlayerY((p) => Math.max(20, p - speed)); break;
            case "ArrowDown": setPlayerY((p) => Math.min(100, p + speed)); break;
            case "ArrowLeft": setPlayerX((p) => Math.max(10, p - speed)); break;
            case "ArrowRight": setPlayerX((p) => Math.min(100, p + speed)); break;
            case "Enter":
                enigmes.forEach((enigme) => {
                    const px = playerX * 12;
                    const py = playerY * 7;
                    if (px > enigme.hitbox.x1 && px < enigme.hitbox.x2 && py > enigme.hitbox.y1 && py < enigme.hitbox.y2) {
                        onSelectEnigme(enigme.id);
                    }
                });
                break;
            default: break;
        }
    };

    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        enigmes.forEach((enigme) => {
            if (mouseX > enigme.hitbox.x1 && mouseX < enigme.hitbox.x2 && mouseY > enigme.hitbox.y1 && mouseY < enigme.hitbox.y2) {
                onSelectEnigme(enigme.id);
            }
        });
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [playerX, playerY, players]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-900 text-gray-200 p-8 flex flex-col items-center justify-center relative">
            <h1 className="text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-lg z-10">
                <Sparkles className="inline-block mr-4 w-12 h-12 text-amber-400" />
                Choisissez une Énigme
            </h1>

            <div className="flex justify-between w-full max-w-6xl mb-4">
                <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border border-indigo-600/30 shadow-lg flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-amber-400" />
                    <span className="text-xl font-bold text-indigo-100">Score: {score}</span>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border border-indigo-600/30 shadow-lg flex items-center gap-3">
                    <UserRound className="w-8 h-8 text-indigo-400" />
                    <span className="text-xl font-bold text-indigo-100">Joueurs: {players.length}/4</span>
                </div>
            </div>

            <div className="relative w-full max-w-6xl mb-12 z-10">
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="border-4 border-indigo-600/50 rounded-2xl shadow-2xl bg-gray-900/50 mx-auto block cursor-crosshair"
                    onClick={handleCanvasClick}
                />
            </div>
        </div>
    );
};

export default EnigmeSelectionRoom;
