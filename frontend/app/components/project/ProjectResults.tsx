import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import type { ActionData } from '~/routes/projects.$projectId'; // Adjust path if needed

type ProjectResultsProps = {
  actionData?: ActionData;
  // TODO: Add prop for initial results data if loaded separately
};

const ProjectResults: React.FC<ProjectResultsProps> = ({ actionData }) => {
  const [isEditingResults, setIsEditingResults] = useState(false);
  const [resultsContent, setResultsContent] = useState(""); 

  useEffect(() => {
    if (actionData?.success) {
      // Maybe clear old results or show a loading indicator?
      // setResultsContent("Job started... results pending.");
    }
  }, [actionData]);

  const handleSaveChanges = () => {
    setIsEditingResults(false);
    // TODO: Implement actual save logic
    console.log("Saving changes (TODO):", resultsContent);
    alert('TODO: Implement save results functionality. See console for current content.');
  };

  return (
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
            type="button"
            onClick={handleSaveChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm shadow-sm transition duration-150 ease-in-out"
          >
            Save Changes
          </button>
        )}
      </div>
      <textarea
        value={resultsContent}
        onChange={(e) => setResultsContent(e.target.value)}
        readOnly={!isEditingResults}
        className={`w-full flex-grow mt-2 p-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono ${!isEditingResults ? 'opacity-75' : ''}`}
        placeholder={isEditingResults ? "Edit results here..." : "(Results will appear here after a job runs)"}
      />
    </div>
  );
};

export default ProjectResults;
