import React, { useState, useEffect } from "react";
import { Form, useActionData, useFetcher } from "@remix-run/react";
import type { JobCreationResponse, CrawlConfig, ScraperConfig, LLMConfig } from "../../types/types";
import CrawlConfigForm from "./CrawlConfigForm";
import ScraperConfigForm from "./ScraperConfigForm";
import URLList from "./URLList";
import CollapsibleSection from "./CollapsibleSection";
import { useConfig } from "~/hooks/useConfig";
import { useJob } from "~/hooks/useJob";
import SchemaModal from "./SchemaModal";
import type { SchemaField } from "./SchemaModal";

const Dashboard: React.FC = () => {
  const { crawlConfig, scraperConfig, llmConfig, updateCrawlConfig, updateScraperConfig, updateLLMConfig } = useConfig();
  const { jobState, updateJobState } = useJob();
  const [urls, setUrls] = useState<string[]>([""]);
  const [schema, setSchema] = useState<string>("");
  const [isList, setIsList] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [schemas, setSchemas] = useState<string[]>([]);
  const fetcher = useFetcher<JobCreationResponse>();

  useEffect(() => {
    console.log("fetcher.data:", fetcher.data);
    if (fetcher.data && 'job_id' in fetcher.data) {
      updateJobState({
        jobId: fetcher.data.job_id,
        status: {
          status: "accepted",
        }
      });
    }
  }, [fetcher.data]);

  useEffect(() => {
    fetcher.load("/api/schema");
  }, []);

  useEffect(() => {
    if (fetcher.data && Array.isArray(fetcher.data)) {
      setSchemas(fetcher.data);
    }
  }, [fetcher.data]);

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
    setUrls(urls.filter((_, i) => i !== index));
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
      alert("Please select a schema");
      return;
    }
  
    // Submit using fetcher instead of fetch
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("llm_model_type", llmConfig.llm_model_type);
    formData.set("llm_model_name", llmConfig.llm_model_name);
    
    fetcher.submit(formData, {
      method: "POST",
      action: "/scrape"
    });
  };

  const handleSchemaChange = (value: string) => {
    setSchema(value);
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
          preventScrollReset
        >
          <URLList 
            urls={urls}
            urlError={urlError}
            onUrlChange={handleUrlChange}
            onAddUrl={addUrlField}
            onDeleteUrl={deleteUrl}
          />

          <CollapsibleSection title="Schema Selection">
            <div className="space-y-4">
              <div className="flex gap-4">
                <select
                  name="schema"
                  value={schema}
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  className="flex-1 p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                >
                  <option value="">Select Schema</option>
                  {schemas.map((schemaName) => (
                    <option key={schemaName} value={schemaName}>
                      {schemaName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-md"
                >
                  New Schema
                </button>
              </div>
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="LLM Configuration">
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Model Type</label>
                <select
                  name="llm_model_type"
                  value={llmConfig.llm_model_type}
                  onChange={(e) => updateLLMConfig({...llmConfig, llm_model_type: e.target.value as LLMConfig["llm_model_type"]})}
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
                  onChange={(e) => updateLLMConfig({...llmConfig, llm_model_name: e.target.value})}
                  className="w-full p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md"
                />
              </div>
            </div>
          </CollapsibleSection>

          <input type="hidden" name="isList" value={String(isList)} />

          <CollapsibleSection title="Crawling Configuration">
            <CrawlConfigForm
              crawlConfig={crawlConfig}
              onConfigChange={updateCrawlConfig}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Scraper Configuration">
            <ScraperConfigForm
              scraperConfig={scraperConfig}
              onConfigChange={updateScraperConfig}
            />
          </CollapsibleSection>

          <div className="pt-6">
            <button
              type="submit"
              disabled={jobState.status?.status === "running" || jobState.status?.status === "accepted"}
              className="w-full p-3 bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {jobState.status?.status === "running" || jobState.status?.status === "accepted" 
                ? "Processing..." 
                : "Start Scraping"}
            </button>
          </div>
        </Form>

        <SchemaModal
          isOpen={isSchemaModalOpen}
          onClose={() => setIsSchemaModalOpen(false)}
          onSchemaCreated={setSchemas}
        />
      </div>
    </div>
  );
};

export default Dashboard; 