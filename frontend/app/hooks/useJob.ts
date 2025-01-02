import { useContext, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { JobContext } from "../context/JobContext";
import { JobStatusResponse } from "~/types/types";

export function useJob() {
  const context = useContext(JobContext);
  const fetcher = useFetcher<JobStatusResponse>();

  if (!context) {
    throw new Error("useJob must be used within a JobProvider");
  }

  const { jobState, updateJobState } = context;

  useEffect(() => {
    if (jobState.jobId) {
      const interval = setInterval(() => {
        console.log("Fetching job status");
        fetcher.load(`/api/scrape/${jobState.jobId}`);
      }, 10000);

      if (fetcher.data) {
        console.log("Job status fetched");
        console.log(fetcher.data);
        updateJobState({
          status: {
            status: fetcher.data.status,
            error: fetcher.data.error
          },
          responseData: fetcher.data.status === "success" ? fetcher.data.result : null,
          isLocked: !["success", "failed"].includes(fetcher.data.status),
        });

        if (["success", "failed"].includes(fetcher.data.status)) {
          clearInterval(interval);
        }
      }

      return () => clearInterval(interval);
    }
  }, [jobState.jobId, fetcher.data]);

  return context;
} 