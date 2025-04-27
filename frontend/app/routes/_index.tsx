import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import Layout from "~/components/layout/Layout";

export const meta: MetaFunction = () => {
  return [
    { title: "WebSlayer Projects" }, // Updated title
    { name: "description", content: "Manage your web scraping projects" }, // Updated description
  ];
};

// Placeholder type for Project data - replace with actual type from backend
type Project = {
  id: string;
  name: string;
  description?: string; // Optional description
  lastRun?: string; // Optional: Date of last run or status
};

// TODO: Implement loader function to fetch projects from the backend API
// export async function loader() {
//   // const projects = await fetch('/api/projects').then(res => res.json());
//   const projects: Project[] = [
//     { id: 'proj_1', name: 'E-commerce Product Data', lastRun: '2024-04-25' },
//     { id: 'proj_2', name: 'News Article Summaries' },
//   ]; // Dummy data
//   return json({ projects });
// }

export default function ProjectsDashboard() {
  // TODO: Use loader data
  // const { projects } = useLoaderData<typeof loader>();
  const projects: Project[] = [
    { id: 'proj_1', name: 'E-commerce Product Data', description: 'Scrape titles and prices from online stores.', lastRun: '2024-04-25' },
    { id: 'proj_2', name: 'News Article Summaries', description: 'Extract headlines and summaries from news sites.' },
    { id: 'proj_3', name: 'Real Estate Listings', description: 'Gather property details from listings.' },
  ]; // Dummy data for layout

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">My Projects</h1>
          {/* TODO: Link this button to a project creation route/modal */}
          <Link
            to={`/projects/new`} // Assuming '/projects/new' is the route for creating a new project
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-gray-500">You don't have any projects yet. Create one to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {projects.map((project) => (
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
        )}
      </div>
    </Layout>
  );
}
