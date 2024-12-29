export interface JobResponse {
  job_id: string;
  status: "accepted" | "failed" | "running" | "success";
  error?: string;
  result?: any;
}

export interface CrawlConfig {
  enableCrawling: boolean;
  maxDepth: number;
  maxUrls: number;
  enableChunking: boolean;
  chunkSize: number;
  chunkOverlap: number;
}

export interface ScraperConfig {
  maxHallucinationChecks: number;
  maxQualityChecks: number;
  enableHallucinationCheck: boolean;
  enableQualityCheck: boolean;
}

export interface LLMConfig {
  llm_model_type: "Ollama" | "Claude" | "OpenAI";
  llm_model_name: string;
}

export interface SchemaField {
  name: string;
  field_type: "string" | "integer" | "float" | "boolean" | "list" | "dict" | "date";
  description?: string;
  required: boolean;
  list_item_type?: string;
  default_value?: any;
}

export interface Schema {
  name: string;
  fields: SchemaField[];
} 