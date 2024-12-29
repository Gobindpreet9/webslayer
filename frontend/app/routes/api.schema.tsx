import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { SchemaField } from "~/types/types";

const API_URL = "http://localhost:8000/webslayer/schema/";

// Helper function for error responses
const handleApiError = (error: any, defaultMessage: string) => {
  const message = error?.detail || defaultMessage;
  const status = error?.status || 500;
  return json({ error: message }, { status });
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      return handleApiError(await response.json(), "Failed to fetch schemas");
    }
    return json(await response.json());
  } catch (error) {
    return handleApiError(error, "Server error");
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const fields = JSON.parse(formData.get('fields') as string);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, fields }),
    });

    if (!response.ok) {
      return handleApiError(await response.json(), "Failed to create schema");
    }

    return json({ success: true });
  } catch (error) {
    return handleApiError(error, "Server error");
  }
}