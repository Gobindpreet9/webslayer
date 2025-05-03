import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useParams, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { useState, useMemo } from 'react';

import { Pencil } from 'lucide-react'; // Import Pencil icon

import Layout from "~/components/layout/Layout";
import UrlListInput from '~/components/project/UrlListInput'; 
import { startScrapeJob } from "~/utils/api.server";
import type { JobCreationResponse } from "~/types/types";

// Define Schema type (based on backend structure)
type Schema = {
  id: string;
  name: string;
  // Potentially add fields definition here later
};

// Define Model types (based on backend structure)
type Model = {
  name: string; // e.g., 'gpt-4', 'llama2'
  provider: string; // e.g., 'OpenAI', 'Ollama'
};

// Group models by provider for easier selection
type ModelProvider = {
  name: string;
  models: Model[];
};

// TODO: Define actual ProjectDetails type based on backend API
type ProjectDetails = {
  id: string;
  name: string;
  urls: string[];
  schemaName: string | null;
  crawlEnabled: boolean;
  modelProvider: string | null;
  modelName: string | null;
  // ... other project details
};

// Placeholder loader function - replace with actual API call
export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.projectId, "Missing projectId param");
  const projectId = params.projectId;

  // TODO: Fetch project details from backend API using projectId
  // const projectDetailsData = await fetch(`/api/projects/${projectId}`).then(res => res.json());

  // TODO: Fetch available schemas from backend API
  // const schemasData = await fetch(`/api/schemas`).then(res => res.json());

  // TODO: Fetch available AI models from backend API
  // const modelsData = await fetch(`/api/models`).then(res => res.json());

  // Dummy data for now
  const projectDetails: ProjectDetails = {
    id: projectId,
    name: `Project ${projectId.replace("proj_","")}`,
    urls: [`https://example.com/${projectId}`],
    schemaName: "Default Schema",
    crawlEnabled: false,
    modelProvider: "OpenAI",
    modelName: "gpt-3.5-turbo",
  };

  const availableSchemas: Schema[] = [
    { id: 'schema_1', name: 'Default Schema' },
    { id: 'schema_2', name: 'Product Details (Title, Price, Image)' },
    { id: 'schema_3', name: 'Article Data (Headline, Author, Date)' },
  ];

  // Dummy data for AI models
  const availableModels: ModelProvider[] = [
    {
      name: 'OpenAI',
      models: [
        { name: 'gpt-4', provider: 'OpenAI' },
        { name: 'gpt-3.5-turbo', provider: 'OpenAI' },
      ]
    },
    {
      name: 'Ollama',
      models: [
        { name: 'llama2', provider: 'Ollama' },
        { name: 'mistral', provider: 'Ollama' },
      ]
    },
    // TODO: Add other providers like Claude, Gemini
  ];

  if (!projectDetails) {
    throw new Response("Project Not Found", { status: 404 });
  }

  // Return project details, schemas, and models
  return json({ projectDetails, availableSchemas, availableModels });
}

// Remix Action Function to handle form submission (start scrape job)
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const enableCrawling = formData.get("crawlEnabled") === "on"; // Checkbox value is 'on' if checked

  // TODO: Add form fields for detailed crawl/scraper config if needed
  // For now, use defaults similar to scrape.tsx
  const jobRequest = {
    urls: formData.getAll("urls").map(url => String(url)).filter(url => url !== ""), // Ensure urls are strings
    schema_name: String(formData.get("schemaName") || ""), // Get schema name
    return_schema_list: false, // TODO: Determine if this needs to be configurable
    crawl_config: enableCrawling ? {
      enable_crawling: true,
      max_depth: 2, // Default value
      max_urls: 10, // Default value
      enable_chunking: true, // Default value
      chunk_size: 5000, // Default value
      chunk_overlap: 100, // Default value
      // TODO: Read these from form if fields are added
    } : {
      enable_crawling: false,
      max_depth: 2,
      max_urls: 3,
      enable_chunking: true,
      chunk_size: 5000,
      chunk_overlap: 100
    },
    scraper_config: {
      max_hallucination_checks: 3, // Default value
      max_quality_checks: 3, // Default value
      enable_hallucination_check: true, // Default value
      enable_quality_check: true, // Default value
      // TODO: Read these from form if fields are added
    },
    llm_model_type: String(formData.get("modelProvider") || ""), // Get provider
    llm_model_name: String(formData.get("modelName") || ""), // Get model name
  };

  console.log("Submitting Job Request:", jobRequest);

  try {
    // TODO: Add validation for jobRequest fields (e.g., non-empty URLs)
    const data = await startScrapeJob(jobRequest);
    console.log("Job Start Response:", data);
    // Return success response, potentially with job ID
    return json({ success: true, job: data as JobCreationResponse }); // Add type assertion for clarity if needed
  } catch (error: any) {
    console.error("Job Start Error:", error);
    // Return error response
    return json({
      success: false,
      error: error.message || "Failed to start scraping job",
      status: "failed"
    }, {
      status: error.status || 500
    });
  }
}

// Update meta tags based on project name
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectDetails?.name ?? "Project";
  return [
    { title: `${projectName} - Webslayer` },
    { name: "description", content: `Configure and run the ${projectName} scraping project.` },
  ];
};

