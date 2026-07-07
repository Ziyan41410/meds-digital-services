-- ══════════════════════════════════════════════════════
-- Migration: 009_seed_test_managers.sql
-- Purpose: Create test manager users for development
-- ══════════════════════════════════════════════════════

-- Insert test manager users (if they don't already exist)
INSERT IGNORE INTO users (first_name, last_name, username, email, password_hash, phone, role_id, department, is_active, created_at, updated_at)
VALUES
  ('أحمد', 'البرمجة', 'manager_dev', 'manager@dev.com', '$2b$10$8KLIfdX3hOTwBCa1ifCiZOX3znKsIglFKLJCVCVh4hvKiK4mMuqlq', '+966501234567', 2, 'systems', 1, NOW(), NOW()),
  ('فاطمة', 'التسويق', 'manager_mkt', 'manager@mkt.com', '$2b$10$8KLIfdX3hOTwBCa1ifCiZOX3znKsIglFKLJCVCVh4hvKiK4mMuqlq', '+966502234567', 2, 'marketing', 1, NOW(), NOW()),
  ('محمد', 'الأمن', 'manager_sec', 'manager@sec.com', '$2b$10$8KLIfdX3hOTwBCa1ifCiZOX3znKsIglFKLJCVCVh4hvKiK4mMuqlq', '+966503234567', 2, 'security', 1, NOW(), NOW()),
  ('سارة', 'المسؤولة', 'admin_user', 'admin@meds.com', '$2b$10$8KLIfdX3hOTwBCa1ifCiZOX3znKsIglFKLJCVCVh4hvKiK4mMuqlq', '+966504234567', 1, 'systems', 1, NOW(), NOW());

-- Note: Default password for all test accounts is 'password123'
-- Hash: $2b$10$8KLIfdX3hOTwBCa1ifCiZOX3znKsIglFKLJCVCVh4hvKiK4mMuqlq

-- Update roles to ensure manager roles exist
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'programmer' LIMIT 1) WHERE username = 'manager_dev';
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'marketer' LIMIT 1) WHERE username = 'manager_mkt';
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'cyber_security_expert' LIMIT 1) WHERE username = 'manager_sec';
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1) WHERE username = 'admin_user';
