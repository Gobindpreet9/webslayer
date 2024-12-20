import React, { useState, useEffect } from "react";
import { Form, useActionData } from "@remix-run/react";
import type { JobResponse, CrawlConfig, ScraperConfig } from "../../types/types";
import CrawlConfigForm from "./CrawlConfigForm";
import ScraperConfigForm from "./ScraperConfigForm";
import URLList from "./URLList";

const Dashboard: React.FC = () => {
  const actionData = useActionData<JobResponse>();
  const [urls, setUrls] = useState<string[]>([""]);
  const [schema, setSchema] = useState<string>("");
  const [isList, setIsList] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
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

  useEffect(() => {
    if (actionData?.status === "accepted") {
      // Handle successful job start
      console.log("Job started with ID:", actionData.job_id);
    } else if (actionData?.error) {
      // Handle error
      console.error("Error starting job:", actionData.error);
    }
  }, [actionData]);

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

        <Form method="post" action="/scrape" className="space-y-6">
          <URLList 
            urls={urls}
            urlError={urlError}
            onUrlChange={handleUrlChange}
            onAddUrl={addUrlField}
            onDeleteUrl={deleteUrl}
          />

          {/* Hidden inputs for URLs */}
          {urls.map((url, index) => (
            <input key={index} type="hidden" name="urls" value={url} />
          ))}

          {/* Schema Selection */}
          <section className="space-y-3">
            <h3 className="text-lg font-medium text-gray-100">Schema</h3>
            <select
              name="schema"
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

          <input type="hidden" name="isList" value={String(isList)} />

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

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full p-3 bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors font-medium"
            >
              Start Scraping
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Dashboard; 