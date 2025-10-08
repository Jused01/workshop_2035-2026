// src/components/Enigmes/Enigme3Son.jsx
import React, { useEffect, useState } from "react";
import { getEnigme3, buildAudioProxiedUrl } from "../../services/api";

export default function Enigme3Son({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [soundUrl, setSoundUrl] = useState(null);
    const [options, setOptions] = useState([]);
    const [correctKey, setCorrectKey] = useState(null);
    const audioRef = React.useRef(null);

    useEffect(() => {
        (async () => {
            const data = await getEnigme3();
            const raw = (data.sounds && data.sounds[0]) || null;
            const proxied = buildAudioProxiedUrl(raw);
            setSoundUrl(proxied || raw);
            setOptions(data.options || []);
            setCorrectKey(data.correct || null);
            setLoading(false);
        })();
    }, []);

    const play = () => {
        if (!soundUrl) {
            alert("Le son n'est pas encore prêt !");
            return;
        }
    
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
    

    const handleChoice = (choice) => {
        if (!choice) return;
        if (choice.toLowerCase() === (correctKey || "").toLowerCase()) {
            onComplete(300);
        } else {
            alert("Ce n'est pas la bonne réponse. Réessayez !");
        }
    };

    if (loading) return <div>Chargement des sons...</div>;
    if (!soundUrl) return <div>Aucun son disponible (vérifier la BDD).</div>;

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">🔊 Énigme 3 : Devine le Son</h3>
            <p className="text-gray-300 mb-6">Écoute le son et choisis la bonne option.</p>

            <button onClick={play} className="bg-gray-700 px-6 py-3 rounded-xl mb-6">
                ▶️ Écouter
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleChoice(opt)}
                        className="bg-gray-700 rounded-lg px-4 py-3 hover:ring-2 hover:ring-amber-400"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}
