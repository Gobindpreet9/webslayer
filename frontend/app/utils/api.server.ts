import { ENV } from "./env.server";
import type { SchemaField } from "~/types/types";
import type { JobCreationResponse, JobStatusResponse } from "~/types/types";

interface SchemaCreateRequest {
  name: string | null;
  fields: SchemaField[];
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