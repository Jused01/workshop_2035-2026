// src/components/Enigmes/Enigme1Puzzle.jsx
import React, { useEffect, useState } from "react";
import { getEnigmeDoc, getDownloadUrls } from "../../services/firebase";

/**
 * Comportement :
 * - Récupère dans Firestore le doc "enigme1", qui doit contenir
 *   { images: ["enigmes/enigme1/img1.jpg","..."], mode: "choose-three" }
 * - Télécharge 3 URLs depuis Storage (getDownloadUrls).
 * - Pour chaque image, on la découpe en tiles 3x3 (par ex) et on mélange.
 * - L'utilisateur clique sur deux tiles pour échanger. Quand l'image est reconstituée -> onComplete(points)
 *
 * Simplification : on prend la première image pour le puzzle, ou on propose switch entre 3 images.
 */
export default function Enigme1Puzzle({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState([]);
    const [tiles, setTiles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [gridSize] = useState(3); // 3x3

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const doc = await getEnigmeDoc("enigme1");
            if (!doc) {
                console.error("enigme1 absent en BDD");
                setLoading(false);
                return;
            }
            const paths = doc.images || [];
            // prends au moins 1 image (ou 3 si souhaité)
            const urls = await getDownloadUrls(paths.slice(0, 3));
            if (!mounted) return;
            setImageUrls(urls);
            if (urls.length > 0) preparePuzzle(urls[0]); // on prend la première image pour le puzzle
            setLoading(false);
        };
        load();
        return () => (mounted = false);
        // eslint-disable-next-line
    }, []);

    const preparePuzzle = (imgUrl) => {
        // on va créer tiles virtuelles plutôt que découper physiquement les images
        // tiles: [{id, index, correctIndex, img: url, sx, sy, sw, sh}]
        const total = gridSize * gridSize;
        const arr = Array.from({ length: total }, (_, i) => ({
            id: i + 1,
            pos: i, // position actuelle
            correct: i,
            img: imgUrl,
        }));
        // shuffle positions
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
            // swap pos of tile at selected and tile at idx
            const tmp = newTiles[selected].pos;
            newTiles[selected].pos = newTiles[idx].pos;
            newTiles[idx].pos = tmp;
            setTiles(newTiles);
            setSelected(null);

            if (newTiles.every((t) => t.pos === t.correct)) {
                setTimeout(() => onComplete(400), 500);
            }
        }
    };

    if (loading) return <div>Chargement de l'image pour le puzzle...</div>;
    if (imageUrls.length === 0)
        return <div>Aucune image disponible pour le puzzle (vérifier la BDD).</div>;

    // rendering: grid of tiles; each tile is a cropped background image with CSS
    const total = gridSize * gridSize;
    const tileSize = 120; // px

    // create a mapping pos -> tile
    const posMap = [];
    tiles.forEach((t) => {
        posMap[t.pos] = t;
    });

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">🎨 Énigme 1 : Le Puzzle</h3>
            <p className="text-gray-300 mb-6">Reconstituez l'image native</p>

            <div
                className="mx-auto mb-6"
                style={{
                    width: tileSize * gridSize,
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridSize}, ${tileSize}px)`,
                    gap: 4,
                }}
            >
                {Array.from({ length: total }, (_, pos) => {
                    const tile = posMap[pos];
                    const imgUrl = tile?.img;
                    const index = tile?.correct ?? 0;
                    // calculate background-position
                    const row = Math.floor(index / gridSize);
                    const col = index % gridSize;
                    const bgPosX = -(col * tileSize);
                    const bgPosY = -(row * tileSize);

                    return (
                        <div
                            key={pos}
                            onClick={() => handleClick(tiles.findIndex((t) => t.pos === pos))}
                            className={`aspect-square cursor-pointer rounded-md shadow-md border ${
                                selected === tiles.findIndex((t) => t.pos === pos)
                                    ? "ring-4 ring-amber-400 scale-105"
                                    : ""
                            }`}
                            style={{
                                width: tileSize,
                                height: tileSize,
                                backgroundImage: `url(${imgUrl})`,
                                backgroundSize: `${tileSize * gridSize}px ${tileSize * gridSize}px`,
                                backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                                backgroundRepeat: "no-repeat",
                            }}
                        />
                    );
                })}
            </div>

            <p className="text-sm text-gray-400">Cliquez sur deux pièces pour les échanger</p>
        </div>
    );
}
