import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useParams, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { useState, useMemo } from 'react';

import { Pencil } from 'lucide-react'; // Import Pencil icon

import Layout from "~/components/layout/Layout";
import UrlListInput from '~/components/project/UrlListInput';
// Import API functions and types - Use getProjectByName, remove getModels etc.
import { startScrapeJob, getProjectByName, getSchemas } from "~/utils/api.server";
import type { Project } from "~/utils/api.server"; // Import Project type
import type { LLMConfig, Schema } from "~/types/types"; // Import LLMConfig

// Define the expected structure of the data returned by the action function
type ActionData = {
  success: boolean;
  message?: string;
  job_id?: string;
};

// Loader function using API calls
export async function loader({ params }: LoaderFunctionArgs) {
  // Although named projectId, treat it as the project name based on user feedback
  invariant(params.projectId, "Missing projectId (project name) param");
  const projectName = params.projectId; 
  // --- Add logging --- 
  console.log(`--- Loading project details for name: '${projectName}' ---`);

  try {
    // Fetch project details and schemas concurrently. Removed models fetch.
    const [projectDetailsData, schemasData] = await Promise.all([
      getProjectByName(projectName), // Use name
      getSchemas() // Assuming this returns Schema[]
    ]);

    const projectDetails: Project = projectDetailsData;
    const availableSchemas: string[] = schemasData;

    // Return fetched data - Removed availableModels
    return json({ projectDetails, availableSchemas });

  } catch (error) {
    console.error("Error fetching project data:", error);
    // Handle specific errors, e.g., 404 Not Found
    if (error instanceof Error && error.message.includes('Failed to fetch project')) {
       throw new Response("Project Not Found", { status: 404 });
    }
    // Throw a generic server error for other issues
    throw new Response("Error loading project data", { status: 500 });
  }
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
    return json<ActionData>({ success: true, job_id: data.job_id });
  } catch (error: any) {
    console.error("Job Start Error:", error);
    // Return data matching the ActionData type
    // Status goes in the second argument (ResponseInit)
    return json<ActionData>({ 
      success: false, 
      message: error.message || "Failed to start scraping job" 
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
  // Use the Project type imported from api.server.ts - removed availableModels
  const { projectDetails, availableSchemas } = useLoaderData<{
    projectDetails: Project;
    availableSchemas: string[]; // Type set to string[]
  }>();
  // Use the local ActionData type
  const actionData = useActionData<ActionData>(); 

  // --- State Definitions --- MUST be before they are used below
  // State to manage the currently selected provider to filter models
  const [selectedProvider, setSelectedProvider] = useState(
    projectDetails.llm_config?.llm_model_type || '' // Use snake_case from Project type
  );
  // State for selected model name
  const [selectedModel, setSelectedModel] = useState(
    projectDetails.llm_config?.llm_model_name || '' // Use snake_case from Project type
  );
  // State for editable results content
  const [isEditingResults, setIsEditingResults] = useState(false);
  // Initialize results content - TODO: Fetch real results later
  const [resultsContent, setResultsContent] = useState(''); 

  // --- Derived State --- REMOVED selectedProviderModels

  // Define available LLM providers based on LLMConfig type
  // Note: This assumes LLMConfig['llm_model_type'] is a union like 'Ollama' | 'Claude' | ...
  // If the type definition changes, this needs updating.
  const availableProviders: LLMConfig['llm_model_type'][] = ['Ollama', 'Claude', 'OpenAI', 'Gemini']; // Manually list based on type

  // Reset model selection if provider changes (optional)
  // useEffect(() => {
  //   setSelectedModel(''); // Or set to the first available model?
  // }, [selectedProvider]);

  // --- Add logging to check the data --- 
  console.log('--- ProjectView Component: availableSchemas ---', availableSchemas);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">{projectDetails.name}</h1>
      {/* Display feedback from action */}
      {actionData?.success && (
        <div className="bg-green-800 border border-green-600 text-green-100 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          {/* Use optional chaining for job_id */}
          <span className="block sm:inline"> Scraping job started{actionData.job_id ? ` with ID: ${actionData.job_id}` : ''}</span>
        </div>
      )}
      {!actionData?.success && actionData?.message && (
        <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {actionData.message}</span>
        </div>
      )}

      <Form method="post">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          {/* Column 1: Configuration */}
          <div className="space-y-6">
            {/* Section 1: URLs */}
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Target URLs</h2>
              <UrlListInput 
                initialUrls={projectDetails.urls || []} 
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
                  defaultValue={projectDetails.schema_name || ''} // Use snake_case
                  className="flex-grow p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="" disabled={!!projectDetails.schema_name}>
                    -- Select a Schema --
                  </option>
                  {/* Map directly over schema names (strings) */}
                  {availableSchemas.map(schemaName => (
                    <option key={schemaName} value={schemaName}> 
                      {schemaName}
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
                  defaultChecked={projectDetails.crawl_config?.enable_crawling || false} // Use snake_case and provide default
                  className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 mr-2 bg-gray-700"
                />
                <label htmlFor="crawlEnabled" className="text-sm text-gray-300">Enable Crawling</label> {/* Corrected label text */} 
              </div>
              {/* TODO: Add inputs for max_depth, max_urls etc. if crawling is enabled */}
            </div>

            {/* Section 4: AI Model */}
            <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">AI Model</h2>
              <div className="space-y-3">
                {/* Provider Selection */}
                <div>
                  <label htmlFor="modelProvider" className="block text-sm font-medium text-gray-300 mb-1">AI Provider</label>
                  <select 
                    id="modelProvider"
                    name="modelProvider" 
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)} 
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="" disabled={!!selectedProvider}>
                      -- Select Provider --
                    </option>
                    {/* Map over providers derived from LLMConfig */}
                    {availableProviders.map(provider => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Name Selection - Changed back to text input */}
                <div>
                  <label htmlFor="modelName" className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                  <input 
                    type="text"
                    id="modelName"
                    name="modelName" 
                    value={selectedModel || ''} // Use state variable
                    onChange={(e) => setSelectedModel(e.target.value)} // Use state setter
                    placeholder="Enter model name (e.g., gpt-4-turbo)"
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
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
