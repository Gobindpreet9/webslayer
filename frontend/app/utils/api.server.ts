import { ENV } from "./env.server";
import type { SchemaField } from "~/types/types";
import type { JobCreationResponse, JobStatusResponse } from "~/types/types";

interface SchemaCreateRequest {
  name: string | null;
  fields: SchemaField[];
}

export interface CrawlConfig {
  enable_crawling: boolean;
  max_depth: number;
  max_urls: number;
}

export interface Project {
  name: string;
  urls: string[];
  llm_type: string;
  llm_model_name: string;
  schema_name?: string;
  crawl_config: CrawlConfig;
}

export interface JobRequest {
  urls: string[];
  schema_name: string;
  return_schema_list: boolean;
  crawl_config: CrawlConfig;
  llm_model_type: string;
  llm_model_name: string;
}

export async function startScrapeJob(jobRequest: JobRequest): Promise<JobCreationResponse> {
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

export async function getAllSchemaNames() {
  const response = await fetch(`${ENV.API_URL}/schema/`);
  if (!response.ok) {
    throw new Error("Failed to fetch schemas");
  }
  return response.json();
}

export async function getSchema(schemaName: string) {
  const response = await fetch(`${ENV.API_URL}/schema/${schemaName}`);
  if (!response.ok) {
    throw new Error("Failed to fetch schemas");
  }
  return response.json();
}

export async function upsertSchema({ name, fields }: SchemaCreateRequest) {
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

// Fetch a single project by its NAME
export async function getProjectByName(projectName: string): Promise<Project> {
  // Assuming endpoint uses the name, potentially URL encoded
  const encodedProjectName = encodeURIComponent(projectName);
  // TODO: Verify this is the correct backend endpoint for fetching by name
  const response = await fetch(`${ENV.API_URL}/projects/${encodedProjectName}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // Use projectName in the error message
    throw new Error(error.detail || `Failed to fetch project ${projectName} (${response.status})`);
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

export async function deleteProject(projectName: string): Promise<void> {
  const response = await fetch(`${ENV.API_URL}/projects/${projectName}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to delete project ${projectName} (${response.status})`);
  }
}
  