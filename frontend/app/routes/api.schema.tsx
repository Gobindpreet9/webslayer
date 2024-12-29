import { ActionFunctionArgs, json } from "@remix-run/node";
import { SchemaField } from "~/types/types";

export async function action({ request }: ActionFunctionArgs) {
  const API_URL = "http://localhost:8000/webslayer/schema/";

  try {
    if (request.method === "POST") {
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
        const error = await response.json();
        return json({ error: error.detail || "Failed to create schema" }, { status: response.status });
      }

      return json({ success: true });
    }

    // Handle GET request
    const response = await fetch(API_URL);
    if (!response.ok) {
      return json({ error: "Failed to fetch schemas" }, { status: response.status });
    }

    const schemas = await response.json();
    return json(schemas);
  } catch (error) {
    return json({ error: "Server error" }, { status: 500 });
  }
}