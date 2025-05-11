import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/layout/Layout";
import type { Schema } from "~/types/types";
import { getAllSchemaNames, getSchema } from "~/utils/api.server";

export const meta: MetaFunction = () => {
  return [
    { title: "WebSlayer Schemas" },
    { name: "description", content: "Manage your web scraping schemas" },
  ];
};

type LoaderData =
  | { schemas: Schema[]; error: false; message?: never }
  | { schemas: []; error: true; message: string };

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    const schemaNames = await getAllSchemaNames();
    
    // Fetch full schema details for each schema name
    let schemas: Schema[] = [];
    if (Array.isArray(schemaNames)) {
      schemas = await Promise.all(
        schemaNames.map((name: string) => getSchema(name))
      );
    }
    
    return json({ schemas, error: false } satisfies LoaderData);
  } catch (error) {
    console.error("Error fetching schemas:", error);
    return json({ 
      schemas: [], 
      error: true, 
      message: "Could not connect to the backend to fetch schemas." 
    } satisfies LoaderData, { status: 503 });
  }
}

export default function SchemasDashboard() {
  const loaderData = useLoaderData<LoaderData>();
  const schemas = !loaderData.error ? loaderData.schemas : [];

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Schema Management</h1>
          <Link
            to="/schemas/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
          >
            + New Schema
          </Link>
        </div>

        {/* Display loader error if present */}
        {loaderData.error && (
          <div className="mb-4 p-4 border border-red-700 rounded-md bg-red-900 text-red-100">
            <p className="font-bold">Error Loading Schemas</p>
            <p>{loaderData.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {/* Display schemas list or empty state */}
        {!loaderData.error && schemas.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">You don't have any schemas yet.</p>
            <p className="text-gray-500">Create a schema to define the structure of data you want to extract.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemas.map((schema) => (
              <Link 
                key={schema.name} 
                to={`/schemas/${encodeURIComponent(schema.name)}`}
                className="block hover:no-underline"
              >
                <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-700">
                  <div>
                    <h2 className="text-lg font-semibold mb-2 truncate text-white">{schema.name}</h2>
                    <p className="text-sm text-gray-400 mb-2">{schema.fields.length} fields</p>
                  </div>
                  <div>
                    <ul className="text-sm text-gray-300 space-y-1 max-h-32 overflow-y-auto">
                      {schema.fields.map((field) => (
                        <li key={field.name} className="flex justify-between">
                          <span className="font-medium text-blue-300">{field.name}</span>
                          <span className="text-gray-400">{field.field_type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
