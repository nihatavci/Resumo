import type { Profile, Resume, Job, WorkExperience, Education, Skill, Project } from '@/lib/types';

// ---------------------------------------------------------------------------
// D1 binding access
// ---------------------------------------------------------------------------

// In production (Cloudflare Pages), D1 is accessed via getRequestContext().
// In local dev, we use a local SQLite file via wrangler's --d1 flag.
// This function abstracts that.

let _getDB: () => D1Database;

export function setDBProvider(provider: () => D1Database) {
  _getDB = provider;
}

export function getDB(): D1Database {
  if (!_getDB) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require('@opennextjs/cloudflare');
      const ctx = getCloudflareContext();
      return (ctx.env as Record<string, D1Database>).DB;
    } catch {
      throw new Error('D1 database not available. Ensure you are running on Cloudflare Workers or have configured a local D1 binding.');
    }
  }
  return _getDB();
}

// ---------------------------------------------------------------------------
// JSON column helpers
// ---------------------------------------------------------------------------

function parseJSON<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

function toJSON(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? null);
}

// ---------------------------------------------------------------------------
// Row → Type mappers
// ---------------------------------------------------------------------------

type D1Row = Record<string, unknown>;

function rowToProfile(row: D1Row): Profile {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    email: row.email as string | null,
    phone_number: row.phone_number as string | null,
    location: row.location as string | null,
    website: row.website as string | null,
    linkedin_url: row.linkedin_url as string | null,
    github_url: row.github_url as string | null,
    is_admin: Boolean(row.is_admin),
    work_experience: parseJSON<WorkExperience[]>(row.work_experience, []),
    education: parseJSON<Education[]>(row.education, []),
    skills: parseJSON<Skill[]>(row.skills, []),
    projects: parseJSON<Project[]>(row.projects, []),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToResume(row: D1Row): Resume {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    job_id: row.job_id as string | null,
    name: row.name as string,
    target_role: row.target_role as string,
    is_base_resume: Boolean(row.is_base_resume),
    first_name: row.first_name as string,
    last_name: row.last_name as string,
    email: row.email as string,
    phone_number: row.phone_number as string,
    location: row.location as string,
    website: row.website as string,
    linkedin_url: row.linkedin_url as string,
    github_url: row.github_url as string,
    work_experience: parseJSON<WorkExperience[]>(row.work_experience, []),
    education: parseJSON<Education[]>(row.education, []),
    skills: parseJSON<Skill[]>(row.skills, []),
    projects: parseJSON<Project[]>(row.projects, []),
    document_settings: parseJSON(row.document_settings, undefined) as Resume['document_settings'],
    section_order: parseJSON<string[] | undefined>(row.section_order, undefined),
    section_configs: parseJSON(row.section_configs, undefined) as Resume['section_configs'],
    has_cover_letter: Boolean(row.has_cover_letter),
    cover_letter: parseJSON<Record<string, unknown> | null>(row.cover_letter, null),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToJob(row: D1Row): Job {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    company_name: row.company_name as string,
    position_title: row.position_title as string,
    job_url: row.job_url as string | null,
    description: row.description as string | null,
    location: row.location as string | null,
    salary_range: row.salary_range as string | null,
    keywords: parseJSON<string[]>(row.keywords, []),
    work_location: row.work_location as Job['work_location'],
    employment_type: row.employment_type as Job['employment_type'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    is_active: Boolean(row.is_active),
  };
}

// ---------------------------------------------------------------------------
// Profile queries
// ---------------------------------------------------------------------------

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const row = await getDB().prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first();
  return row ? rowToProfile(row) : null;
}

export async function updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const jsonFields = ['work_experience', 'education', 'skills', 'projects'];
  const textFields = ['first_name', 'last_name', 'email', 'phone_number', 'location', 'website', 'linkedin_url', 'github_url'];

  for (const key of textFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key] ?? null);
    }
  }
  for (const key of jsonFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(toJSON((data as Record<string, unknown>)[key]));
    }
  }

  if (fields.length === 0) return getProfileByUserId(userId);

  fields.push("updated_at = datetime('now')");
  values.push(userId);

  await getDB().prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`).bind(...values).run();
  return getProfileByUserId(userId);
}

export async function createProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
  const id = crypto.randomUUID();
  await getDB().prepare(`
    INSERT INTO profiles (id, user_id, first_name, last_name, email, phone_number, location, website, linkedin_url, github_url, work_experience, education, skills, projects)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    userId,
    data.first_name ?? null,
    data.last_name ?? null,
    data.email ?? null,
    data.phone_number ?? null,
    data.location ?? null,
    data.website ?? null,
    data.linkedin_url ?? null,
    data.github_url ?? null,
    toJSON(data.work_experience ?? []),
    toJSON(data.education ?? []),
    toJSON(data.skills ?? []),
    toJSON(data.projects ?? []),
  ).run();
  return (await getProfileByUserId(userId))!;
}

// ---------------------------------------------------------------------------
// Resume queries
// ---------------------------------------------------------------------------

