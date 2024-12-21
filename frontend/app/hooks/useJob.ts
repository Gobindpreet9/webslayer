import { useContext, useEffect } from "react";
import { JobContext } from "../context/JobContext";

export function useJob() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJob must be used within a JobProvider");
  }

  const { jobState, updateJobState } = context;

  useEffect(() => {
    if (jobState.jobId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/webslayer/scrape/${jobState.jobId}`);
          const data = await res.json();
          
          updateJobState({
            status: data,
            responseData: data.result,
            isLocked: !["success", "failed"].includes(data.status),
          });

          if (["success", "failed"].includes(data.status)) {
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error fetching job status:", error);
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [jobState.jobId]);

  return context;
} 