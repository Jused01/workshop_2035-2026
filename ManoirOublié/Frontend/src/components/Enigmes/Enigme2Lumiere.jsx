// src/components/Enigmes/Enigme2Lumiere.jsx
import React, { useEffect, useMemo, useState } from "react";
import { validatePuzzle } from "../../services/api";

/**
 * Énigme 2 - Jeu de lumière
 * - 2 colonnes (lampes à gauche, réponses à droite)
 * - Chaque clic inverse la lampe et ses voisines
 * - Quand le motif est trouvé, on choisit la date correcte
 *
 * Props:
 *   onComplete?: (points: number) => void
 *   config?: {
 *     size: number;                         // nb de lampes
 *     solution: boolean[];                  // motif cible
 *     datesOptions: string[];               // dates proposées
 *     codeToDate: Record<string, string>;   // "10101" -> "2007"
 *   }
 */

const DEFAULT_CONFIG = {
  size: 5,
  // motif cible : allumé/éteint…
  solution: [true, false, true, false, true],
  datesOptions: ["1466", "2000", "2007"],
  codeToDate: { "10101": "2007" },
};

export default function Enigme2Lumiere({ onComplete, config: cfg }) {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...(cfg || {}) }), [cfg]);

  const [lights, setLights] = useState(() => Array(config.size).fill(false));
  const [status, setStatus] = useState("Trouvez le motif secret."); // message basique
  const [canAnswer, setCanAnswer] = useState(false);                 // active la colonne de droite
  const [targetDate, setTargetDate] = useState(null);

  useEffect(() => {
    setLights(Array(config.size).fill(false));
    setCanAnswer(false);
    setTargetDate(null);
    setStatus("Trouvez le motif secret.");
  }, [config.size]);

  const currentKey = lights.map(b => (b ? "1" : "0")).join("");
  const solved = JSON.stringify(lights) === JSON.stringify(config.solution);

  const toggleLight = (i) => {
    const next = [...lights];
    next[i] = !next[i];
    if (i > 0) next[i - 1] = !next[i - 1];
    if (i < next.length - 1) next[i + 1] = !next[i + 1];
    setLights(next);
  };

  useEffect(() => {
    if (solved) {
      const key = currentKey;
      const mapped = config.codeToDate?.[key] ?? null;
      setTargetDate(mapped);
      setCanAnswer(true);
      setStatus(mapped ? "Motif trouvé ! Choisissez la bonne date →" : "Motif trouvé !");
    } else {
      setCanAnswer(false);
      setTargetDate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, currentKey]);

  const handleAnswer = (date) => {
    if (!canAnswer) return;
    if (targetDate && date === targetDate) {
      setStatus("✅ Correct !");
      
      // Call the validation API to mark the enigme as completed globally
      validatePuzzle("lumiere-nantes-2", "lumiere")
        .then((result) => {
          if (result.ok) {
            onComplete?.(350);
          } else {
            console.error("Lumiere validation failed:", result);
          }
        })
        .catch((error) => {
          console.error("Validation failed:", error);
        });
    } else {
      setStatus("❌ Mauvaise date. Réessayez.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 text-white">
      <h3 className="text-2xl md:text-3xl font-bold mb-2">
        💡 Énigme 2 : Les Lumières du Passage
      </h3>

      {/* 🕯️ Narration historique intégrée */}
      <p className="text-gray-300 mb-6 leading-relaxed">
        En 2007, le célèbre <strong>Passage Pommeraye</strong> de Nantes retrouva sa lumière d’origine.  
        Les lampes restaurées illuminèrent de nouveau la galerie.  
        Reproduisez le motif lumineux pour raviver l’éclat du passé.
      </p>

      {/* 2 colonnes sur desktop, 1 colonne sur mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne gauche : Lampes */}
        <div className="rounded-2xl bg-gray-800 p-4 md:p-6">
          <h4 className="font-semibold mb-4">Lampes</h4>
          <div className="flex gap-3 justify-center md:justify-start">
            {lights.map((isOn, idx) => (
              <button
                key={idx}
                onClick={() => toggleLight(idx)}
                className={`w-16 h-24 md:w-20 md:h-28 rounded-xl border transition-all
                  ${
                    isOn
                      ? "bg-amber-400/90 border-amber-300 shadow-[0_0_20px_rgba(255,200,120,0.8)]"
                      : "bg-gray-700 border-gray-600"
                  }`}
                aria-pressed={isOn}
                title={`Lampe ${idx + 1}`}
              >
                {isOn ? "💡" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Colonne droite : Choix */}
        <div className="rounded-2xl bg-gray-800 p-4 md:p-6">
          <h4 className="font-semibold mb-4">Choisissez la date</h4>
          <div className="flex flex-wrap gap-3">
            {config.datesOptions.map((d) => (
              <button
                key={d}
                onClick={() => handleAnswer(d)}
                disabled={!canAnswer}
                className={`px-4 py-2 rounded-lg border transition
                  ${
                    canAnswer
                      ? "bg-gray-700 hover:bg-gray-600 border-gray-500"
                      : "bg-gray-700/40 border-gray-600/40 cursor-not-allowed opacity-60"
                  }`}
              >
                {d}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-gray-300">{status}</p>
        </div>
      </div>
    </div>
  );
}
