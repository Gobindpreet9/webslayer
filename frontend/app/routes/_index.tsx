import { useState, useEffect } from 'react'; 
import type { MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useRevalidator, useNavigate } from "@remix-run/react"; 
import Layout from "~/components/layout/Layout";
import type { Schema } from "~/types/types";
import { getAllSchemaNames, getSchema } from "~/utils/api.server";
import SchemaCards from "~/components/dashboard/SchemaCards";
import ProjectCards, { Project } from "~/components/dashboard/ProjectCards";
import { AnimatePresence, motion } from "framer-motion";

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
  // Get navigate hook
  const navigate = useNavigate();

  // State for the inline new project form
  const [showInput, setShowInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const fetcher = useFetcher();
  
  // State for toast notifications
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  // Handle creation success/failure
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const responseData = fetcher.data as any; 
      if (responseData.message || responseData.error || responseData.detail) {
        const errorMsg = responseData.detail || responseData.message || responseData.error || 'Unknown error';
        setNotification({
          show: true,
          message: `Error creating project: ${errorMsg}`,
          type: 'error'
        });
      } else {
        setNotification({
          show: true,
          message: `Project '${responseData.name || newProjectName}' created successfully!`,
          type: 'success'
        });
        setShowInput(false);
        setNewProjectName("");
        // Revalidate loader data to refresh the list
        revalidator.revalidate();
      }
    }
  }, [fetcher.state, fetcher.data, newProjectName]); // Removed revalidator from dependencies
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show]); 

  // Handle showing the new project form
  const handleCreateProject = () => {
    setShowInput(true);
  };

  // Handle schema click navigation
  const handleSchemaClick = (schemaName: string) => {
    navigate(`/schemas/${encodeURIComponent(schemaName)}`);
  };

  return (
    <Layout>
      {/* Toast Notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
          >
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
            </div>
            <div>{notification.message}</div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-auto text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
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
        <SchemaCards schemas={schemas} onSchemaClick={handleSchemaClick} />
      </div>
    </Layout>
  );
}
