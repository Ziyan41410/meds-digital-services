-- =====================================
-- Migration: Add domain field to projects table
-- =====================================

-- Check and add 'domain' field to projects table
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='projects' AND COLUMN_NAME='domain' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 
    'ALTER TABLE projects ADD COLUMN domain ENUM(''dev'', ''mkt'', ''sec'') NOT NULL DEFAULT ''dev'' COMMENT ''مسار النموذج: dev=برمجة, mkt=تسويق, sec=أمن سيبراني''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add 'form_data' field to projects table
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME='projects' AND COLUMN_NAME='form_data' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@col_exists=0, 
    'ALTER TABLE projects ADD COLUMN form_data JSON COMMENT ''البيانات الديناميكية المحددة لكل مسار (مثل: القنوات، الميزات، المعلومات التقنية)''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for the new fields
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_NAME='projects' AND INDEX_NAME='idx_domain' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@idx_exists=0, 
    'CREATE INDEX idx_domain ON projects (domain)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for the new fields
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_NAME='projects' AND INDEX_NAME='idx_status' AND TABLE_SCHEMA=DATABASE()
);

SET @sql = IF(@idx_exists=0, 
    'CREATE INDEX idx_status ON projects (status)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;