import React, { useState, useEffect } from "react";
import { getEnigme5Poetique, validatePuzzle } from "../../services/api";
import { BookOpen, Send, Sparkles } from "lucide-react";

export default function Enigme5Poem({ onComplete }) {
    const [poem, setPoem] = useState("");
    const [solution, setSolution] = useState("");
    const [answerInput, setAnswerInput] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        const fetchPoem = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getEnigme5Poetique();

                if (data && data.text) {
                    setPoem(data.text);
                    setSolution(data.answer || "");
                } else {
                    setError("Le poème n'a pas pu être chargé correctement.");
                }
            } catch (err) {
                console.error("Erreur lors du chargement du poème:", err);
                setError(`Impossible de charger l'énigme: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchPoem();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback("");

        if (!answerInput.trim()) {
            setFeedback("Veuillez entrer une réponse.");
            return;
        }

        try {
            const res = await validatePuzzle("poetique-nantes-5", answerInput.trim());

            if (res.ok) {
                setFeedback("✅ Bravo ! Vous avez résolu l'énigme !");
                setTimeout(() => {
                    if (onComplete) onComplete(400); // 400 points
                }, 1500);
            } else {
                setFeedback("❌ Mauvaise réponse, essayez encore !");
            }
        } catch (err) {
            console.error("Erreur lors de la validation:", err);
            setFeedback(`Erreur lors de la validation: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-400"></div>
                <p className="text-gray-300 text-lg">Chargement de l'énigme poétique...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-8 h-8 text-amber-400" />
                <h2 className="text-3xl font-bold text-amber-100">
                    Énigme Poétique
                </h2>
            </div>

            {error && (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4 text-red-200">
                    <p className="font-semibold">❌ Erreur</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {!error && poem && (
                <>
                    <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-2 border-amber-600/30 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-semibold text-amber-200 mb-3">
                                    Le Poème du Musée
                                </h3>
                                <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-line font-serif">
                                    {poem}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Quelle est votre réponse ?
                            </label>
                            <input
                                type="text"
                                value={answerInput}
                                onChange={(e) => setAnswerInput(e.target.value)}
                                placeholder="Entrez votre réponse ici..."
                                className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                        >
                            <Send className="w-5 h-5" />
                            Valider ma réponse
                        </button>

                        {feedback && (
                            <div className={`border-2 rounded-lg p-4 text-center font-semibold ${
                                feedback.includes("✅")
                                    ? "bg-green-900/30 border-green-500 text-green-200"
                                    : "bg-orange-900/30 border-orange-500 text-orange-200"
                            }`}>
                                {feedback}
                            </div>
                        )}
                    </form>
                </>
            )}

            {/* Debug info (à retirer en production) */}
            {process.env.NODE_ENV === 'development' && solution && (
                <div className="mt-8 p-3 bg-gray-900 border border-gray-700 rounded text-xs text-gray-400">
                    <strong>Debug:</strong> Solution = {solution}
                </div>
            )}
        </div>
    );
}