export async function getResumeById(resumeId: string, userId: string): Promise<Resume | null> {
  const row = await getDB().prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').bind(resumeId, userId).first();
  return row ? rowToResume(row) : null;
}

export async function getResumesByUserId(userId: string, isBase?: boolean): Promise<Resume[]> {
  let sql = 'SELECT * FROM resumes WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (isBase !== undefined) {
    sql += ' AND is_base_resume = ?';
    params.push(isBase ? 1 : 0);
  }

  sql += ' ORDER BY updated_at DESC';
  const { results } = await getDB().prepare(sql).bind(...params).all();
  return results.map(rowToResume);
}

export async function countResumes(userId: string, type: 'base' | 'tailored' | 'all'): Promise<number> {
  let sql = 'SELECT COUNT(*) as count FROM resumes WHERE user_id = ?';
  const params: unknown[] = [userId];

  if (type !== 'all') {
    sql += ' AND is_base_resume = ?';
    params.push(type === 'base' ? 1 : 0);
  }

  const row = await getDB().prepare(sql).bind(...params).first();
  return (row?.count as number) ?? 0;
}

export async function insertResume(data: Partial<Resume> & { user_id: string; name: string }): Promise<Resume> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await getDB().prepare(`
    INSERT INTO resumes (
      id, user_id, job_id, name, target_role, is_base_resume,
      first_name, last_name, email, phone_number, location, website, linkedin_url, github_url,
      work_experience, education, skills, projects,
      document_settings, section_order, section_configs,
      has_cover_letter, cover_letter,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.user_id,
    data.job_id ?? null,
    data.name,
    data.target_role ?? '',
    data.is_base_resume ? 1 : 0,
    data.first_name ?? '',
    data.last_name ?? '',
    data.email ?? '',
    data.phone_number ?? '',
    data.location ?? '',
    data.website ?? '',
    data.linkedin_url ?? '',
    data.github_url ?? '',
    toJSON(data.work_experience ?? []),
    toJSON(data.education ?? []),
    toJSON(data.skills ?? []),
    toJSON(data.projects ?? []),
    toJSON(data.document_settings ?? {}),
    toJSON(data.section_order ?? []),
    toJSON(data.section_configs ?? {}),
    data.has_cover_letter ? 1 : 0,
    data.cover_letter ? toJSON(data.cover_letter) : null,
    data.created_at ?? now,
    data.updated_at ?? now,
  ).run();

  const resume = await getDB().prepare('SELECT * FROM resumes WHERE id = ?').bind(id).first();
  return rowToResume(resume!);
}

export async function updateResume(resumeId: string, userId: string, data: Partial<Resume>): Promise<Resume | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const jsonFields = ['work_experience', 'education', 'skills', 'projects', 'document_settings', 'section_order', 'section_configs', 'cover_letter'];
  const textFields = ['name', 'target_role', 'first_name', 'last_name', 'email', 'phone_number', 'location', 'website', 'linkedin_url', 'github_url', 'job_id', 'professional_summary'];
  const boolFields = ['is_base_resume', 'has_cover_letter', 'is_active'];
  const numFields = ['score'];

  for (const key of textFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key] ?? null);
    }
  }
  for (const key of jsonFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(toJSON((data as Record<string, unknown>)[key]));
    }
  }
  for (const key of boolFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key] ? 1 : 0);
    }
  }
  for (const key of numFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as Record<string, unknown>)[key] ?? null);
    }
  }
  if ('score_details' in data) {
    fields.push('score_details = ?');
    values.push(toJSON((data as Record<string, unknown>).score_details));
  }

  if (fields.length === 0) return getResumeById(resumeId, userId);

  fields.push("updated_at = datetime('now')");
  values.push(resumeId, userId);

  await getDB().prepare(`UPDATE resumes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).bind(...values).run();
  return getResumeById(resumeId, userId);
}

export async function deleteResume(resumeId: string, userId: string): Promise<void> {
  await getDB().prepare('DELETE FROM resumes WHERE id = ? AND user_id = ?').bind(resumeId, userId).run();
}

// ---------------------------------------------------------------------------
// Job queries
// ---------------------------------------------------------------------------

export async function getJobById(jobId: string, userId: string): Promise<Job | null> {
  const row = await getDB().prepare('SELECT * FROM jobs WHERE id = ? AND user_id = ?').bind(jobId, userId).first();
  return row ? rowToJob(row) : null;
}

