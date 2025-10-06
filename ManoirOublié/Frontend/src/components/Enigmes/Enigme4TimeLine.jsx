// src/components/Enigmes/Enigme4Timeline.jsx
import React, { useEffect, useState } from "react";
import { getEnigmeDoc } from "../../services/firebase";

/**
 * - Charge doc "enigme4" : { events: [{id, text, year}, ...] }
 * - Affiche dans un ordre mélangé. L'utilisateur peut déplacer (up/down) pour remettre en ordre.
 */
export default function Enigme4Timeline({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        (async () => {
            const doc = await getEnigmeDoc("enigme4");
            if (!doc || !doc.events) {
                setLoading(false);
                return;
            }
            // shuffle initial order
            const shuffled = [...doc.events].sort(() => Math.random() - 0.5);
            setEvents(shuffled);
            setLoading(false);
        })();
    }, []);

    const move = (idx, dir) => {
        const newE = [...events];
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= newE.length) return;
        [newE[idx], newE[swapIdx]] = [newE[swapIdx], newE[idx]];
        setEvents(newE);

        // check if sorted now
        const isSorted = newE
            .map((e) => e.year)
            .every((y, i, arr) => (i === 0 ? true : arr[i - 1] <= y));
        if (isSorted) {
            setTimeout(() => onComplete(400), 400);
        }
    };

    if (loading) return <div>Chargement de la timeline...</div>;
    if (!events?.length) return <div>Aucun événement trouvé pour cette énigme.</div>;

    return (
        <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">📅 Énigme 4 : Replace la Chronologie</h3>
            <p className="text-gray-300 mb-6">Remets ces événements dans l'ordre chronologique.</p>

            <div className="max-w-2xl mx-auto space-y-3">
                {events.map((ev, idx) => (
                    <div key={ev.id} className="bg-gray-700/50 p-4 rounded flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-lg">{ev.text}</div>
                            <div className="text-sm text-gray-400">Année : {ev.year}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => move(idx, -1)} className="px-2 py-1 rounded bg-gray-600">⬆️</button>
                            <button onClick={() => move(idx, 1)} className="px-2 py-1 rounded bg-gray-600">⬇️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
