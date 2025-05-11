import { useState, useEffect } from 'react';
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, Link, useActionData, useNavigate } from "@remix-run/react";
import Layout from "~/components/layout/Layout";
import type { SchemaField } from "~/types/types";
import { upsertSchema } from "~/utils/api.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Create New Schema | WebSlayer" },
    { name: "description", content: "Create a new web scraping schema" },
  ];
};

type ActionData = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  nameError?: string;
};

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  const formData = await request.formData();
  const schemaName = formData.get('schemaName')?.toString() || '';
  
  // Parse the fields data from the form
  const fieldsData = formData.get('fields');
  let fields: SchemaField[] = [];
  
  try {
    if (!schemaName.trim()) {
      return json({ nameError: 'Schema name is required' } satisfies ActionData, { status: 400 });
    }
    
    if (fieldsData) {
      fields = JSON.parse(fieldsData.toString());
    }
    
    // Validate fields
    const fieldErrors: Record<string, string> = {};
    if (fields.length === 0) {
      fieldErrors['fields'] = 'At least one field is required';
    }
    
    fields.forEach((field, index) => {
      if (!field.name) {
        fieldErrors[`field-${index}-name`] = 'Field name is required';
      }
      if (!field.field_type) {
        fieldErrors[`field-${index}-type`] = 'Field type is required';
      }
    });
    
    if (Object.keys(fieldErrors).length > 0) {
      return json({ fieldErrors } satisfies ActionData, { status: 400 });
    }
    
    // Save the schema
    await upsertSchema({ 
      name: schemaName, 
      fields 
    });
    
    return redirect('/schemas');
  } catch (error) {
    console.error('Error creating schema:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    } satisfies ActionData, { status: 500 });
  }
}

export default function NewSchema() {
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();
  
  // Local state for the schema
  const [schemaName, setSchemaName] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([]);
  
  // Field type options
  const fieldTypeOptions = [
    "string", "integer", "float", "boolean", "list", "dict", "date"
  ];
  
  // Add a new empty field
  const addField = () => {
    setFields([
      ...fields,
      {
        name: '',
        field_type: 'string',
        description: '',
        required: false
      }
    ]);
  };
  
  // Remove a field
  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };
  
  // Update a field property
  const updateField = (index: number, property: keyof SchemaField, value: any) => {
    const newFields = [...fields];
    newFields[index] = {
      ...newFields[index],
      [property]: value
    };
    setFields(newFields);
  };
  
  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Create New Schema</h1>
          <div className="flex gap-2">
            <Link
              to="/schemas"
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
            >
              Cancel
            </Link>
          </div>
        </div>
        
        {actionData?.error && (
          <div className="mb-4 p-4 border border-red-700 rounded-md bg-red-900 text-red-100">
            <p className="font-bold">Error Creating Schema</p>
            <p>{actionData.error}</p>
          </div>
        )}
        
        <Form method="post" className="space-y-6">
          <input type="hidden" name="fields" value={JSON.stringify(fields)} />
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Schema Details</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Schema Name
              </label>
              <input
                type="text"
                name="schemaName"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., product_schema, article_schema"
              />
              {actionData?.nameError && (
                <p className="text-red-500 text-sm mt-1">
                  {actionData.nameError}
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Schema Fields</h2>
            
            {fields.length === 0 ? (
              <p className="text-gray-400 mb-4">No fields defined. Add fields to define your schema structure.</p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="p-4 border border-gray-700 rounded-md bg-gray-900">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-lg font-medium">Field #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-red-500 hover:text-red-400"
                        aria-label="Remove field"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(index, 'name', e.target.value)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="e.g., title, price, author"
                        />
                        {actionData?.fieldErrors?.[`field-${index}-name`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {actionData.fieldErrors[`field-${index}-name`]}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Type
                        </label>
                        <select
                          value={field.field_type}
                          onChange={(e) => updateField(index, 'field_type', e.target.value)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select a type</option>
                          {fieldTypeOptions.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {actionData?.fieldErrors?.[`field-${index}-type`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {actionData.fieldErrors[`field-${index}-type`]}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={field.description || ''}
                          onChange={(e) => updateField(index, 'description', e.target.value)}
                          className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe what this field represents"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-300">Required</span>
                        </label>
                      </div>
                      
                      {field.field_type === 'list' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            List Item Type
                          </label>
                          <select
                            value={field.list_item_type || ''}
                            onChange={(e) => updateField(index, 'list_item_type', e.target.value)}
                            className="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a type</option>
                            {fieldTypeOptions.filter(t => t !== 'list').map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              type="button"
              onClick={addField}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded shadow-sm transition duration-150 ease-in-out"
            >
              + Add Field
            </button>
            
            {actionData?.fieldErrors?.['fields'] && (
              <p className="text-red-500 text-sm mt-2">
                {actionData.fieldErrors['fields']}
              </p>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-md transition duration-150 ease-in-out"
            >
              Create Schema
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
