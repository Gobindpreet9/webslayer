import { useContext } from "react";
import { JobContext } from "../context/JobContext";

export function useConfig() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useConfig must be used within a JobProvider");
  }

  const {
    crawlConfig,
    scraperConfig,
    llmConfig,
    updateCrawlConfig,
    updateScraperConfig,
    updateLLMConfig,
  } = context;

  return {
    crawlConfig,
    scraperConfig,
    llmConfig,
    updateCrawlConfig,
    updateScraperConfig,
    updateLLMConfig,
  };
} 