import React, { useState, useEffect, useRef } from "react";
import { DoorOpen, BookOpen, Lightbulb, Music, Calendar, Sparkles } from "lucide-react";

const EnigmeSelectionRoom = ({ playerName, onSelectEnigme }) => {
    const [playerX, setPlayerX] = useState(50);
    const [playerY, setPlayerY] = useState(80);
    const [selectedEnigme, setSelectedEnigme] = useState(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    // Dimensions du canvas
    const canvasWidth = 1000;
    const canvasHeight = 600;

    // Liste des énigmes disponibles
    const enigmes = [
        { id: 1, title: "Puzzle Artistique", icon: <BookOpen />, color: "bg-blue-500", posX: 150, posY: 200 },
        { id: 2, title: "Lumière Mystérieuse", icon: <Lightbulb />, color: "bg-yellow-500", posX: 350, posY: 200 },
        { id: 3, title: "Mélodie Perdue", icon: <Music />, color: "bg-purple-500", posX: 550, posY: 200 },
        { id: 4, title: "Chronologie Oubliée", icon: <Calendar />, color: "bg-green-500", posX: 750, posY: 200 },
    ];

    // Animation du personnage et du musée
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const drawScene = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // === ARRIÈRE-PLAN (CIEL ÉTOILÉ) ===
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, "#050a28");
            skyGradient.addColorStop(1, "#1a1030");
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Étoiles
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.7})`;
                ctx.beginPath();
                ctx.arc(
                    Math.random() * canvas.width,
                    Math.random() * (canvas.height / 2),
                    Math.random() * 1.2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            // Lune avec halo
            ctx.beginPath();
            ctx.fillStyle = "#f5f3ce";
            ctx.arc(850, 100, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = "rgba(245, 243, 206, 0.2)";
            ctx.arc(850, 100, 60, 0, Math.PI * 2);
            ctx.fill();

            // === MUSÉE (BÂTIMENT CENTRAL) ===
            ctx.fillStyle = "#2d1b3d";
            ctx.fillRect(100, 150, 800, 350);
            // Toit
            ctx.beginPath();
            ctx.moveTo(80, 150);
            ctx.lineTo(450, 80);
            ctx.lineTo(820, 150);
            ctx.closePath();
            ctx.fillStyle = "#3d2b4c";
            ctx.fill();
            // Porte principale (agrandie)
            ctx.fillStyle = "#5c3a21";
            ctx.fillRect(400, 300, 200, 200);
            ctx.fillStyle = "#3a241d";
            ctx.fillRect(410, 310, 180, 180);
            // Poignée de porte dorée
            ctx.beginPath();
            ctx.fillStyle = "#d4af37";
            ctx.arc(500, 400, 8, 0, Math.PI * 2);
            ctx.fill();
            // Panneau "Musée Oublié"
            ctx.fillStyle = "#1a1030";
            ctx.fillRect(420, 120, 160, 40);
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#d4af37";
            ctx.textAlign = "center";
            ctx.fillText("MUSÉE OUBLIÉ", 500, 150);

            // === SOL ===
            ctx.fillStyle = "#1a1020";
            ctx.fillRect(0, 500, canvas.width, 100);

            // === PORTES DES ÉNIGMES (4 portes colorées) ===
            enigmes.forEach((enigme) => {
                // Porte
                ctx.fillStyle = enigme.color;
                ctx.fillRect(enigme.posX, enigme.posY, 120, 180);
                ctx.fillStyle = "#1a1030";
                ctx.fillRect(enigme.posX + 10, enigme.posY + 10, 100, 160);
                // Poignée
                ctx.beginPath();
                ctx.fillStyle = "#d4af37";
                ctx.arc(enigme.posX + 60, enigme.posY + 100, 6, 0, Math.PI * 2);
                ctx.fill();
                // Icône de l'énigme
                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(enigme.title, enigme.posX + 60, enigme.posY + 50);
            });

            // === PERSONNAGE CHIBI (AGRANDI) ===
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
            // Chaussures
            ctx.fillStyle = "#1a202c";
            ctx.fillRect(baseX - 8, baseY + 45 + bobbing - legSwing, 8, 5);
            ctx.fillRect(baseX + 0, baseY + 45 + bobbing + legSwing, 8, 5);

            // Corps
            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 12, baseY + 10 + bobbing, 24, 25);
            // Ombres pour effet 3D
            ctx.fillStyle = "#4c6ef5";
            ctx.fillRect(baseX - 12, baseY + 10 + bobbing, 4, 25);
            ctx.fillStyle = "#748ffc";
            ctx.fillRect(baseX + 8, baseY + 10 + bobbing, 4, 25);

            // Bras
            ctx.fillStyle = "#5c7cfa";
            ctx.fillRect(baseX - 18, baseY + 15 + bobbing, 6, 18);
            ctx.fillRect(baseX + 12, baseY + 15 + bobbing, 6, 18);
            // Mains
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 18, baseY + 33 + bobbing, 6, 5);
            ctx.fillRect(baseX + 12, baseY + 33 + bobbing, 6, 5);

            // Tête
            ctx.fillStyle = "#ffd4b8";
            ctx.fillRect(baseX - 12, baseY - 10 + bobbing, 24, 20);
            // Ombres tête
            ctx.fillStyle = "#ffcaa0";
            ctx.fillRect(baseX - 12, baseY - 10 + bobbing, 4, 20);
            ctx.fillStyle = "#ffe0cc";
            ctx.fillRect(baseX + 8, baseY - 10 + bobbing, 4, 20);
            // Cheveux
            ctx.fillStyle = "#8b5a3c";
            ctx.fillRect(baseX - 12, baseY - 15 + bobbing, 24, 5);
            // Visage
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 8, baseY - 5 + bobbing, 3, 4);
            ctx.fillRect(baseX + 5, baseY - 5 + bobbing, 3, 4);
            // Bouche (sourire)
            ctx.fillStyle = "#000";
            ctx.fillRect(baseX - 3, baseY + 5 + bobbing, 6, 2);

            // Accessoire: écharpe
            ctx.fillStyle = "#e64980";
            ctx.fillRect(baseX - 12, baseY + 12 + bobbing, 24, 4);

            rafRef.current = requestAnimationFrame(drawScene);
        };

        rafRef.current = requestAnimationFrame(drawScene);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [playerX, playerY]);

    // Gestion des déplacements
    const handleKeyPress = (e) => {
        const speed = 2;
        switch (e.key) {
            case "ArrowUp":
                setPlayerY((p) => Math.max(20, p - speed));
                break;
            case "ArrowDown":
                setPlayerY((p) => Math.min(100, p + speed));
                break;
            case "ArrowLeft":
                setPlayerX((p) => Math.max(10, p - speed));
                break;
            case "ArrowRight":
                setPlayerX((p) => Math.min(100, p + speed));
                break;
            case "Enter":
                // Vérifier si le joueur est devant une porte d'énigme
                enigmes.forEach((enigme) => {
                    if (
                        playerX * 10 > enigme.posX - 50 &&
                        playerX * 10 < enigme.posX + 70 &&
                        playerY * 6 > enigme.posY - 50 &&
                        playerY * 6 < enigme.posY + 100
                    ) {
                        setSelectedEnigme(enigme.id);
                    }
                });
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [playerX, playerY]);

    // Gestion du choix de l'énigme
    useEffect(() => {
        if (selectedEnigme) {
            onSelectEnigme(selectedEnigme);
        }
    }, [selectedEnigme, onSelectEnigme]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-gray-900 text-gray-200 p-8 flex flex-col items-center justify-center relative">
            {/* Titre */}
            <h1 className="text-5xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-lg z-10">
                <Sparkles className="inline-block mr-4 w-12 h-12 text-amber-400" />
                Choisissez une Énigme
            </h1>

            {/* Instructions */}
            <p className="text-xl mb-8 text-center text-indigo-200 max-w-3xl z-10">
                Utilisez les flèches pour vous déplacer et appuyez sur <kbd className="bg-amber-500 text-black px-2 py-1 rounded font-bold">Entrée</kbd>
                devant une porte pour sélectionner une énigme.
            </p>

            {/* Zone de jeu (canvas + légendes) */}
            <div className="relative w-full max-w-6xl mb-12 z-10">
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="border-4 border-indigo-600/50 rounded-2xl shadow-2xl bg-gray-900/50 mx-auto block"
                />

                {/* Légende des énigmes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {enigmes.map((enigme) => (
                        <div
                            key={enigme.id}
                            className={`bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border-2 ${enigme.color} shadow-lg`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                {React.cloneElement(enigme.icon, { className: "w-6 h-6 text-white" })}
                                <h3 className="text-lg font-bold text-white">{enigme.title}</h3>
                            </div>
                            <p className="text-indigo-200 text-sm">
                                {enigme.id === 1 && "Reconstituez une œuvre d'art fragmentée."}
                                {enigme.id === 2 && "Trouvez le bon motif de lumière pour avancer."}
                                {enigme.id === 3 && "Reconnaissez le son mystérieux du musée."}
                                {enigme.id === 4 && "Remettez les événements dans l'ordre chronologique."}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EnigmeSelectionRoom;
