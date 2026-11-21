-- Select the target schema first (double-click it in Workbench, or add USE <db>; at the top).
-- RiddleX custom job questions. Run manually, once per database. Safe to re-run: each column is added
-- only when information_schema says it is missing (MySQL 8 has no ADD COLUMN IF NOT EXISTS).
-- Never put a semicolon inside a comment.

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscription' AND COLUMN_NAME = 'custom_questions_enabled') = 0,
  'ALTER TABLE subscription ADD COLUMN custom_questions_enabled TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'riddlex_jobs' AND COLUMN_NAME = 'custom_questions') = 0,
  'ALTER TABLE riddlex_jobs ADD COLUMN custom_questions JSON NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'riddlex_applications' AND COLUMN_NAME = 'custom_answers') = 0,
  'ALTER TABLE riddlex_applications ADD COLUMN custom_answers JSON NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enable / disable the feature for an org (the subscription owner), run by hand:
-- UPDATE subscription SET custom_questions_enabled=1 WHERE subscription='RiddleX' AND owner='<org email>';
-- UPDATE subscription SET custom_questions_enabled=0 WHERE subscription='RiddleX' AND owner='<org email>';
