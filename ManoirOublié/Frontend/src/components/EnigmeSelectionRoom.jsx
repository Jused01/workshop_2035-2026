import React, { useState, useEffect, useRef } from "react";
import { DoorOpen, BookOpen, Lightbulb, Music, Calendar, Sparkles, Trophy } from "lucide-react";

const EnigmeSelectionRoom = ({ playerName, score, onSelectEnigme }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const canvasWidth = 1000;
    const canvasHeight = 600;

    const enigmes = [
        { id: 1, title: "Puzzle Artistique", icon: <BookOpen />, color: "border-blue-500", bgColor: "bg-blue-500/20", posX: 150, posY: 200, hitbox: { x1: 130, x2: 270, y1: 180, y2: 380 } },
        { id: 2, title: "Lumière Mystérieuse", icon: <Lightbulb />, color: "border-yellow-500", bgColor: "bg-yellow-500/20", posX: 350, posY: 200, hitbox: { x1: 330, x2: 470, y1: 180, y2: 380 } },
        { id: 3, title: "Mélodie Perdue", icon: <Music />, color: "border-purple-500", bgColor: "bg-purple-500/20", posX: 550, posY: 200, hitbox: { x1: 530, x2: 670, y1: 180, y2: 380 } },
        { id: 4, title: "Chronologie Oubliée", icon: <Calendar />, color: "border-green-500", bgColor: "bg-green-500/20", posX: 750, posY: 200, hitbox: { x1: 730, x2: 870, y1: 180, y2: 380 } },
    ];

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
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(Math.random() * canvas.width, Math.random() * (canvas.height / 2), Math.random() * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Lune
            ctx.beginPath();
            ctx.fillStyle = "#f5f3ce";
            ctx.arc(850, 100, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "rgba(245, 243, 206, 0.2)";
            ctx.arc(850, 100, 60, 0, Math.PI * 2);
            ctx.fill();

            // === MUSÉE ===
            ctx.fillStyle = "#2d1b3d";
            ctx.fillRect(100, 150, 800, 350);
            ctx.beginPath();
            ctx.moveTo(80, 150);
            ctx.lineTo(450, 80);
            ctx.lineTo(820, 150);
            ctx.closePath();
            ctx.fillStyle = "#3d2b4c";
            ctx.fill();
            ctx.fillStyle = "#1a1030";
            ctx.fillRect(400, 300, 200, 200);
            ctx.fillStyle = "#3a241d";
            ctx.fillRect(410, 310, 180, 180);
            ctx.beginPath();
            ctx.fillStyle = "#d4af37";
            ctx.arc(500, 400, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#1a1030";
            ctx.fillRect(420, 120, 160, 40);
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#d4af37";
            ctx.textAlign = "center";
            ctx.fillText("MUSÉE OUBLIÉ", 500, 150);

            // === PORTES DES ÉNIGMES ===
            enigmes.forEach((enigme) => {
                ctx.fillStyle = enigme.color.replace("border", "rgba") + "/0.3";
                ctx.fillRect(enigme.posX, enigme.posY, 120, 180);
                ctx.fillStyle = "#1a1030";
                ctx.fillRect(enigme.posX + 10, enigme.posY + 10, 100, 160);
                ctx.beginPath();
                ctx.fillStyle = "#d4af37";
                ctx.arc(enigme.posX + 60, enigme.posY + 100, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(enigme.title, enigme.posX + 60, enigme.posY + 50);
            });

            // === SOL ===
            ctx.fillStyle = "#1a1020";
            ctx.fillRect(0, 500, canvas.width, 100);

            // === PERSONNAGE ===
            const baseX = playerX * 10;
            const baseY = playerY * 6;
            const t = Date.now() / 300;
            const bobbing = Math.sin(t) * 2;
            const legSwing = Math.sin(t * 2) * 8;

            // Ombre
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(baseX - 12, baseY + 50, 24, 4);

            // Jambes
            ctx.fillStyle = "#4a5568";
            ctx.fillRect(baseX - 8, baseY + 30 + bobbing, 8, 15 - legSwing);
            ctx.fillRect(baseX + 0, baseY + 30 + bobbing, 8, 15 + legSwing);
            ctx.fillStyle = "#1a202c";
            ctx.fillRect(baseX - 8, baseY + 45 + bobbing - legSwing, 8, 5);
            ctx.fillRect(baseX + 0, baseY + 45 + bobbing + legSwing, 8, 5);

            // Corps
            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 12, baseY + 10 + bobbing, 24, 25);
            ctx.fillStyle = "#4c6ef5";
            ctx.fillRect(baseX - 12, baseY + 10 + bobbing, 4, 25);
            ctx.fillStyle = "#748ffc";
            ctx.fillRect(baseX + 8, baseY + 10 + bobbing, 4, 25);

            // Bras
            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 18, baseY + 15 + bobbing, 6, 18);
            ctx.fillRect(baseX + 12, baseY + 15 + bobbing, 6, 18);
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 18, baseY + 33 + bobbing, 6, 5);
            ctx.fillRect(baseX + 12, baseY + 33 + bobbing, 6, 5);

            // Tête
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 12, baseY - 10 + bobbing, 24, 20);
            ctx.fillStyle = "#ffcaa0";
            ctx.fillRect(baseX - 12, baseY - 10 + bobbing, 4, 20);
            ctx.fillStyle = "#ffe0cc";
            ctx.fillRect(baseX + 8, baseY - 10 + bobbing, 4, 20);
            ctx.fillStyle = "#8b5a3c";
            ctx.fillRect(baseX - 12, baseY - 15 + bobbing, 24, 5);
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 8, baseY - 5 + bobbing, 3, 4);
            ctx.fillRect(baseX + 5, baseY - 5 + bobbing, 3, 4);
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 3, baseY + 5 + bobbing, 6, 2);

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
                enigmes.forEach((enigme) => {
                    if (
                        playerX * 10 > enigme.hitbox.x1 &&
                        playerX * 10 < enigme.hitbox.x2 &&
                        playerY * 6 > enigme.hitbox.y1 &&
                        playerY * 6 < enigme.hitbox.y2
                    ) {
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
            if (
                mouseX > enigme.posX &&
                mouseX < enigme.posX + 120 &&
                mouseY > enigme.posY &&
                mouseY < enigme.posY + 180
            ) {
                onSelectEnigme(enigme.id);
            }
        });
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [playerX, playerY]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-900 text-gray-200 p-8 flex flex-col items-center justify-center relative">
            <h1 className="text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-lg z-10">
                <Sparkles className="inline-block mr-4 w-12 h-12 text-amber-400" />
                Choisissez une Énigme
            </h1>

            <div className="flex items-center gap-4 mb-8 bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border border-indigo-600/30 shadow-lg">
                <Trophy className="w-8 h-8 text-amber-400" />
                <span className="text-xl font-bold text-indigo-100">Score actuel: {score}</span>
            </div>

            <div className="relative w-full max-w-6xl mb-12 z-10">
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="border-4 border-indigo-600/50 rounded-2xl shadow-2xl bg-gray-900/50 mx-auto block cursor-crosshair"
                    onClick={handleCanvasClick}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {enigmes.map((enigme) => (
                        <div
                            key={enigme.id}
                            className={`${enigme.bgColor} backdrop-blur-md p-4 rounded-xl border-2 ${enigme.color} shadow-lg hover:shadow-${enigme.color.replace("border-", "")}/30 transition-all`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                {React.cloneElement(enigme.icon, { className: "w-6 h-6" })}
                                <h3 className="text-lg font-bold text-white">{enigme.title}</h3>
                            </div>
                            <p className="text-indigo-200 text-sm">
                                {enigme.id === 1 && "Reconstituez une œuvre d'art fragmentée."}
                                {enigme.id === 2 && "Trouvez le bon motif de lumière pour avancer."}
                                {enigme.id === 3 && "Reconnaissez le son mystérieux du musée."}
                                {enigme.id === 4 && "Remettez les événements dans l'ordre chronologique."}
                                {enigme.id === 5 && "Poeme"}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EnigmeSelectionRoom;
