import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getReport } from "~/utils/api.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const reportName = params.reportName;
  
  if (!reportName) {
    throw new Error("Report name is required");
  }

  try {
    const report = await getReport(reportName);
    return json(report);
  } catch (error: any) {
    return json({ 
      error: error.message || "Failed to fetch report",
    }, { 
      status: error.status || 500 
    });
  }
} 