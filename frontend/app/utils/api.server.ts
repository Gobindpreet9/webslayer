import { ENV } from "./env.server";
import type { SchemaField } from "~/types/types";
import type { JobCreationResponse, JobStatusResponse } from "~/types/types";

interface SchemaCreateRequest {
  name: string | null;
  fields: SchemaField[];
}

// --- Project Types ---
export interface Project {
  id?: string;
  name: string;
  urls: string[];
  crawl_config?: any;
  scraper_config?: any;
  llm_config?: any;
  schema_name?: string;
}

export async function startScrapeJob(jobRequest: any): Promise<JobCreationResponse> {
  const response = await fetch(`${ENV.API_URL}/scrape/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobRequest),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to start scraping job");
  }

  return data;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  console.log("Fetching job status for jobId:", jobId);
  console.log("API URL:", ENV.API_URL);
  const response = await fetch(`${ENV.API_URL}/scrape/${jobId}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch job status");
  }

  return data;
}

export async function getSchemas() {
  const response = await fetch(`${ENV.API_URL}/schema/`);
  if (!response.ok) {
    throw new Error("Failed to fetch schemas");
  }
  return response.json();
}

export async function createSchema({ name, fields }: SchemaCreateRequest) {
  const response = await fetch(`${ENV.API_URL}/schema/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, fields }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create schema");
  }

  return { success: true };
}

export async function getReport(reportName: string): Promise<any> {
  const response = await fetch(`${ENV.API_URL}/reports/${reportName}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch report");
  }

  return response.json();
}

// --- Project API ---
export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${ENV.API_URL}/projects`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch projects");
  }
  return response.json();
}

export async function createOrUpdateProject(project: Project): Promise<Project> {
  const response = await fetch(`${ENV.API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create/update project");
  }
  return response.json();
}