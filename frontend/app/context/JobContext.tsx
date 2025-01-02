import React, { createContext, useContext, useState, useReducer } from "react";
import type { JobCreationResponse, JobStatusResponse, CrawlConfig, ScraperConfig, LLMConfig } from "../types/types";

interface JobState {
  jobId: string | null;
  status: JobStatusResponse | null;
  responseData: any;
  isLocked: boolean;
}

interface JobContextType {
  jobState: JobState;
  crawlConfig: CrawlConfig;
  scraperConfig: ScraperConfig;
  llmConfig: LLMConfig;
  updateJobState: (state: Partial<JobState>) => void;
  updateCrawlConfig: (config: CrawlConfig) => void;
  updateScraperConfig: (config: ScraperConfig) => void;
  updateLLMConfig: (config: LLMConfig) => void;
}

const defaultJobState: JobState = {
  jobId: null,
  status: null,
  responseData: null,
  isLocked: true,
};

const defaultCrawlConfig: CrawlConfig = {
  enableCrawling: false,
  maxDepth: 2,
  maxUrls: 10,
  enableChunking: true,
  chunkSize: 15000,
  chunkOverlap: 200,
};

const defaultScraperConfig: ScraperConfig = {
  maxHallucinationChecks: 2,
  maxQualityChecks: 2,
  enableHallucinationCheck: false,
  enableQualityCheck: false,
};

const defaultLLMConfig: LLMConfig = {
  llm_model_type: "Ollama",
  llm_model_name: "llama3.1:8b-instruct-q5_0",
};

export const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [jobState, setJobState] = useState<JobState>(defaultJobState);
  const [crawlConfig, setCrawlConfig] = useState<CrawlConfig>(defaultCrawlConfig);
  const [scraperConfig, setScraperConfig] = useState<ScraperConfig>(defaultScraperConfig);
  const [llmConfig, setLLMConfig] = useState<LLMConfig>(defaultLLMConfig);

  const updateJobState = (newState: Partial<JobState>) => {
    setJobState(prev => ({ ...prev, ...newState }));
  };

  return (
    <JobContext.Provider
      value={{
        jobState,
        crawlConfig,
        scraperConfig,
        llmConfig,
        updateJobState,
        updateCrawlConfig: setCrawlConfig,
        updateScraperConfig: setScraperConfig,
        updateLLMConfig: setLLMConfig,
      }}
    >
      {children}
    </JobContext.Provider>
  );
} 