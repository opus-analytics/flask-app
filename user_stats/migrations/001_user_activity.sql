-- user_stats schema. Server: MySQL 5.7 (Azure), so JSON is supported.
-- Collation: users.email is utf8 / utf8_general_ci and users.user_id is INT(11), so user_activity
-- mirrors them exactly (joins on email stay index-friendly, no collation mismatch errors).
-- Never put a semicolon inside a comment.

CREATE TABLE IF NOT EXISTS user_activity (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  user_id INT(11) NULL,
  event_type VARCHAR(32) NOT NULL,
  feature VARCHAR(64) NULL,
  product VARCHAR(32) NULL,
  meta JSON NULL,
  created_at DATETIME(3) NOT NULL,
  KEY idx_ua_user_time (user_email, created_at),
  KEY idx_ua_user_type_time (user_email, event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- NOT idempotent in plain SQL (MySQL 5.7 has no ADD COLUMN IF NOT EXISTS).
-- Run ONLY if users.last_login_at is missing. Check first:
--   SELECT COUNT(*) FROM information_schema.columns
--   WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login_at'
ALTER TABLE users ADD COLUMN last_login_at DATETIME(3) NULL;