export default function ProjectView() {
  // Destructure availableSchemas and availableModels from loader data
  const { projectDetails, availableSchemas, availableModels } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>(); // Explicitly use the defined union type? No, Remix handles this.

  // State to manage the currently selected provider to filter models
  const [selectedProvider, setSelectedProvider] = useState(
    projectDetails.modelProvider || (availableModels.length > 0 ? availableModels[0].name : '')
  );
  
  // State for results editor
  const [isEditingResults, setIsEditingResults] = useState(false);
  const [resultsContent, setResultsContent] = useState("// Sample Results - Replace with actual fetched results\n{\n  \"title\": \"Example Product\",\n  \"price\": 99.99\n}"); // TODO: Load actual results

  // Calculate feedback message outside JSX for better type narrowing
  let feedbackMessage: React.ReactNode | null = null;
  if (actionData) {
    if (actionData.success) {
      // Only access job if it exists
      feedbackMessage = `Job started successfully! Job ID: ${'job' in actionData && actionData.job ? actionData.job.job_id : ''}`;
    } else {
      // Only access error if it exists
      feedbackMessage = `Error: ${'error' in actionData ? actionData.error : ''}`;
    }
  }

  return (
    <Layout>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{projectDetails.name}</h1>
      
      {/* Display feedback message if it exists */}
      {feedbackMessage && actionData && (
        <div className={`p-4 mb-4 rounded ${actionData.success ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'}`}>
          {feedbackMessage}
        </div>
      )}

      {/* Wrap configuration and results in a Form for potential saving/submission */}
      {/* Set form method to post to trigger the action function */}
      <Form method="post"> 
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6"> 
          {/* Column 1: Configuration */}
          <div className="space-y-6">
            {/* Section 1: URLs */}
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Target URLs</h2>
              <UrlListInput 
                initialUrls={projectDetails.urls} 
                inputName="urls" 
              />
            </div>

            {/* Section 2: Schema */}
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Data Schema</h2>
              <div className="flex items-center space-x-2">
                <select 
                  id="schemaName"
                  name="schemaName" 
                  defaultValue={projectDetails.schemaName || ''} 
                  className="flex-grow p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="" disabled={projectDetails.schemaName !== null}>
                    -- Select a Schema --
                  </option>
                  {availableSchemas.map(schema => (
                    <option key={schema.id} value={schema.name}>
                      {schema.name}
                    </option>
                  ))}
                </select>
                {/* TODO: Implement onClick handler for schema creation */}
                <button 
                  type="button" 
                  onClick={() => alert('TODO: Implement Schema Creation Modal/Form')}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium whitespace-nowrap"
                >
                  Create New
                </button>
              </div>
            </div>

            {/* Section 3: Crawling */}
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Crawling</h2>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="crawlEnabled" 
                  name="crawlEnabled" 
                  defaultChecked={projectDetails.crawlEnabled} 
                  className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="crawlEnabled" className="text-sm font-medium text-gray-300">
                  Enable crawling (follow links)
                </label>
              </div>
              {/* TODO: Add inputs for max_depth, max_urls etc. if crawling is enabled */}
            </div>

            {/* Section 4: AI Model */}
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">AI Model</h2>
              <div className="space-y-3">
                {/* Provider Selection */}
                <div>
                  <label htmlFor="modelProvider" className="block text-sm font-medium text-gray-300 mb-1">Provider</label>
                  <select 
                    id="modelProvider"
                    name="modelProvider" 
                    value={selectedProvider} // Controlled component
                    onChange={(e) => setSelectedProvider(e.target.value)} 
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="" disabled={!!selectedProvider}>
                      -- Select Provider --
                    </option>
                    {availableModels.map(provider => (
                      <option key={provider.name} value={provider.name}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Name Selection (changed to text input) */}
                <div>
                  <label htmlFor="modelName" className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                  <input 
                    type="text"
                    id="modelName"
                    name="modelName" 
                    defaultValue={projectDetails.modelName || ''} 
                    disabled={!selectedProvider}
                    placeholder={selectedProvider ? "Enter model name (e.g., gpt-4)" : "Select provider first"}
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Move Start Job button here, within the left column */}
            <div className="mt-6"> 
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
                // Using w-full for now, could also align right if preferred
              >
                Start Scraping Job
              </button>
            </div>
          </div>

          {/* Column 2: Results - Updated with Edit mode */}
          <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Results</h2>
              {!isEditingResults ? (
                <button 
                  type="button"
                  title="Edit Results"
                  onClick={() => setIsEditingResults(true)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-600 transition-colors duration-150"
                >
                  <Pencil size={18} /> 
                </button>
              ) : (
                <button 
                  // TODO: Implement save logic (likely needs another action or API call)
                  // For now, just disables editing
                  type="button" 
                  onClick={() => {
                    setIsEditingResults(false);
                    alert('TODO: Save results functionality');
                    // Potentially trigger a save action here
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm shadow-sm transition duration-150 ease-in-out"
                >
                   Save Changes
                 </button>
              )}
            </div>
            {/* TODO: Fetch and display actual results, handle loading state */}
            <textarea 
              value={resultsContent} // Use controlled component for editing
              onChange={(e) => setResultsContent(e.target.value)}
              readOnly={!isEditingResults} // Control editability
              className={`w-full flex-grow mt-2 p-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono ${!isEditingResults ? 'opacity-75' : ''}`}
              placeholder={isEditingResults ? "Edit results here..." : "(Results will appear here after a job runs)"}
            />
          </div>
        </div>
      </Form>
    </Layout>
  );
}
