// src/components/Enigmes/Enigme1Puzzle.jsx
import React, { useEffect, useState } from "react";
import { getEnigmeDoc, getDownloadUrls, buildProxiedUrl } from "../../services/api";
import { useSocket } from "../../services/useSocket";
import { validatePuzzle } from "../../services/api";

export default function Enigme1Puzzle({ onComplete }) {
    const gameId = localStorage.getItem('gameId');
    const stateAppliedRef = React.useRef(false);
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState([]);
    const [tiles, setTiles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [selectedGhost, setSelectedGhost] = useState(null);
    const [gridSize] = useState(3); // 3x3
    const [tileSize, setTileSize] = useState(120);

    const applyPositions = (positions) => {
        if (!Array.isArray(positions)) return;
        setTiles((prev) => prev.map((t, i) => ({ ...t, pos: positions[i] })));
    };

    const { sendPuzzleState } = useSocket(gameId, {
        onPuzzleState: (data) => {
            if (!data || !data.type) return;
            if (data.type === 'enigme1:image' && data.imgUrl) {
                stateAppliedRef.current = true;
                preparePuzzle(data.imgUrl, typeof data.seed === 'number' ? data.seed : undefined);
                setSelected(null);
                setSelectedGhost(null);
            } else if (data.type === 'enigme1:swap' && typeof data.a === 'number' && typeof data.b === 'number') {
                setTiles((prev) => {
                    const next = [...prev];
                    const tmp = next[data.a].pos;
                    next[data.a].pos = next[data.b].pos;
                    next[data.b].pos = tmp;
                    return next;
                });
                setSelectedGhost(null);
            } else if (data.type === 'enigme1:select' && typeof data.idx === 'number') {
                setSelectedGhost(data.idx);
            } else if (data.type === 'enigme1:clearSelect') {
                setSelectedGhost(null);
            } else if (data.type === 'enigme1:state' && Array.isArray(data.positions)) {
                applyPositions(data.positions);
                setSelected(null);
                setSelectedGhost(null);
            }
        }
    });

    const defaultNantesArtwork = "https://upload.wikimedia.org/wikipedia/commons/3/3b/Ch%C3%A2teau_des_ducs_de_Bretagne%2C_Nantes%2C_2012-08-19.jpg"; // public domain photo of Nantes castle

    useEffect(() => {
        const handleResize = () => {
            const maxTile = 140;
            const minTile = 80;
            const candidate = Math.floor(Math.min(window.innerWidth * 0.08, maxTile));
            setTileSize(Math.max(minTile, candidate));
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchRandomPuzzle = async () => {
        setLoading(true);
        const doc = await getEnigmeDoc("enigme1");
        const paths = (doc && doc.images) || [];
        let urls = [];
        if (paths.length > 0) {
            urls = await getDownloadUrls(paths.slice(0, 3));
        } else {
            urls = [defaultNantesArtwork];
        }
        setImageUrls(urls);
        if (urls.length > 0) {
            const img0 = buildProxiedUrl(urls[0]) || urls[0];
            const seed = Date.now() & 0xffffffff;
            preparePuzzle(img0, seed);
            // broadcast with seed
            sendPuzzleState({ type: 'enigme1:image', imgUrl: img0, seed });
        }
        setSelected(null);
        setLoading(false);
    };

    useEffect(() => {
        // Attendre un éventuel état reçu d'un autre joueur, sinon charger et diffuser
        const t = setTimeout(() => {
            if (!stateAppliedRef.current) {
                fetchRandomPuzzle();
            }
        }, 600);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, []);

    // Seeded RNG (mulberry32)
    const rngFromSeed = (seed) => {
        let t = seed >>> 0;
        return function() {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    };

    const preparePuzzle = (imgUrl, seed) => {
        const total = gridSize * gridSize;
        const arr = Array.from({ length: total }, (_, i) => ({
            id: i + 1,
            pos: i,
            correct: i,
            img: imgUrl,
        }));
        const rand = typeof seed === 'number' ? rngFromSeed(seed) : Math.random;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [arr[i].pos, arr[j].pos] = [arr[j].pos, arr[i].pos];
        }
        setTiles(arr);
    };

    const handleClick = (idx) => {
        if (selected === null) {
            setSelected(idx);
            try { sendPuzzleState({ type: 'enigme1:select', idx }); } catch (_) {}
        } else {
            const newTiles = [...tiles];
            const tmp = newTiles[selected].pos;
            newTiles[selected].pos = newTiles[idx].pos;
            newTiles[idx].pos = tmp;
            setTiles(newTiles);
            // broadcast swap and full state to synchronize with other players
            try { sendPuzzleState({ type: 'enigme1:swap', a: selected, b: idx }); } catch (_) {}
            try { sendPuzzleState({ type: 'enigme1:state', positions: newTiles.map(t => t.pos) }); } catch (_) {}
            setSelected(null);
            try { sendPuzzleState({ type: 'enigme1:clearSelect' }); } catch (_) {}

            if (newTiles.every((t) => t.pos === t.correct)) {
                validatePuzzle("puzzle-nantes-1", "ok")
                    .then((result) => {
                        if (result.ok) {
                            setTimeout(() => onComplete(400), 400);
                        }
                    })
                    .catch((error) => {
                        console.error("Validation failed:", error);
                    });
            }
        }
    };

    if (loading) return <div>Chargement de l'image pour le puzzle...</div>;
    if (imageUrls.length === 0)
        return <div>Aucune image disponible pour le puzzle (vérifier la BDD).</div>;

    const total = gridSize * gridSize;

    const posMap = [];
    tiles.forEach((t) => {
        posMap[t.pos] = t;
    });

    const gridPx = tileSize * gridSize;

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-2">🎨 Énigme 1 : Le Puzzle</h3>
            <p className="text-gray-300 mb-4">Reconstituez l'image native</p>

            <div className="mb-4">
                <button onClick={fetchRandomPuzzle} className="bg-gray-700 px-4 py-2 rounded-lg hover:ring-2 hover:ring-amber-400">
                    🔄 Changer d'image
                </button>
            </div>

            <div
                className="mx-auto mb-4"
                style={{
                    width: gridPx,
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridSize}, ${tileSize}px)`,
                    gap: 4,
                }}
            >
                {Array.from({ length: total }, (_, pos) => {
                    const tile = posMap[pos];
                    const imgUrl = tile?.img;
                    const index = tile?.correct ?? 0;
                    const row = Math.floor(index / gridSize);
                    const col = index % gridSize;
                    const bgPosX = -(col * tileSize);
                    const bgPosY = -(row * tileSize);

                    const currentIdx = tiles.findIndex((t) => t.pos === pos);
                    const isSelected = selected === currentIdx;
                    const isGhost = selected === null && selectedGhost === currentIdx;

                    return (
                        <div
                            key={pos}
                            onClick={() => handleClick(currentIdx)}
                            style={{
                                width: tileSize, 
                                height: tileSize,
                                backgroundImage: `url(${imgUrl})`,
                                backgroundSize: `${tileSize * gridSize}px ${tileSize * gridSize}px`,
                                backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                                backgroundRepeat: "no-repeat",
                                cursor: "pointer",
                                border: isSelected ? "3px solid #f59e0b" : (isGhost ? "3px solid #60a5fa" : "2px solid transparent"),
                                boxShadow: isSelected ? "0 0 0 3px rgba(245,158,11,0.35)" : (isGhost ? "0 0 0 3px rgba(96,165,250,0.35)" : "none"),
                                borderRadius: 8,
                                transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                                transform: isSelected ? "scale(1.04)" : "scale(1)",
                            }}
                        />
                    );
                })}
            </div>

            <p className="text-sm text-gray-400">Cliquez sur deux pièces pour les échanger</p>
        </div>
    );
}
