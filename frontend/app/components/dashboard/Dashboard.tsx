import React, { useState, useEffect } from "react";
import { Form, useActionData } from "@remix-run/react";
import type { JobResponse, CrawlConfig, ScraperConfig, LLMConfig } from "../../types/types";
import CrawlConfigForm from "./CrawlConfigForm";
import ScraperConfigForm from "./ScraperConfigForm";
import URLList from "./URLList";
import CollapsibleSection from "./CollapsibleSection";

const Dashboard: React.FC = () => {
  const actionData = useActionData<JobResponse>();
  const [urls, setUrls] = useState<string[]>([""]);
  const [schema, setSchema] = useState<string>("");
  const [isList, setIsList] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    llm_model_type: "Ollama",
    llm_model_name: "llama3.1:8b-instruct-q5_0",
  });

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate URLs
    const validUrls = urls.filter(url => url !== "");
    if (validUrls.length === 0) {
      setUrlError("Please enter at least one valid URL");
      return;
    }

    // Validate schema
    if (!schema) {
      // #todo: add schema error state
      alert("Please select a schema");
      return;
    }

    // If validation passes, submit the form
    (e.target as HTMLFormElement).submit();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-100">Settings</h2>

        <Form 
          method="post" 
          action="/scrape" 
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <URLList 
            urls={urls}
            urlError={urlError}
            onUrlChange={handleUrlChange}
            onAddUrl={addUrlField}
            onDeleteUrl={deleteUrl}
          />

          {urls.map((url, index) => (
            <input key={index} type="hidden" name="urls" value={url} />
          ))}

          <CollapsibleSection title="Schema Selection">
            <select
              name="schema"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="w-full p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            >
              <option value="">Select Schema</option>
              <option value="events_schema">Events Schema</option>
              <option value="users_schema">Users Schema</option>
            </select>
          </CollapsibleSection>

          <CollapsibleSection title="LLM Configuration">
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Model Type</label>
                <select
                  name="llm_model_type"
                  value={llmConfig.llm_model_type}
                  onChange={(e) => setLlmConfig({...llmConfig, llm_model_type: e.target.value as LLMConfig["llm_model_type"]})}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md"
                >
                  <option value="Ollama">Ollama</option>
                  <option value="Claude">Claude</option>
                  <option value="OpenAI">OpenAI</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Model Name</label>
                <input
                  type="text"
                  name="llm_model_name"
                  value={llmConfig.llm_model_name}
                  onChange={(e) => setLlmConfig({...llmConfig, llm_model_name: e.target.value})}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md"
                />
              </div>
            </div>
          </CollapsibleSection>

          <input type="hidden" name="isList" value={String(isList)} />

          <CollapsibleSection title="Crawling Configuration">
            <CrawlConfigForm
              crawlConfig={crawlConfig}
              onConfigChange={setCrawlConfig}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Scraper Configuration">
            <ScraperConfigForm
              scraperConfig={scraperConfig}
              onConfigChange={setScraperConfig}
            />
          </CollapsibleSection>

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