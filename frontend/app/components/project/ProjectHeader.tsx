import React from 'react';

type ProjectHeaderProps = {
  projectName: string;
};

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ projectName }) => {
  return (
    <h1 className="text-3xl font-bold mb-6">Project: {projectName}</h1>
  );
};

export default ProjectHeader;
