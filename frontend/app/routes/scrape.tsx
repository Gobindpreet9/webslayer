import { ActionFunctionArgs, json } from "@remix-run/node";
import { startScrapeJob } from "~/utils/api.server";
import type { JobCreationResponse } from "~/types/types";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const enableCrawling = formData.get("enableCrawling") === "true";
  
  const jobRequest = {
    urls: formData.getAll("urls").filter(url => url !== ""),
    schema_name: formData.get("schema"),
    return_schema_list: formData.get("isList") === "true",
    crawl_config: enableCrawling ? {
      enable_crawling: true,
      max_depth: Number(formData.get("maxDepth")),
      max_urls: Number(formData.get("maxUrls")),
      enable_chunking: formData.get("enableChunking") === "true",
      chunk_size: Number(formData.get("chunkSize")),
      chunk_overlap: Number(formData.get("chunkOverlap")),
    } : {
      enable_crawling: false,
      max_depth: 2,
      max_urls: 3,
      enable_chunking: true,
      chunk_size: 5000,
      chunk_overlap: 100
    },
    scraper_config: {
      max_hallucination_checks: Number(formData.get("maxHallucinationChecks")),
      max_quality_checks: Number(formData.get("maxQualityChecks")),
      enable_hallucination_check: formData.get("enableHallucinationCheck") === "true",
      enable_quality_check: formData.get("enableQualityCheck") === "true",
    },
    llm_model_type: String(formData.get("llm_model_type")),
    llm_model_name: String(formData.get("llm_model_name")),
  };

  try {
    const data = await startScrapeJob(jobRequest);
    return json(data);
  } catch (error: any) {
    return json({ 
      error: error.message || "Failed to start scraping job",
      status: "failed" 
    }, { 
      status: error.status || 500 
    });
  }
} 