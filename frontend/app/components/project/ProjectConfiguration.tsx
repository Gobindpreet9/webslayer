import React, { useState, useMemo } from 'react';
import type { Project } from '~/utils/api.server';
import type { ActionData } from '~/routes/projects.$projectId'; 
import UrlListInput from '~/components/project/UrlListInput';
import type { LLMConfig } from '~/types/types';
import { LLM_MODEL_TYPE_OPTIONS, LLMModelType } from "~/types/types";

type ProjectConfigurationProps = {
  projectDetails: Project;
  availableSchemas: string[];
  actionData?: ActionData; 
};

const ProjectConfiguration: React.FC<ProjectConfigurationProps> = ({ 
  projectDetails, 
  availableSchemas, 
  actionData 
}) => {
  const [selectedProvider, setSelectedProvider] = useState(
    projectDetails.llm_type || ''
  );
  const [selectedModel, setSelectedModel] = useState(
    projectDetails.llm_model_name || ''
  );

  return (
    <div className="space-y-6"> 
      <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Target URLs</h2>
        <UrlListInput 
          initialUrls={projectDetails.urls || []} 
          inputName="urls" 
        />
      </div>

      <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Data Schema</h2>
        <div className="flex items-center space-x-2">
          <select 
            id="schemaName"
            name="schemaName" 
            defaultValue={projectDetails.schema_name || ''} 
            className="flex-grow p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="" disabled={!!projectDetails.schema_name}>
              -- Select a Schema --
            </option>
            {availableSchemas.map(schemaName => (
              <option key={schemaName} value={schemaName}> 
                {schemaName}
              </option>
            ))}
          </select>
          <button 
            type="button" 
            onClick={() => alert('TODO: Implement Schema Creation Modal/Form')}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium whitespace-nowrap"
          >
            Create New
          </button>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Crawling</h2>
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="crawlEnabled" 
            name="crawlEnabled" 
            defaultChecked={projectDetails.crawl_config?.enable_crawling || false} 
            className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500 mr-2 bg-gray-700"
          />
          <label htmlFor="crawlEnabled" className="text-sm text-gray-300">Enable Crawling</label> 
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">AI Model</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="modelProvider" className="block text-sm font-medium text-gray-300 mb-1">AI Provider</label>
            <select 
              id="modelProvider"
              name="modelProvider" 
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value as LLMModelType);
                setSelectedModel(""); 
              }} 
              className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="" disabled={!!selectedProvider}>
                -- Select Provider --
              </option>
              {LLM_MODEL_TYPE_OPTIONS.map(provider => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="modelName" className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
            <input 
              type="text"
              id="modelName"
              name="modelName" 
              value={selectedModel || ''} 
              onChange={(e) => setSelectedModel(e.target.value)} 
              placeholder="Enter model name (e.g., gpt-4-turbo)"
              className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-6"> 
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
        >
          Start Scraping Job
        </button>
      </div>
    </div> 
  );
};

export default ProjectConfiguration;
