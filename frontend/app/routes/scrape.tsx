import { type ActionFunctionArgs, json } from "@remix-run/node";

// Define Backend URL and specific endpoint
const BACKEND_API_URL = process.env.BACKEND_URL || "http://localhost:8000";
const JOB_ENDPOINT = `${BACKEND_API_URL}/webslayer/jobs`;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  try {
    // 1. Read the JSON payload sent from Dashboard.tsx
    const projectPayload = await request.json();

    // Optional: Add validation for projectPayload here if needed
    console.log("Received payload for /scrape:", projectPayload);

    // 2. Forward the payload to the backend job creation endpoint
    const response = await fetch(JOB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(projectPayload),
    });

    // 3. Handle backend response
    const responseData = await response.json(); // Attempt to parse JSON regardless of status

    if (!response.ok) {
      console.error(`Backend job creation error: ${response.status}`, responseData);
      // Return an error structure compatible with Dashboard's useEffect
      return json(
        {
          error: responseData.detail || `Backend Error (${response.status})`,
          status: "failed",
        },
        { status: response.status }
      );
    }

    // Job started successfully, return the backend response (should contain job_id)
    console.log("Job creation successful:", responseData);
    return json(responseData, { status: response.status });

  } catch (error: any) {
    console.error("Error processing /scrape request:", error);
    // Handle potential JSON parsing errors or network issues
    let errorMessage = "Failed to start scraping job";
    if (error instanceof SyntaxError) {
      errorMessage = "Invalid JSON payload received";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return json(
      {
        error: errorMessage,
        status: "failed",
      },
      { status: 500 }
    );
  }
};