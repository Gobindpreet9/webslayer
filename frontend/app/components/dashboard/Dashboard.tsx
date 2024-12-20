import React, { useState } from "react";
import CrawlConfigForm from "./CrawlConfigForm";
import ScraperConfigForm from "./ScraperConfigForm";
import URLList from "./URLList";

interface CrawlConfig {
  enableCrawling: boolean;
  maxDepth: number;
  maxUrls: number;
  enableChunking: boolean;
  chunkSize: number;
  chunkOverlap: number;
}

interface ScraperConfig {
  maxHallucinationChecks: number;
  maxQualityChecks: number;
  enableHallucinationCheck: boolean;
  enableQualityCheck: boolean;
}

const Dashboard: React.FC = () => {
  const [urls, setUrls] = useState<string[]>([""]);
  const [schema, setSchema] = useState<string>("");
  const [isList, setIsList] = useState<boolean>(false);
  const [crawlConfig, setCrawlConfig] = useState<CrawlConfig>({
    enableCrawling: false,
    maxDepth: 2,
    maxUrls: 10,
    enableChunking: true,
    chunkSize: 15000,
    chunkOverlap: 200,
  });
  const [scraperConfig, setScraperConfig] = useState<ScraperConfig>({
    maxHallucinationChecks: 2,
    maxQualityChecks: 2,
    enableHallucinationCheck: false,
    enableQualityCheck: false,
  });
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleStart = async () => {
    // Prepare the job request payload
    const jobRequest = {
      urls,
      schema_name: schema,
      return_schema_list: isList,
      // Additional configurations
      crawl_config: crawlConfig,
      scraper_config: scraperConfig,
      llm_model_type: "Ollama", // Example value
      llm_model_name: "llama3.1:8b-instruct-q5_0",
    };

    try {
      const response = await fetch("http://localhost:8000/webslayer/scrape/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobRequest),
      });
      const data = await response.json();
      if (data.status === "accepted") {
        // Handle successful job start (e.g., store job_id)
      } else {
        // Handle errors
      }
    } catch (error) {
      console.error("Error starting job:", error);
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    setUrlError(null);
  };

  const addUrlField = () => {
    const lastUrl = urls[urls.length - 1];
    try {
      new URL(lastUrl);
      setUrls([...urls, ""]);
      setUrlError(null);
    } catch {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
    }
  };

  const deleteUrl = (index: number) => {
    if (urls.length === 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-100">Settings</h2>

        <URLList 
          urls={urls}
          urlError={urlError}
          onUrlChange={handleUrlChange}
          onAddUrl={addUrlField}
          onDeleteUrl={deleteUrl}
        />

        {/* Schema Selection */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium text-gray-100">Schema</h3>
          <select
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            className="w-full p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            required
          >
            <option value="" disabled>Select Schema</option>
            <option value="events_schema">Events Schema</option>
            <option value="users_schema">Users Schema</option>
          </select>
        </section>

        {/* List Configuration */}
        <section className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isList}
              onChange={(e) => setIsList(e.target.checked)}
              id="isList"
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
            />
            <label htmlFor="isList" className="text-gray-200 font-medium">
              Is List
            </label>
          </div>
        </section>

        {isList && (
          <CrawlConfigForm
            crawlConfig={crawlConfig}
            onConfigChange={setCrawlConfig}
          />
        )}

        <ScraperConfigForm
          scraperConfig={scraperConfig}
          onConfigChange={setScraperConfig}
        />
      </div>

      {/* Start Button - Now part of the flex column layout */}
      <div className="pt-6">
        <button
          onClick={handleStart}
          className="w-full p-3 bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors font-medium"
        >
          Start Scraping
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 