import { useContext, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { JobContext } from "../context/JobContext";
import { JobStatusResponse } from "~/types/types";

export function useJob() {
  const context = useContext(JobContext);
  const fetcher = useFetcher<JobStatusResponse>();
  const reportFetcher = useFetcher();

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

        if (fetcher.data.status === "success" && fetcher.data.report_name) {
          // Fetch report data when job succeeds
          reportFetcher.load(`/api/reports/${fetcher.data.report_name}`);
        }

        updateJobState({
          status: {
            status: fetcher.data.status,
            error: fetcher.data.error
          },
          responseData: reportFetcher.data || null,
          isLocked: !["success", "failed"].includes(fetcher.data.status),
        });

        if (["success", "failed"].includes(fetcher.data.status)) {
          clearInterval(interval);
        }
      }

      return () => clearInterval(interval);
    }
  }, [jobState.jobId, fetcher.data, reportFetcher.data]);

  return context;
} 