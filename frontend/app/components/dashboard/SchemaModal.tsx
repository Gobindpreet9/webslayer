import React, { useState } from 'react';

export interface SchemaField {
  name: string;
  field_type: "string" | "integer" | "float" | "boolean" | "list" | "dict" | "date";
  description?: string;
  required: boolean;
  list_item_type?: string;
  default_value?: any;
}

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schema: { name: string; fields: SchemaField[] }) => void;
  isCreating?: boolean;
}

const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose, onSave, isCreating }) => {
  const [schemaName, setSchemaName] = useState("");
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!schemaName.trim()) {
      setError("Schema name is required");
      return false;
    }
    if (fields.length === 0) {
      setError("At least one field is required");
      return false;
    }
    for (const field of fields) {
      if (!field.name.trim()) {
        setError("All fields must have a name");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave({ name: schemaName, fields });
  };

  const addField = () => {
    setFields([...fields, {
      name: "",
      field_type: "string",
      required: true,
    }]);
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto mt-20">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Create New Schema</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-200 mb-2">Schema Name</label>
            <input
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
            />
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={index} className="p-4 border border-gray-700 rounded-md">
                <div className="flex justify-between">
                  <input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    className="w-1/3 p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
                  />
                  <select
                    value={field.field_type}
                    onChange={(e) => updateField(index, { field_type: e.target.value as SchemaField["field_type"] })}
                    className="w-1/3 p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100"
                  >
                    <option value="string">String</option>
                    <option value="integer">Integer</option>
                    <option value="float">Float</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                  <button
                    onClick={() => removeField(index)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addField}
            className="w-full p-2 bg-accent-600 hover:bg-accent-700 text-white rounded-md"
          >
            Add Field
          </button>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isCreating}
            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-md disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Save Schema"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemaModal; 