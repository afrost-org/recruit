CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  type TEXT,
  location TEXT,
  application_email TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  years_experience TEXT,
  current_role TEXT,
  current_company TEXT,
  linkedin TEXT,
  notice_period TEXT,
  resume_file_name TEXT,
  resume_type TEXT,
  resume_url TEXT,
  job_url TEXT,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
