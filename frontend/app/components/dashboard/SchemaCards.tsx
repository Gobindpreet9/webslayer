import React from "react";
import type { Schema } from "~/types/types";

interface SchemaCardsProps {
  schemas: Schema[];
  onSchemaClick?: (schemaName: string) => void;
}

const SchemaCards: React.FC<SchemaCardsProps> = ({ schemas, onSchemaClick }) => {
  if (!schemas.length) return null;

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Available Schemas</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {schemas.map((schema) => (
          <div
            key={schema.name}
            className="cursor-pointer border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-700"
            onClick={() => onSchemaClick?.(schema.name)}
            tabIndex={0}
            role="button"
            aria-label={`Manage schema ${schema.name}`}
          >
            <h3 className="text-lg font-semibold mb-2 truncate text-white">{schema.name}</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {schema.fields.map((field) => (
                <li key={field.name}>
                  <span className="font-medium text-blue-300">{field.name}</span>
                  <span className="ml-2 text-gray-400">{field.description}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchemaCards;
