import React, { useState, useEffect } from "react";
import { Form, useFetcher } from "@remix-run/react";
import type { JobCreationResponse, CrawlConfig, ScraperConfig, LLMConfig } from "../../types/types";
import CrawlConfigForm from "./CrawlConfigForm";
import ScraperConfigForm from "./ScraperConfigForm";
import URLList from "./URLList";
import CollapsibleSection from "./CollapsibleSection";
import { useConfig } from "~/hooks/useConfig";
import { useJob } from "~/hooks/useJob";
import SchemaModal from "./SchemaModal";
import type { SchemaField } from "./SchemaModal";

type ProjectPayload = {
  name: string;
  urls: string[];
  schema_name: string;
  llm_type: LLMConfig['llm_model_type'];
  llm_model_name: string;
  crawl_config: Omit<CrawlConfig, 'enableChunking' | 'chunkSize' | 'chunkOverlap'>;
};

const Dashboard: React.FC = () => {
  const { crawlConfig, scraperConfig, llmConfig, updateCrawlConfig, updateScraperConfig, updateLLMConfig } = useConfig();
  const { jobState, updateJobState } = useJob();
  const [urls, setUrls] = useState<string[]>([""]);
  const [schema, setSchema] = useState<string>("");
  const [isList, setIsList] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [schemas, setSchemas] = useState<string[]>([]);
  const fetcher = useFetcher<any>();
  const jobFetcher = useFetcher<JobCreationResponse>();
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<ProjectPayload | null>(null);

  useEffect(() => {
    if (fetcher.state === 'idle' && lastSubmittedPayload) {
      if (fetcher.data && !fetcher.data.message) {
        console.log("Project saved successfully:", fetcher.data);
        alert(`Project '${fetcher.data.name}' saved successfully! Now attempting to start job...`);

        jobFetcher.submit(lastSubmittedPayload, {
          method: "POST",
          action: "/scrape",
          encType: "application/json",
        });
      } else if (fetcher.data && fetcher.data.message) {
        const errorMsg = `Error saving project: ${fetcher.data.message}${fetcher.data.detail ? ` - ${fetcher.data.detail}` : ''}`;
        console.error(errorMsg);
        alert(errorMsg);
      }
      setLastSubmittedPayload(null);
    }
  }, [fetcher.state, fetcher.data, lastSubmittedPayload, jobFetcher]);

  useEffect(() => {
    const jobData = jobFetcher.data as any;
    if (jobFetcher.state === 'idle' && jobData) {
      console.log("Job Fetcher finished. Data:", jobData);
      if ('job_id' in jobData) {
        console.log("Job started successfully with ID:", jobData.job_id);
        updateJobState({
          jobId: jobData.job_id,
          status: {
            status: "accepted",
          },
        });
        alert("Scraping job started successfully!");
      } else if ('error' in jobData) {
        const errorMsg = `Error starting job: ${jobData.error}`;
        console.error(errorMsg);
        alert(errorMsg);
      }
    }
  }, [jobFetcher.state, jobFetcher.data, updateJobState]);

  useEffect(() => {
    fetcher.load("/api/schema");
  }, []);

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && Array.isArray(fetcher.data)) {
      setSchemas(fetcher.data);
    }
  }, [fetcher.data, fetcher.state]);

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
    const formData = new FormData(e.target as HTMLFormElement);
    const projectName = formData.get("name") as string;
    const validUrls = urls.filter(url => url !== "" && isValidUrl(url));

    if (!projectName || projectName.trim() === "") {
      alert("Please enter a project name.");
      return;
    }
    if (validUrls.length === 0) {
      setUrlError("Please enter at least one valid URL.");
      return;
    }
    if (!schema) {
      alert("Please select a schema");
      return;
    }

    const projectPayload: ProjectPayload = {
      name: projectName.trim(),
      urls: validUrls,
      schema_name: schema,
      llm_type: llmConfig.llm_model_type,
      llm_model_name: llmConfig.llm_model_name,
      crawl_config: {
        enableCrawling: crawlConfig.enableCrawling,
        maxDepth: crawlConfig.maxDepth,
        maxUrls: crawlConfig.maxUrls,
      },
    };

    setLastSubmittedPayload(projectPayload);

    fetcher.submit(projectPayload, {
      method: "POST",
      action: "/api/projects",
      encType: "application/json",
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
          action="/api/projects" 
          className="space-y-6"
          onSubmit={handleSubmit}
          preventScrollReset
        >
          <div className="mb-4">
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              name="name" 
              required
              className="w-full p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-accent-500 focus:border-accent-500"
              placeholder="Enter a unique name for your project"
            />
          </div>

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
                  <option value="Gemini">Gemini</option>
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
              disabled={fetcher.state !== 'idle' || jobFetcher.state !== 'idle'}
              className="w-full p-3 bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetcher.state !== 'idle' 
                ? "Saving Project..." 
                : jobFetcher.state !== 'idle' 
                  ? "Starting Job..." 
                  : "Create Project"}
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