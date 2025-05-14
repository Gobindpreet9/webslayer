import React, { useState, useEffect } from "react";
import { Link, useFetcher } from "@remix-run/react";
import { Trash2 } from 'lucide-react';
import ConfirmationDialog from '~/components/common/ConfirmationDialog';
import Toast, { type ToastProps } from '~/components/common/Toast';
import type { Schema } from "~/types/types";

interface SchemaCardsProps {
  schemas: Schema[];
  onSchemaClick?: (schemaName: string) => void;
  showCreateButton?: boolean;
}

const SchemaCards: React.FC<SchemaCardsProps> = ({ schemas, onSchemaClick, showCreateButton = true }) => {
  const fetcher = useFetcher<{ success?: boolean; error?: string; message?: string }>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [schemaToDeleteName, setSchemaToDeleteName] = useState<string | null>(null);
  const [toastConfig, setToastConfig] = useState<Omit<ToastProps, 'onClose' | 'id'> & { show: boolean }> ({
    show: false,
    message: '',
    type: 'info'
  });

  const handleOpenConfirmDialog = (schemaName: string) => {
    setSchemaToDeleteName(schemaName);
    setShowConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setSchemaToDeleteName(null);
    setShowConfirmDialog(false);
  };

  const handleDeleteConfirmed = () => {
    if (schemaToDeleteName) {
      const formData = new FormData();
      formData.append('schemaName', schemaToDeleteName);
      // Assuming the action will be handled by a route like /api/schema
      fetcher.submit(formData, { method: "DELETE", action: "/api/schema" });
    }
    handleCloseConfirmDialog();
  };

  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      if (fetcher.data.success) {
        setToastConfig({
          show: true,
          message: fetcher.data.message || 'Schema deleted successfully!',
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

  if (!schemas.length && !fetcher.data?.success) { // Check fetcher data to avoid brief "no schemas" message after delete
    return (
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Available Schemas</h2>
          {showCreateButton && (
            <Link 
              to="/schemas/new" // Or wherever schema creation happens
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
            >
              Create Schema
            </Link>
          )}
        </div>
        <p className="text-center text-gray-500 py-10 text-lg">You don't have any schemas yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Available Schemas</h2>
        {showCreateButton && (
          <Link 
            to="/schemas/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
          >
            Manage Schemas
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {schemas.map((schema) => (
          <div 
            key={schema.name} 
            className="relative group cursor-pointer border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-700"
            onClick={(e) => {
              // Ensure clicks on the delete button don't trigger onSchemaClick
              if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button')) {
                onSchemaClick?.(schema.name);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Manage schema ${schema.name}`}
          >
            <div>
              <h3 className="text-lg font-semibold mb-2 truncate text-white">{schema.name}</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                {schema.fields.slice(0, 3).map((field) => ( // Limiting fields shown for brevity
                  <li key={field.name} className="truncate">
                    <span className="font-medium text-blue-300">{field.name}</span>
                    <span className="ml-2 text-gray-400">{field.description}</span>
                  </li>
                ))}
                {schema.fields.length > 3 && (
                  <li className="text-xs text-gray-500">...and {schema.fields.length - 3} more fields</li>
                )}
              </ul>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenConfirmDialog(schema.name);
              }}
              className="absolute top-2 right-2 p-1.5 hover:bg-red-600/80 text-gray-400 hover:text-white rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 scale-90 group-hover:scale-100"
              aria-label={`Delete schema ${schema.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleDeleteConfirmed}
        title="Delete Schema"
        message={`Are you sure you want to delete the schema ${schemaToDeleteName}? This action cannot be undone.`}
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

export default SchemaCards;
