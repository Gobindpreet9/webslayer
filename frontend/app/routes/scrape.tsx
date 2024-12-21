import { ActionFunctionArgs, json } from "@remix-run/node";
import type { JobResponse } from "~/types/types";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  const jobRequest = {
    urls: formData.getAll("urls").filter(url => url !== ""),
    schema_name: formData.get("schema"),
    return_schema_list: formData.get("isList") === "true",
    crawl_config: {
      enable_crawling: formData.get("enableCrawling") === "true",
      max_depth: Number(formData.get("maxDepth")),
      max_urls: Number(formData.get("maxUrls")),
      enable_chunking: formData.get("enableChunking") === "true",
      chunk_size: Number(formData.get("chunkSize")),
      chunk_overlap: Number(formData.get("chunkOverlap")),
    },
    scraper_config: {
      max_hallucination_checks: Number(formData.get("maxHallucinationChecks")),
      max_quality_checks: Number(formData.get("maxQualityChecks")),
      enable_hallucination_check: formData.get("enableHallucinationCheck") === "true",
      enable_quality_check: formData.get("enableQualityCheck") === "true",
    },
    llm_model_type: formData.get("llm_model_type"),
    llm_model_name: formData.get("llm_model_name"),
  };

  try {
    const response = await fetch("http://localhost:8000/webslayer/scrape/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jobRequest),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return json({ error: errorData.detail || "Failed to start scraping job" }, { status: response.status });
    }
    
    const data = await response.json();
    return json(data);
  } catch (error) {
    return json({ error: "Failed to start scraping job" }, { status: 500 });
  }
} 