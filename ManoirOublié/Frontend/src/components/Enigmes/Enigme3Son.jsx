// src/components/Enigmes/Enigme3Son.jsx
import React, { useEffect, useState } from "react";
import { getEnigme3, buildAudioProxiedUrl, validatePuzzle } from "../../services/api";
import { useSocket } from "../../services/useSocket";

export default function Enigme3Son({ onComplete }) {
    const gameId = localStorage.getItem('gameId');
    const stateAppliedRef = React.useRef(false);
    const [loading, setLoading] = useState(true);
    const [soundUrl, setSoundUrl] = useState(null);
    const [options, setOptions] = useState([]);
    const [correctKey, setCorrectKey] = useState(null);
    const [selectedGhost, setSelectedGhost] = useState(null);
    const [isPlayingGhost, setIsPlayingGhost] = useState(false);
    const audioRef = React.useRef(null);

    const { sendPuzzleState } = useSocket(gameId, {
        onPuzzleState: (data) => {
            if (!data || !data.type) return;
            if (data.type === 'enigme3:sound') {
                stateAppliedRef.current = true;
                const proxied = buildAudioProxiedUrl(data.url);
                setSoundUrl(proxied || data.url);
                setOptions(Array.isArray(data.options) ? data.options : []);
                setCorrectKey(data.correct || null);
                setSelectedGhost(null);
            } else if (data.type === 'enigme3:select' && typeof data.index === 'number') {
                setSelectedGhost(data.index);
            } else if (data.type === 'enigme3:clearSelect') {
                setSelectedGhost(null);
            } else if (data.type === 'enigme3:play') {
                // show transient playing indicator
                setIsPlayingGhost(true);
                setTimeout(() => setIsPlayingGhost(false), 1200);
            }
        }
    });

    const fetchRandomSound = async () => {
        setLoading(true);
        const data = await getEnigme3();
        const raw = (data.sounds && data.sounds[0]) || null;
        const proxied = buildAudioProxiedUrl(raw);
        setSoundUrl(proxied || raw);
        setOptions(data.options || []);
        setCorrectKey(data.correct || null);
        setLoading(false);
        // broadcast
        if (raw) {
            const seed = Date.now() & 0xffffffff;
            sendPuzzleState({ type: 'enigme3:sound', url: raw, options: data.options || [], correct: data.correct || null, seed });
        }
    };

    useEffect(() => {
        // Attendre un éventuel état reçu d'un autre joueur, sinon charger et diffuser
        const t = setTimeout(() => {
            if (!stateAppliedRef.current) {
                (async () => { await fetchRandomSound(); })();
            }
        }, 600);
        return () => clearTimeout(t);
    }, []);

    const play = () => {
        if (!soundUrl) {
            alert("Le son n'est pas encore prêt !");
            return;
        }

        // notify others someone pressed play
        try { sendPuzzleState({ type: 'enigme3:play', at: Date.now() }); } catch (_) {}
    
        if (!audioRef.current) {
            audioRef.current = new Audio(soundUrl);
        } else {
            // si l'URL a changé, recharge-la
            if (audioRef.current.src !== soundUrl) {
                audioRef.current.src = soundUrl;
            }
        }
    
        audioRef.current.play().catch((err) => {
            console.error("Erreur lecture audio :", err);
            alert("Impossible de lire le son. Vérifie l'URL ou les permissions navigateur.");
        });
    };
    

    const handleChoice = async (choice, index) => {
        if (!choice) return;
        try {
            // highlight selection for others
            try { sendPuzzleState({ type: 'enigme3:select', index }); } catch (_) {}
            const res = await validatePuzzle('son-elephant-3', String(choice));
            // Backend will emit puzzle:solved to room if ok; GameRoom reacts and returns everyone
            if (res.ok) {
                // Énigme résolue avec succès
                console.log("✅ Énigme 3 résolue !");
                setTimeout(() => {
                    if (onComplete) onComplete(350); // 350 points pour l'énigme 3
                }, 1000);
            } else {
                alert("Ce n'est pas la bonne réponse. Réessayez !");
                try { sendPuzzleState({ type: 'enigme3:clearSelect' }); } catch (_) {}
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div>Chargement des sons...</div>;
    if (!soundUrl) return <div>Aucun son disponible (vérifier la BDD).</div>;

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">🔊 Énigme 3 : Devine le Son</h3>
            <p className="text-gray-300 mb-2">Écoute le son et choisis la bonne option.</p>
            {isPlayingGhost && (
                <div className="text-xs text-blue-300 mb-3">Un joueur est en train d'écouter…</div>
            )}

            <button onClick={play} className="bg-gray-700 px-6 py-3 rounded-xl mb-6">
                ▶️ Écouter
            </button>

            <div className="mb-6">
                <button onClick={fetchRandomSound} className="bg-gray-700 px-4 py-2 rounded-lg hover:ring-2 hover:ring-amber-400">
                    🔄 Changer de son
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleChoice(opt, i)}
                        className={`rounded-lg px-4 py-3 border transition ${selectedGhost === i ? 'border-blue-400 ring-2 ring-blue-300' : 'border-gray-600 hover:ring-2 hover:ring-amber-400'}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
