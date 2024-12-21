import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full p-4 flex justify-between items-center bg-gray-800 hover:bg-gray-750 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-100">{title}</h3>
        <span className="text-gray-400">
          {isOpen ? "▼" : "▶"}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 bg-gray-800/50">
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection; 