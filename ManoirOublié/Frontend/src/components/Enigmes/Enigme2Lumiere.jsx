// src/components/Enigmes/Enigme2Lumiere.jsx
import React, { useEffect, useState } from "react";
import { getEnigmeDoc } from "../../services/firebase";

/**
 * Fonctionnement :
 * - Charge doc "enigme2" en BDD. Il contient :
 *   { lights: [ "yellow","blue","..." ], solutionPattern: [true,false,true,...], codes: [{patternIndex:0, date: "2007-..."}], datesPossible: ["1466","2000","2007"...] }
 * - L'utilisateur clique sur lumières ; une fois pattern correct -> on récupère code associé et l'utilisateur doit choisir la bonne date (comparée aux dates en BDD).
 */
export default function Enigme2Lumiere({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState(null);
    const [lights, setLights] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            const doc = await getEnigmeDoc("enigme2");
            if (!doc) {
                setMessage("Configuration énigme2 manquante en BDD.");
                setLoading(false);
                return;
            }
            // exemple de doc: { size:5, solution: [true,false,true,false,true], datesOptions: ["1466","2000","2007"], codeToDate: { "10101": "2007" } }
            setConfig(doc);
            setLights(Array(doc.size || 5).fill(false));
            setLoading(false);
        })();

        return () => (mounted = false);
    }, []);

    const toggleLight = (idx) => {
        const newLights = [...lights];
        newLights[idx] = !newLights[idx];
        // toggle voisins si demandé
        if (idx > 0) newLights[idx - 1] = !newLights[idx - 1];
        if (idx < newLights.length - 1) newLights[idx + 1] = !newLights[idx + 1];
        setLights(newLights);

        // check
        if (config && JSON.stringify(newLights) === JSON.stringify(config.solution)) {
            // retrieve code (string representation) to map to date
            const key = newLights.map((b) => (b ? "1" : "0")).join("");
            const targetDate = config.codeToDate?.[key] || null;
            if (targetDate) {
                // propose choix à l'utilisateur : comparer targetDate vs options
                setTimeout(() => {
                    const choice = prompt(
                        `Motif trouvé ! Choisissez la date correcte parmi : ${config.datesOptions.join(
                            " / "
                        )}`
                    );
                    if (choice && choice.toString().trim() === targetDate.toString()) {
                        onComplete(350);
                    } else {
                        alert("Mauvaise date. Essayez encore.");
                    }
                }, 200);
            } else {
                // Si pas de mapping, on considère la solution validée
                setTimeout(() => onComplete(350), 300);
            }
        }
    };

    if (loading) return <div>Chargement des paramètres de l'énigme...</div>;
    if (!config) return <div>Erreur configuration énigme2.</div>;

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">💡 Énigme 2 : Les Lumières du Passage</h3>
            <p className="text-gray-300 mb-6">
                Cliquez sur les lampes. Chaque lampe influence ses voisines. Trouvez le motif secret.
            </p>

            <div className="flex gap-4 justify-center mb-6">
                {lights.map((isOn, idx) => (
                    <div
                        key={idx}
                        onClick={() => toggleLight(idx)}
                        className={`w-24 h-32 rounded-xl cursor-pointer transition-all flex items-center justify-center text-lg font-bold ${
                            isOn ? "bg-amber-400 shadow-[0_0_20px_rgba(180,140,80,0.8)]" : "bg-gray-700"
                        }`}
                    >
                        {isOn ? "💡" : "•"}
                    </div>
                ))}
            </div>

            <p className="text-sm text-gray-400">{message}</p>
        </div>
    );
}
