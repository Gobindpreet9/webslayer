import React from "react";
import { useJob } from "~/hooks/useJob";

const PanelEditor: React.FC = () => {
  const { jobState } = useJob();
  const { status, responseData, isLocked } = jobState;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(responseData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "response.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">Panel Editor</h2>

      {!status && (
        <div className="text-center text-gray-500 py-8">
          No job running. Start a job from the dashboard.
        </div>
      )}

      {status?.status === "accepted" && (
        <div className="text-center text-blue-500 py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2" />
          Job is queued and will start soon...
        </div>
      )}

      {status?.status === "pending" && (
        <div className="text-center text-blue-500 py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2" />
          Job is running...
        </div>
      )}

      {status?.status === "failed" && (
        <div className="text-center text-red-500 py-8">
          Error: {status.error}
        </div>
      )}

      {status?.status === "success" && responseData && (
        <div className="space-y-4">
          <textarea
            className={`w-full h-[calc(100vh-16rem)] p-4 font-mono rounded-md border ${
              isLocked 
                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed" 
                : "bg-gray-700 border-gray-600 text-gray-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            }`}
            value={JSON.stringify(responseData, null, 2)}
            readOnly={isLocked}
          />
          {!isLocked && (
            <button
              onClick={handleDownload}
              className="px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors font-medium"
            >
              Download JSON
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PanelEditor; 