-- Migration pour ajouter la table game_enigmes_completed
-- Cette table track les énigmes complétées globalement pour chaque partie

CREATE TABLE IF NOT EXISTS game_enigmes_completed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    enigme_id INT NOT NULL,
    completed_by VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_game_enigme (game_id, enigme_id),
    INDEX idx_game_id (game_id),
    INDEX idx_enigme_id (enigme_id),
    INDEX idx_completed_at (completed_at)
);

-- Commentaire sur la table
ALTER TABLE game_enigmes_completed COMMENT = 'Table pour tracker les énigmes complétées globalement par partie';
