import { type ActionFunctionArgs, json } from "@remix-run/node"; // or cloudflare/deno

// IMPORTANT: Replace with your actual backend API URL
// It's best practice to load this from environment variables
const BACKEND_API_URL = process.env.BACKEND_URL || "http://localhost:8000"; // Default for local dev
const PROJECT_ENDPOINT = `${BACKEND_API_URL}/webslayer/projects`;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ message: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const projectData = await request.json();

    // TODO: Add validation for projectData if necessary before sending to backend

    console.log(`Attempting to save project: ${projectData?.name}`);
    const response = await fetch(PROJECT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      // Try to parse error message from backend response
      let errorDetail = "Failed to create/update project on backend";
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.detail || errorDetail;
      } catch (e) {
        // Ignore if response body is not JSON or empty
      }
      console.error(`Backend error (Save Project): ${response.status} - ${errorDetail}`);
      // Return the specific error from the backend
      return json({ message: "Backend Error", detail: errorDetail }, { status: response.status });
    }

    // Forward the successful backend response (usually the created/updated project object)
    const responseData = await response.json();
    console.log(`Project save/update successful: ${projectData?.name}, Status: ${response.status}`);
    return json(responseData, { status: response.status });

  } catch (error) {
    console.error("Error processing project creation request:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Handle JSON parsing errors or other unexpected issues
    if (error instanceof SyntaxError) {
        return json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    return json({ message: "Failed to process request", error: errorMessage }, { status: 500 });
  }
};

// Optional: Add a loader function if you need to GET projects via this route later
// export const loader = async () => { ... };
