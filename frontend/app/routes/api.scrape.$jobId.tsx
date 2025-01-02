import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getJobStatus } from "~/utils/api.server";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { jobId } = params;
    if (!jobId) {
      throw new Error("Job ID is required");
    }
    
    const data = await getJobStatus(jobId);
    return json(data);
  } catch (error: any) {
    return json({ 
      error: error.message || "Failed to fetch job status",
      status: "failed" 
    }, { 
      status: error.status || 500 
    });
  }
}