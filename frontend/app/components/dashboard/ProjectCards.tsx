import React, { useState, useEffect } from "react";
import { Link, useFetcher } from "@remix-run/react";
import { Trash2 } from 'lucide-react';
import ConfirmationDialog from '~/components/common/ConfirmationDialog';
import Toast, { type ToastProps } from '~/components/common/Toast';
import type { Project } from '~/utils/api.server';

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
  const fetcher = useFetcher<{ success?: boolean; error?: string; message?: string }>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [projectToDeleteName, setProjectToDeleteId] = useState<string | null>(null);
  const [toastConfig, setToastConfig] = useState<Omit<ToastProps, 'onClose' | 'id'> & { show: boolean }>({
    show: false,
    message: '',
    type: 'info'
  });

  const handleOpenConfirmDialog = (projectId: string) => {
    setProjectToDeleteId(projectId);
    setShowConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setProjectToDeleteId(null);
    setShowConfirmDialog(false);
  };

  const handleDeleteConfirmed = () => {
    if (projectToDeleteName) {
      const formData = new FormData();
      formData.append('projectName', projectToDeleteName);
      fetcher.submit(formData, { method: "DELETE", action: "/api/projects" });
    }
    handleCloseConfirmDialog();
  };

  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      if (fetcher.data.success) {
        setToastConfig({
          show: true,
          message: fetcher.data.message || 'Project deleted successfully!',
          type: 'success'
        });
      } else if (fetcher.data.error) {
        setToastConfig({
          show: true,
          message: `Error: ${fetcher.data.error}`,
          type: 'error'
        });
      }
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-white">My Projects</h2>
        {showCreateButton && onCreateProject && (
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out transform hover:-translate-y-0.5"
          >
            Add Project
          </button>
        )}
      </div>

      {projects.length === 0 && !fetcher.data?.success ? ( // Check fetcher data to avoid brief "no projects" message after delete
        <p className="text-center text-gray-500 py-10 text-lg">You don't have any projects yet. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.name} className="relative group">
              <Link to={`/projects/${encodeURIComponent(project.name)}`} className="block hover:no-underline h-full">
                <div className="border rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750 transform group-hover:scale-105">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 truncate text-white">{project.name}</h3>
                    {/* {project.description && (
                      <p className="text-sm text-gray-400 mb-3 h-12 overflow-hidden leading-relaxed line-clamp-2">{project.description}</p>
                    )} */}
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenConfirmDialog(project.name);
                }}
                className="absolute top-3 right-3 p-1.5 bg-gray-700/50 hover:bg-red-600/80 text-gray-400 hover:text-white rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 group-hover:scale-100"
                aria-label={`Delete project ${project.name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleDeleteConfirmed}
        title="Delete Project"
        message={`Are you sure you want to delete the project ${projectToDeleteName}? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={fetcher.state === 'submitting' || fetcher.state === 'loading'}
      />
      <Toast
        {...toastConfig}
        onClose={() => setToastConfig(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default ProjectCards;