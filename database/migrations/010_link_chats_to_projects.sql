-- Link each service/project conversation to its project.
-- If this migration is applied manually, run the ALTER statements only when
-- the column/indexes do not already exist.

ALTER TABLE chats ADD COLUMN project_id INT NULL AFTER id;
ALTER TABLE chats ADD UNIQUE KEY unique_project_chat (project_id);
ALTER TABLE chats ADD INDEX idx_project_chat (project_id);
