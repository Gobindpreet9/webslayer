import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { getAllSchemaNames, upsertSchema, deleteSchema } from "~/utils/api.server";
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
  try {
    if (request.method === "POST") {
      const formData = await request.formData();
      const nameValue = formData.get('name');
      const name = typeof nameValue === 'string' ? nameValue : null;
      const fields = JSON.parse(formData.get('fields') as string) as SchemaField[];

      if (!name || fields.length === 0) {
        return json({ error: "Schema name and fields are required." }, { status: 400 });
      }

      const result = await upsertSchema({ name, fields });
      return json(result);
    } else if (request.method === "DELETE") {
      const formData = await request.formData();
      const schemaNameValue = formData.get('schemaName');
      
      if (typeof schemaNameValue !== 'string' || !schemaNameValue) {
        return json({ error: "Schema name is required for deletion." }, { status: 400 });
      }
      
      await deleteSchema(schemaNameValue);
      return json({ success: true, message: `Schema '${schemaNameValue}' deleted successfully.` });
    } else {
      return json({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error("API Schema Action Error:", error);
    return handleApiError(error, "An unexpected error occurred.");
  }
}