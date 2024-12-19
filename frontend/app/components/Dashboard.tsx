import React, { useState } from "react";

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
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings</h2>

      {/* URLs to Scrape */}
      <section className="mb-6">
        <h3 className="text-lg font-medium mb-2">URLs to Scrape</h3>
        {urls.map((url, index) => (
          <div key={index} className="flex flex-col mb-2">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                placeholder="https://example.com"
                className={`flex-1 p-2 bg-gray-700 border ${
                  urlError && index === urls.length - 1
                    ? "border-red-500"
                    : "border-gray-600"
                } text-gray-100 rounded focus:border-accent-500 focus:ring-1 focus:ring-accent-500`}
                required
              />
              {urls.length > 1 && url && !(index === urls.length - 1 && !url) && (
                <button
                  type="button"
                  onClick={() => deleteUrl(index)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  -
                </button>
              )}
              {index === urls.length - 1 && (
                <button
                  type="button"
                  onClick={addUrlField}
                  className="p-2 bg-accent-600 hover:bg-accent-700 text-white rounded transition-colors"
                  disabled={!url}
                >
                  +
                </button>
              )}
            </div>
            {urlError && index === urls.length - 1 && (
              <span className="text-red-500 text-sm mt-1">{urlError}</span>
            )}
          </div>
        ))}
      </section>

      {/* Schema Selection */}
      <section className="mb-6">
        <h3 className="text-lg font-medium mb-2">Schema</h3>
        <select
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          required
        >
          <option value="" disabled>
            Select Schema
          </option>
          {/* Replace with dynamic schema options */}
          <option value="events_schema">Events Schema</option>
          <option value="users_schema">Users Schema</option>
        </select>
      </section>

      {/* List Configuration */}
      <section className="mb-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isList}
            onChange={(e) => setIsList(e.target.checked)}
            id="isList"
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
          />
          <label htmlFor="isList" className="text-gray-200 font-medium">
            Is List
          </label>
        </div>
      </section>

      {/* Crawling Settings */}
      {isList && (
        <section className="mb-6">
          <h3 className="text-lg font-medium mb-2 text-gray-100">Crawling Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={crawlConfig.enableCrawling}
                onChange={(e) =>
                  setCrawlConfig({ ...crawlConfig, enableCrawling: e.target.checked })
                }
                id="enableCrawling"
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
              />
              <label htmlFor="enableCrawling" className="text-gray-200 font-medium">Enable Crawling</label>
            </div>

            {crawlConfig.enableCrawling && (
              <>
                <div>
                  <label className="block mb-1">Max Depth</label>
                  <input
                    type="number"
                    value={crawlConfig.maxDepth}
                    onChange={(e) =>
                      setCrawlConfig({ ...crawlConfig, maxDepth: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    min={1}
                    max={10}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Max URLs to Search</label>
                  <input
                    type="number"
                    value={crawlConfig.maxUrls}
                    onChange={(e) =>
                      setCrawlConfig({ ...crawlConfig, maxUrls: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    min={1}
                    max={1000}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={crawlConfig.enableChunking}
                    onChange={(e) =>
                      setCrawlConfig({ ...crawlConfig, enableChunking: e.target.checked })
                    }
                    id="enableChunking"
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
                  />
                  <label htmlFor="enableChunking" className="text-gray-200 font-medium">Enable Chunking</label>
                </div>
                {crawlConfig.enableChunking && (
                  <>
                    <div>
                      <label className="block mb-1">Chunk Size</label>
                      <input
                        type="number"
                        value={crawlConfig.chunkSize}
                        onChange={(e) =>
                          setCrawlConfig({ ...crawlConfig, chunkSize: Number(e.target.value) })
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                        min={1000}
                        max={1000000}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Chunk Overlap</label>
                      <input
                        type="number"
                        value={crawlConfig.chunkOverlap}
                        onChange={(e) =>
                          setCrawlConfig({ ...crawlConfig, chunkOverlap: Number(e.target.value) })
                        }
                        className="w-full p-2 border border-gray-300 rounded"
                        min={0}
                        max={100000}
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Scraper Configuration */}
      <section className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-gray-100">Scraper Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Max Hallucination Checks</label>
            <input
              type="number"
              value={scraperConfig.maxHallucinationChecks}
              onChange={(e) =>
                setScraperConfig({
                  ...scraperConfig,
                  maxHallucinationChecks: Number(e.target.value),
                })
              }
              className="w-full p-2 border border-gray-300 rounded"
              min={0}
              max={5}
              required
            />
          </div>
          <div>
            <label className="block mb-1">Max Quality Checks</label>
            <input
              type="number"
              value={scraperConfig.maxQualityChecks}
              onChange={(e) =>
                setScraperConfig({
                  ...scraperConfig,
                  maxQualityChecks: Number(e.target.value),
                })
              }
              className="w-full p-2 border border-gray-300 rounded"
              min={0}
              max={5}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={scraperConfig.enableHallucinationCheck}
              onChange={(e) =>
                setScraperConfig({
                  ...scraperConfig,
                  enableHallucinationCheck: e.target.checked,
                })
              }
              id="enableHallucinationCheck"
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
            />
            <label htmlFor="enableHallucinationCheck" className="text-gray-200 font-medium">Enable Hallucination Check</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={scraperConfig.enableQualityCheck}
              onChange={(e) =>
                setScraperConfig({
                  ...scraperConfig,
                  enableQualityCheck: e.target.checked,
                })
              }
              id="enableQualityCheck"
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
            />
            <label htmlFor="enableQualityCheck" className="text-gray-200 font-medium">Enable Quality Check</label>
          </div>
        </div>
      </section>

      {/* Start Button */}
      <div className="fixed bottom-4 left-1/3 right-1/3">
        <button
          onClick={handleStart}
          className="w-full p-3 bg-accent-600 hover:bg-accent-700 text-white rounded transition-colors"
        >
          Start Scraping
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 