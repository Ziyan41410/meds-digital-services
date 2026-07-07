-- =====================================
-- Migration: Add missing fields
-- =====================================

-- Ensure dashboard/project columns exist before adding paid
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='projects' AND COLUMN_NAME='progress' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 'ALTER TABLE projects ADD COLUMN progress INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='projects' AND COLUMN_NAME='end_date' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 'ALTER TABLE projects ADD COLUMN end_date DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='projects' AND COLUMN_NAME='completed_at' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 'ALTER TABLE projects ADD COLUMN completed_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add 'paid' field to projects table
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='projects' AND COLUMN_NAME='paid' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 'ALTER TABLE projects ADD COLUMN paid BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add 'message_type' field
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='messages' AND COLUMN_NAME='message_type' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 'ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT "direct" AFTER message', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add 'related_project_id' field
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='messages' AND COLUMN_NAME='related_project_id' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 'ALTER TABLE messages ADD COLUMN related_project_id INT AFTER project_id', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