export async function getJobsByUserId(userId: string, filters?: {
  workLocation?: string;
  employmentType?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: Job[]; total: number }> {
  let where = 'WHERE user_id = ? AND is_active = 1';
  const params: unknown[] = [userId];

  if (filters?.workLocation) {
    where += ' AND work_location = ?';
    params.push(filters.workLocation);
  }
  if (filters?.employmentType) {
    where += ' AND employment_type = ?';
    params.push(filters.employmentType);
  }
  if (filters?.keyword) {
    where += ' AND (company_name LIKE ? OR position_title LIKE ? OR description LIKE ?)';
    const pattern = `%${filters.keyword}%`;
    params.push(pattern, pattern, pattern);
  }

  const countRow = await getDB().prepare(`SELECT COUNT(*) as count FROM jobs ${where}`).bind(...params).first();
  const total = (countRow?.count as number) ?? 0;

  let sql = `SELECT * FROM jobs ${where} ORDER BY created_at DESC`;
  if (filters?.limit) {
    sql += ` LIMIT ${filters.limit}`;
    if (filters?.offset) {
      sql += ` OFFSET ${filters.offset}`;
    }
  }

  const { results } = await getDB().prepare(sql).bind(...params).all();
  return { jobs: results.map(rowToJob), total };
}

export async function insertJob(data: Partial<Job> & { user_id: string }): Promise<Job> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await getDB().prepare(`
    INSERT INTO jobs (id, user_id, company_name, position_title, job_url, description, location, salary_range, keywords, work_location, employment_type, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    id,
    data.user_id,
    data.company_name ?? '',
    data.position_title ?? '',
    data.job_url ?? null,
    data.description ?? null,
    data.location ?? null,
    data.salary_range ?? null,
    toJSON(data.keywords ?? []),
    data.work_location ?? null,
    data.employment_type ?? null,
    now,
    now,
  ).run();

  const row = await getDB().prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  return rowToJob(row!);
}

export async function deleteJob(jobId: string, userId: string): Promise<void> {
  await getDB().prepare('DELETE FROM jobs WHERE id = ? AND user_id = ?').bind(jobId, userId).run();
}

export async function softDeleteJob(jobId: string, userId: string): Promise<void> {
  await getDB().prepare("UPDATE jobs SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?").bind(jobId, userId).run();
}

// ---------------------------------------------------------------------------
// AI Usage Events
// ---------------------------------------------------------------------------

export async function insertAIUsageEvent(data: {
  userId: string;
  route: string;
  provider?: string;
  model?: string;
  isPro?: boolean;
  usedServerKey?: boolean;
  status: string;
  errorCode?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  await getDB().prepare(`
    INSERT INTO ai_usage_events (id, user_id, route, provider, model, is_pro, used_server_key, status, error_code, input_tokens, output_tokens, total_tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.userId,
    data.route,
    data.provider ?? null,
    data.model ?? null,
    data.isPro !== false ? 1 : 0,
    data.usedServerKey ? 1 : 0,
    data.status,
    data.errorCode ?? null,
    data.inputTokens ?? null,
    data.outputTokens ?? null,
    data.totalTokens ?? null,
  ).run();
  return id;
}

export async function updateAIUsageEvent(id: string, data: {
  status: string;
  errorCode?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  provider?: string;
  model?: string;
}): Promise<void> {
  await getDB().prepare(`
    UPDATE ai_usage_events
    SET status = ?, error_code = ?, input_tokens = ?, output_tokens = ?, total_tokens = ?, provider = COALESCE(?, provider), model = COALESCE(?, model)
    WHERE id = ?
  `).bind(
    data.status,
    data.errorCode ?? null,
    data.inputTokens ?? null,
    data.outputTokens ?? null,
    data.totalTokens ?? null,
    data.provider ?? null,
    data.model ?? null,
    id,
  ).run();
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function getAllProfiles(limit: number, offset: number): Promise<{ profiles: Profile[]; total: number }> {
  const countRow = await getDB().prepare('SELECT COUNT(*) as count FROM profiles').first();
  const total = (countRow?.count as number) ?? 0;
  const { results } = await getDB().prepare('SELECT * FROM profiles ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
  return { profiles: results.map(rowToProfile), total };
}

export async function getResumeCountForUser(userId: string): Promise<number> {
  const row = await getDB().prepare('SELECT COUNT(*) as count FROM resumes WHERE user_id = ?').bind(userId).first();
  return (row?.count as number) ?? 0;
}

export async function getResumeSummariesForUser(userId: string): Promise<Resume[]> {
  const { results } = await getDB().prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC').bind(userId).all();
  return results.map(rowToResume);
}

export async function getTotalResumeCount(): Promise<number> {
  const row = await getDB().prepare('SELECT COUNT(*) as count FROM resumes').first();
  return (row?.count as number) ?? 0;
}

export async function getBaseResumeCount(): Promise<number> {
  const row = await getDB().prepare('SELECT COUNT(*) as count FROM resumes WHERE is_base_resume = 1').first();
  return (row?.count as number) ?? 0;
}

export async function getTailoredResumeCount(): Promise<number> {
  const row = await getDB().prepare('SELECT COUNT(*) as count FROM resumes WHERE is_base_resume = 0').first();
  return (row?.count as number) ?? 0;
}

export async function deleteProfileByUserId(userId: string): Promise<void> {
  await getDB().prepare('DELETE FROM profiles WHERE user_id = ?').bind(userId).run();
}

export async function deleteResumesByUserId(userId: string): Promise<void> {
  await getDB().prepare('DELETE FROM resumes WHERE user_id = ?').bind(userId).run();
}
