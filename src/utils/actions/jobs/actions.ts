'use server';

import { revalidatePath } from 'next/cache';
import { simplifiedJobSchema } from "@/lib/zod-schemas";
import type { Job } from "@/lib/types";
import { z } from "zod";
import { JobListingParams } from "./schema";
import { getAuthenticatedUser } from "@/utils/auth";
import { insertJob as dbInsertJob, deleteJob as dbDeleteJob, getJobsByUserId, softDeleteJob as dbSoftDeleteJob, getDB, getJobById as dbGetJobById } from "@/lib/db";

export async function createJob(jobListing: z.infer<typeof simplifiedJobSchema>) {
  const user = await getAuthenticatedUser();

  const job = await dbInsertJob({
    user_id: user.id,
    company_name: jobListing.company_name,
    position_title: jobListing.position_title,
    job_url: jobListing.job_url,
    description: jobListing.description,
    location: jobListing.location,
    salary_range: jobListing.salary_range,
    keywords: jobListing.keywords,
    work_location: jobListing.work_location || 'in_person',
    employment_type: jobListing.employment_type || 'full_time',
    is_active: true,
  });

  return job;
}

export async function deleteJob(jobId: string): Promise<void> {
  const user = await getAuthenticatedUser();

  // First, get all resumes that reference this job
  const db = getDB();
  const { results: affectedResumes } = await db
    .prepare('SELECT id FROM resumes WHERE job_id = ? AND user_id = ?')
    .bind(jobId, user.id)
    .all();

  // Delete the job
  await dbDeleteJob(jobId, user.id);

  // Revalidate all affected resume paths
  affectedResumes?.forEach((resume) => {
    revalidatePath(`/resumes/${resume.id}`);
  });

  // Also revalidate the general paths
  revalidatePath('/', 'layout');
  revalidatePath('/resumes', 'layout');
}


export async function getJobListings({
  page = 1,
  pageSize = 10,
  filters
}: JobListingParams) {
  const user = await getAuthenticatedUser();

  const offset = (page - 1) * pageSize;

  const { jobs, total } = await getJobsByUserId(user.id, {
    workLocation: filters?.workLocation,
    employmentType: filters?.employmentType,
    limit: pageSize,
    offset,
  });

  return {
    jobs,
    totalCount: total,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function deleteTailoredJob(jobId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await dbSoftDeleteJob(jobId, user.id);
  revalidatePath('/', 'layout');
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const user = await getAuthenticatedUser();
  return dbGetJobById(jobId, user.id);
}

export async function createEmptyJob(): Promise<Job> {
  const user = await getAuthenticatedUser();

  const job = await dbInsertJob({
    user_id: user.id,
    company_name: 'New Company',
    position_title: 'New Position',
    job_url: null,
    description: null,
    location: null,
    salary_range: null,
    keywords: [],
    work_location: null,
    employment_type: null,
    is_active: true,
  });

  revalidatePath('/', 'layout');
  return job;
} 
