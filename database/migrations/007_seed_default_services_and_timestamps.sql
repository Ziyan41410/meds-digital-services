-- Seed the minimal services required by the client dashboard request form.

SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='projects' AND COLUMN_NAME='updated_at'
);
SET @sql = IF(@col_exists=0, 'ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='services' AND COLUMN_NAME='duration_days'
);
SET @sql = IF(@col_exists=0, 'ALTER TABLE services ADD COLUMN duration_days INT DEFAULT 14 AFTER price', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO services (name, description, price, duration_days)
SELECT 'تطوير مواقع ويب', 'مواقع ويب وصفحات هبوط وتطبيقات ويب', 1500.00, 14
WHERE NOT EXISTS (SELECT 1 FROM services);

INSERT INTO services (name, description, price, duration_days)
SELECT 'تسويق رقمي', 'حملات إعلانية وإدارة محتوى وتحسين حضور رقمي', 800.00, 30
WHERE (SELECT COUNT(*) FROM services) = 1;

INSERT INTO services (name, description, price, duration_days)
SELECT 'أمن سيبراني', 'فحص أمني واختبار اختراق وتدقيق حماية', 2000.00, 10
WHERE (SELECT COUNT(*) FROM services) = 2;
