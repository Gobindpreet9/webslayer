import { useState, useEffect } from 'react'; 
import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator } from "@remix-run/react"; 
import Layout from "~/components/layout/Layout";
import type { Schema } from "~/types/types";
import { getAllSchemaNames, getSchema } from "~/utils/api.server";
import SchemaCards from "~/components/dashboard/SchemaCards";
import ProjectCards, { Project } from "~/components/dashboard/ProjectCards";

export const meta: MetaFunction = () => {
  return [
    { title: "WebSlayer Projects" }, 
    { name: "description", content: "Manage your web scraping projects" }, 
  ];
};

// Project type is now imported from ProjectCards component

// Define a discriminated union type for the loader data
type LoaderData =
  | { projects: Project[]; schemas: Schema[]; error: false; message?: never }
  | { projects: []; schemas: Schema[]; error: true; message: string };

// Loader function to fetch projects from the backend proxy API
export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  const apiUrl = new URL('/api/projects', request.url);
  try {
    const [projectsResponse, schemaNames] = await Promise.all([
      fetch(apiUrl.toString()),
      getAllSchemaNames()
    ]);
    // Fetch full schema details for each schema name
    let schemas: Schema[] = [];
    if (Array.isArray(schemaNames)) {
      schemas = await Promise.all(
        schemaNames.map((name: string) => getSchema(name))
      );
    }
    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      console.error(`Error fetching projects: ${projectsResponse.status} ${projectsResponse.statusText}`, errorText);
      return json({ projects: [], schemas, error: true, message: `Failed to fetch projects (${projectsResponse.status})` } satisfies LoaderData, { status: projectsResponse.status });
    }
    const projects = await projectsResponse.json();
    const safeProjects = Array.isArray(projects) ? projects : [];
    return json({ projects: safeProjects, schemas, error: false } satisfies LoaderData);
  } catch (error) {
    console.error("Network error fetching projects or schemas:", error);
    return json({ projects: [], schemas: [], error: true, message: "Could not connect to the backend to fetch projects or schemas." } satisfies LoaderData, { status: 503 });
  }
}

export default function ProjectsDashboard() {
  // Use loader data with the explicit LoaderData type
  const loaderData = useLoaderData<LoaderData>();
  const schemas = !loaderData.error ? loaderData.schemas : [];
  const projects = !loaderData.error ? loaderData.projects : [];
  // Get revalidator hook
  const revalidator = useRevalidator();

  // State for the inline new project form
  const [showInput, setShowInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const fetcher = useFetcher();

  // Handle creation success/failure
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const responseData = fetcher.data as any; 
      if (responseData.message || responseData.error || responseData.detail) {
        const errorMsg = responseData.detail || responseData.message || responseData.error || 'Unknown error';
        alert(`Error creating project: ${errorMsg}`);
      } else {
        alert(`Project '${responseData.name || newProjectName}' created successfully!`);
        setShowInput(false);
        setNewProjectName("");
        // Revalidate loader data to refresh the list
        revalidator.revalidate();
      }
    }
  }, [fetcher.state, fetcher.data, revalidator]); 

  // Handle showing the new project form
  const handleCreateProject = () => {
    setShowInput(true);
  };

  return (
    <Layout>
      <div className="container mx-auto">
        {/* Display loader error if present, using loaderData.error as type guard */}
        {loaderData.error && (
          <div className="mb-4 p-4 border border-red-700 rounded-md bg-red-900 text-red-100">
            <p className="font-bold">Error Loading Projects</p>
            {/* Access message safely because loaderData.error is true */}
            <p>{loaderData.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {/* Conditional Input Form */}
        {showInput && (
          <fetcher.Form method="post" action="/api/projects" 
              className="mb-10 flex items-center gap-2 p-4 border border-gray-700 rounded-md bg-gray-800 shadow">
              <input
                type="text"
                name="name" // Name attribute for potential non-JS fallback
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter new project name"
                required
                className="flex-grow p-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-accent-500 focus:border-accent-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={fetcher.state !== 'idle'}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out disabled:opacity-50"
              >
                {fetcher.state !== 'idle' ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowInput(false); setNewProjectName(""); }}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
              >
                Cancel
              </button>
          </fetcher.Form>
        )}

        {/* Projects Section */}
        <ProjectCards 
          projects={projects} 
          onCreateProject={handleCreateProject} 
          showCreateButton={!showInput} 
        />
        
        {/* Schema Cards Section */}
        <SchemaCards schemas={schemas} onSchemaClick={() => { /* TODO: implement navigation */ }} />
      </div>
    </Layout>
  );
}
