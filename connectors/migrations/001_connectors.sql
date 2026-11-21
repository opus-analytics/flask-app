-- Connectors: per-user cloud storage links (Google Drive, OneDrive). Idempotent.
-- refresh_token_enc holds a Fernet token, never the raw refresh token.
-- status values are active, revoked, error. Never put a semicolon inside a comment.

CREATE TABLE IF NOT EXISTS connector_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  provider VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  account_label VARCHAR(255) NOT NULL DEFAULT '',
  refresh_token_enc TEXT NOT NULL,
  scopes VARCHAR(512) NOT NULL DEFAULT '',
  status VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_connector_user_provider (user_email, provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Per-subscription flag. Added only if missing so re-running is safe.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subscription' AND COLUMN_NAME = 'connectors_enabled');
SET @ddl := IF(@has_col = 0,
  'ALTER TABLE subscription ADD COLUMN connectors_enabled TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Enable for one user (all their subscription rows):
--   UPDATE subscription SET connectors_enabled = 1 WHERE email = 'user@example.com'
-- Disable for one user:
--   UPDATE subscription SET connectors_enabled = 0 WHERE email = 'user@example.com'
-- Disable for everyone, then enable per customer:
--   UPDATE subscription SET connectors_enabled = 0
