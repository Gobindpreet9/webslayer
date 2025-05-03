import { useState, useEffect } from 'react'; 
import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useRevalidator } from "@remix-run/react"; 
import Layout from "~/components/layout/Layout";

export const meta: MetaFunction = () => {
  return [
    { title: "WebSlayer Projects" }, 
    { name: "description", content: "Manage your web scraping projects" }, 
  ];
};

// Placeholder type for Project data - replace with actual type from backend
type Project = {
  id: string;
  name: string;
  description?: string; 
  lastRun?: string; 
};

// Define a discriminated union type for the loader data
type LoaderData = 
  | { projects: Project[]; error: false; message?: never } 
  | { projects: []; error: true; message: string };

// Loader function to fetch projects from the backend proxy API
export async function loader({ request }: LoaderFunctionArgs): Promise<Response> { // Return Response for json helper
  const apiUrl = new URL('/api/projects', request.url); // Construct URL relative to request
  try {
    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      // Handle non-successful responses (like 404, 500)
      const errorText = await response.text();
      console.error(`Error fetching projects: ${response.status} ${response.statusText}`, errorText);
      return json({ projects: [], error: true, message: `Failed to fetch projects (${response.status})` } satisfies LoaderData, { status: response.status });
    }
    const projects = await response.json();
    // Ensure projects is an array, default to empty array if not
    const safeProjects = Array.isArray(projects) ? projects : [];
    // Explicitly return the success shape
    return json({ projects: safeProjects, error: false } satisfies LoaderData);
  } catch (error) {
    // Handle network errors or fetch exceptions
    console.error("Network error fetching projects:", error);
    // Explicitly return the error shape
    return json({ projects: [], error: true, message: "Could not connect to the backend to fetch projects." } satisfies LoaderData, { status: 503 });
  }
}

export default function ProjectsDashboard() {
  // Use loader data with the explicit LoaderData type
  const loaderData = useLoaderData<LoaderData>();
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

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">My Projects</h1>
          {/* Replace Link with Button */}
          {!showInput && (
             <button
               onClick={() => setShowInput(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
             >
               + New Project
             </button>
          )}
        </div>

        {/* Conditional Input Form */}
        {showInput && (
          <fetcher.Form method="post" action="/api/projects" 
              className="mb-6 flex items-center gap-2 p-4 border border-gray-700 rounded-md bg-gray-800 shadow">
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

        {/* Display loader error if present, using loaderData.error as type guard */}
        {loaderData.error && (
          <div className="mb-4 p-4 border border-red-700 rounded-md bg-red-900 text-red-100">
            <p className="font-bold">Error Loading Projects</p>
            {/* Access message safely because loaderData.error is true */}
            <p>{loaderData.message || 'An unexpected error occurred.'}</p>
          </div>
        )}

        {/* Display project list or empty state (only if no loader error) */}
        {!loaderData.error && loaderData.projects.length === 0 ? (
          <p className="text-center text-gray-500">You don't have any projects yet. Create one to get started!</p>
        ) : !loaderData.error ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Access projects safely because loaderData.error is false */}
            {loaderData.projects.map((project: Project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="block hover:no-underline">
                <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between bg-gray-800 border-gray-700">
                  <div>
                    <h2 className="text-lg font-semibold mb-2 truncate text-white">{project.name}</h2>
                    {project.description && (
                      <p className="text-sm text-gray-400 mb-3 h-10 overflow-hidden">{project.description}</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    {project.lastRun && (
                      <p className="text-xs text-gray-500">Last run: {project.lastRun}</p>
                    )}
                    {/* Optional: Add quick action button like 'Run' */}
                    <button 
                      onClick={(e) => { e.preventDefault(); alert(`TODO: Run project ${project.id}`); }} 
                      className="text-sm text-blue-500 hover:text-blue-400 font-medium"
                    >
                      Run
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null }
      </div>
    </Layout>
  );
}
