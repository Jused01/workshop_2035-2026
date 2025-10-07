// src/components/Enigmes/Enigme1Puzzle.jsx
import React, { useEffect, useState } from "react";
import { getEnigmeDoc, getDownloadUrls } from "../../services/api";
import { validatePuzzle } from "../../services/api";

export default function Enigme1Puzzle({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState([]);
    const [tiles, setTiles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [gridSize] = useState(3); // 3x3
    const [tileSize, setTileSize] = useState(120);

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

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const doc = await getEnigmeDoc("enigme1");
            const paths = (doc && doc.images) || [];
            let urls = [];
            if (paths.length > 0) {
                urls = await getDownloadUrls(paths.slice(0, 3));
            } else {
                urls = [defaultNantesArtwork];
            }
            if (!mounted) return;
            setImageUrls(urls);
            if (urls.length > 0) preparePuzzle(urls[0]);
            setLoading(false);
        };
        load();
        return () => (mounted = false);
        // eslint-disable-next-line
    }, []);

    const preparePuzzle = (imgUrl) => {
        const total = gridSize * gridSize;
        const arr = Array.from({ length: total }, (_, i) => ({
            id: i + 1,
            pos: i,
            correct: i,
            img: imgUrl,
        }));
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i].pos, arr[j].pos] = [arr[j].pos, arr[i].pos];
        }
        setTiles(arr);
    };

    const handleClick = (idx) => {
        if (selected === null) {
            setSelected(idx);
        } else {
            const newTiles = [...tiles];
            const tmp = newTiles[selected].pos;
            newTiles[selected].pos = newTiles[idx].pos;
            newTiles[idx].pos = tmp;
            setTiles(newTiles);
            setSelected(null);

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

                    return (
                        <div
                            key={pos}
                            onClick={() => handleClick(tiles.findIndex((t) => t.pos === pos))}
                            className={`${
                                selected === tiles.findIndex((t) => t.pos === pos)
                                    ? "ring-4 ring-amber-400 scale-105"
                                    : ""
                            } cursor-pointer rounded-md`}
                            style={{
                                width: tileSize,
                                height: tileSize,
                                backgroundImage: `url(${imgUrl})`,
                                backgroundSize: `${tileSize * gridSize}px ${tileSize * gridSize}px`,
                                backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                                backgroundRepeat: "no-repeat",
                                transition: "transform 120ms ease" 
                            }}
                        />
                    );
                })}
            </div>

            <p className="text-sm text-gray-400">Cliquez sur deux pièces pour les échanger</p>
        </div>
    );
}
