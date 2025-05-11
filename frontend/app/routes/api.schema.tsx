import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { getAllSchemaNames, createSchema } from "~/utils/api.server";
import type { SchemaField } from "~/types/types";

const handleApiError = (error: any, defaultMessage: string) => {
  const message = error?.detail || defaultMessage;
  const status = error?.status || 500;
  return json({ error: message }, { status });
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const schemas = await getAllSchemaNames();
    return json(schemas);
  } catch (error) {
    return handleApiError(error, "Failed to fetch schemas");
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const nameValue = formData.get('name');
    const name = typeof nameValue === 'string' ? nameValue : null;
    const fields = JSON.parse(formData.get('fields') as string);

    const result = await createSchema({ name, fields });
    return json(result);
  } catch (error) {
    return handleApiError(error, "Failed to create schema");
  }
}