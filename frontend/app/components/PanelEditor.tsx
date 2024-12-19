import React, { useState, useEffect } from "react";

interface JobStatus {
  job_id: string;
  status: "pending" | "running" | "success" | "failed";
  result?: any;
  error?: string;
}

const PanelEditor: React.FC = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);

  useEffect(() => {
    if (jobId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/webslayer/scrape/${jobId}`);
          const data: JobStatus = await res.json();
          setStatus(data);

          if (data.status === "success") {
            setResponseData(data.result);
            setIsLocked(false);
            clearInterval(interval);
          } else if (data.status === "failed") {
            setResponseData({ error: data.error });
            setIsLocked(false);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error fetching job status:", error);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [jobId]);

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

  // Placeholder: Replace with actual job_id retrieval logic
  useEffect(() => {
    // Example: Listen for job_id updates from a global state or context
    // For demonstration, assume job_id is received via some mechanism
    // setJobId("example-job-id");
  }, []);

  if (!status) {
    return (
      <div className="text-center text-gray-500">
        No job running. Start a job from the dashboard.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Panel Editor</h2>

      {status.status === "running" && (
        <div className="text-center text-blue-500">Job is running...</div>
      )}

      {status.status === "failed" && (
        <div className="text-center text-red-500">Error: {status.error}</div>
      )}

      {status.status === "success" && responseData && (
        <div className="space-y-4">
          <textarea
            className={`w-full h-96 p-4 font-mono rounded border ${
              isLocked 
                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed" 
                : "bg-gray-700 border-gray-600 text-gray-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            }`}
            value={JSON.stringify(responseData, null, 2)}
            readOnly={isLocked}
            onChange={(e) => setResponseData(JSON.parse(e.target.value))}
          />
          {!isLocked && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded transition-colors"
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