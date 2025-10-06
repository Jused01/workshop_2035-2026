// src/components/Enigmes/Enigme5Poeme.jsx
import React, { useEffect, useState } from "react";
import { getEnigmeDoc } from "../../services/firebase";

export default function Enigme5Poem({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [poem, setPoem] = useState("");
    const [answer, setAnswer] = useState("");
    const [accepted, setAccepted] = useState(null);

    useEffect(() => {
        (async () => {
            const doc = await getEnigmeDoc("enigme5");
            if (!doc) {
                setPoem("Poème introuvable (BDD manquante).");
                setLoading(false);
                return;
            }
            setPoem(doc.text || "");
            setLoading(false);
        })();
    }, []);

    const handleValidate = () => {
        // on suppose que la bonne réponse est dans doc.correct (ou stockée en minuscule)
        (async () => {
            const doc = await getEnigmeDoc("enigme5");
            const correct = (doc?.answer || "").toString().trim().toLowerCase();
            if (answer.toString().trim().toLowerCase() === correct) {
                setAccepted(true);
                onComplete(500);
            } else {
                setAccepted(false);
                alert("Ce n'est pas la bonne clé poétique.");
            }
        })();
    };

    if (loading) return <div>Chargement de l'énigme poétique...</div>;

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">✒️ Énigme 5 : Poème</h3>
            <div className="max-w-2xl mx-auto bg-gray-800/60 p-6 rounded mb-4 text-left text-gray-200">
                <pre className="whitespace-pre-wrap">{poem}</pre>
            </div>

            <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Tapez votre clé/réponse..."
                className="w-full max-w-lg mx-auto bg-gray-700 rounded px-4 py-3 mb-4 text-gray-200"
            />
            <div>
                <button onClick={handleValidate} className="bg-amber-700 px-6 py-3 rounded-lg">Valider</button>
            </div>
            {accepted === false && <p className="text-red-400 mt-3">Réponse incorrecte</p>}
        </div>
    );
}
