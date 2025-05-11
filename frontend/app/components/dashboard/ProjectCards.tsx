import React from "react";
import { Link } from "@remix-run/react";

// Placeholder type for Project data - replace with actual type from backend
export type Project = {
  id: string;
  name: string;
  description?: string;
  lastRun?: string;
};

interface ProjectCardsProps {
  projects: Project[];
  onCreateProject?: () => void;
  showCreateButton?: boolean;
}

const ProjectCards: React.FC<ProjectCardsProps> = ({ 
  projects, 
  onCreateProject, 
  showCreateButton = true 
}) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Projects</h2>
        {showCreateButton && onCreateProject && (
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
          >
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-gray-500">You don't have any projects yet. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${encodeURIComponent(project.name)}`} className="block hover:no-underline">
              <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-700">
                <div>
                  <h3 className="text-lg font-semibold mb-2 truncate text-white">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-400 mb-3 h-10 overflow-hidden">{project.description}</p>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  {project.lastRun && (
                    <p className="text-xs text-gray-500">Last run: {project.lastRun}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectCards;
