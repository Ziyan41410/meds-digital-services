-- =====================================
-- Migration: Create reviews table for customer ratings
-- =====================================

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  client_id INT NOT NULL,
  professional_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (professional_id) REFERENCES users(id),
  UNIQUE KEY unique_review (project_id, client_id),
  INDEX idx_project_id (project_id),
  INDEX idx_client_id (client_id),
  INDEX idx_professional_id (professional_id),
  INDEX idx_rating (rating),
  INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
