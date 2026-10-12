-- RiddleX schema. Idempotent (IF NOT EXISTS); later changes go in 002_*.sql, not here.
-- Collations: ids/tokens are ascii_bin (exact, case-sensitive); emails/slugs are utf8mb4_bin
-- (the app lowercases them, and the default accent-insensitive collation would make
-- "josé@x.com" collide with "jose@x.com"). Never put a semicolon inside a comment.

CREATE TABLE IF NOT EXISTS riddlex_career_sites (
  org_email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin PRIMARY KEY,
  company_name VARCHAR(120) NOT NULL,
  slug VARCHAR(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
  tagline VARCHAR(255) NOT NULL DEFAULT '',
  logo_url VARCHAR(512) NOT NULL DEFAULT '',
  colors JSON NOT NULL,
  font VARCHAR(20) NOT NULL,
  hiring_locations JSON NOT NULL,
  languages JSON NOT NULL,
  default_language CHAR(2) NOT NULL,
  published TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS riddlex_jobs (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  org_email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  location VARCHAR(200) NOT NULL,
  job_type ENUM('Full-time','Part-time','Contract','Internship') NOT NULL,
  language CHAR(2) NOT NULL,
  status ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  public_token CHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_jobs_org_created (org_email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generated once per job, then immutable: submissions are validated against these rows.
-- lang is 'en' for kind=skills (skill names are language-neutral).
CREATE TABLE IF NOT EXISTS riddlex_job_questionnaires (
  job_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  kind ENUM('screening','skills') NOT NULL,
  lang CHAR(2) NOT NULL,
  payload JSON NOT NULL,
  generated_by ENUM('ai','catalog') NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (job_id, kind, lang),
  FOREIGN KEY (job_id) REFERENCES riddlex_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS riddlex_applications (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  job_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  applicant_name VARCHAR(200) NOT NULL,
  applicant_email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  mobile_number VARCHAR(40) NOT NULL,
  resume_file_name VARCHAR(255) NOT NULL,
  resume_blob_path VARCHAR(512) NOT NULL,
  answers JSON NOT NULL,
  skills JSON NOT NULL,
  skills_match TINYINT UNSIGNED NOT NULL,
  stage ENUM('New','In Review','Interview','Offer','Hired','Rejected') NOT NULL DEFAULT 'New',
  notes TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_job_email (job_id, applicant_email),
  INDEX idx_app_job_stage (job_id, stage),
  INDEX idx_app_job_created (job_id, created_at),
  FOREIGN KEY (job_id) REFERENCES riddlex_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS riddlex_application_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  stage ENUM('New','In Review','Interview','Offer','Hired','Rejected') NOT NULL,
  at DATETIME(3) NOT NULL,
  INDEX idx_hist_app (application_id, at),
  FOREIGN KEY (application_id) REFERENCES riddlex_applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
