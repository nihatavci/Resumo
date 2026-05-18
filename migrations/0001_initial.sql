-- Initial D1 schema migrated from Supabase PostgreSQL
-- JSON fields stored as TEXT, parsed at application layer

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone_number TEXT,
  location TEXT,
  website TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  is_admin INTEGER DEFAULT 0,
  work_experience TEXT DEFAULT '[]',
  education TEXT DEFAULT '[]',
  skills TEXT DEFAULT '[]',
  projects TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_id TEXT,
  name TEXT NOT NULL,
  target_role TEXT DEFAULT '',
  is_base_resume INTEGER DEFAULT 0,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  work_experience TEXT DEFAULT '[]',
  education TEXT DEFAULT '[]',
  skills TEXT DEFAULT '[]',
  projects TEXT DEFAULT '[]',
  professional_summary TEXT DEFAULT '',
  document_settings TEXT DEFAULT '{}',
  section_order TEXT DEFAULT '[]',
  section_configs TEXT DEFAULT '{}',
  has_cover_letter INTEGER DEFAULT 0,
  cover_letter TEXT,
  tailoring_metadata TEXT,
  score INTEGER,
  score_details TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  position_title TEXT DEFAULT '',
  job_url TEXT,
  description TEXT,
  location TEXT,
  salary_range TEXT,
  keywords TEXT DEFAULT '[]',
  work_location TEXT,
  employment_type TEXT,
  scraped_url TEXT,
  raw_html TEXT,
  parsed_data TEXT,
  ats_keywords TEXT DEFAULT '[]',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  resume_id TEXT NOT NULL,
  status TEXT DEFAULT 'saved',
  applied_date TEXT,
  notes TEXT,
  follow_up_date TEXT,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (resume_id) REFERENCES resumes(id)
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  route TEXT,
  provider TEXT,
  model TEXT,
  is_pro INTEGER DEFAULT 1,
  used_server_key INTEGER DEFAULT 0,
  status TEXT,
  error_code TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_base ON resumes(user_id, is_base_resume);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_resume ON applications(resume_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_events(user_id);
