import { useState, useEffect } from 'react';
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import Layout from "~/components/layout/Layout";
import type { Schema, SchemaField } from "~/types/types";
import { getSchema, upsertSchema } from "~/utils/api.server";
import { AnimatePresence, motion } from "framer-motion";

export const meta: MetaFunction = () => {
  return [
    { title: "Edit Schema | WebSlayer" },
    { name: "description", content: "Edit your web scraping schema" },
  ];
};

type LoaderData = {
  schema: Schema;
  error?: string;
};

type ActionData = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function loader({ params }: LoaderFunctionArgs): Promise<Response> {
  const { schemaName } = params;
  
  if (!schemaName) {
    return redirect("/schemas");
  }

  try {
    const schema = await getSchema(schemaName);
    return json({ schema } satisfies LoaderData);
  } catch (error) {
    console.error(`Error fetching schema ${schemaName}:`, error);
    return json({ 
      schema: { name: schemaName, fields: [] },
      error: `Could not load schema "${schemaName}". It may not exist.`
    } satisfies LoaderData, { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs): Promise<Response> {
  const formData = await request.formData();
  const schemaName = params.schemaName || '';
  
  // Parse the fields data from the form
  const fieldsData = formData.get('fields');
  let fields: SchemaField[] = [];
  
  try {
    if (fieldsData) {
      fields = JSON.parse(fieldsData.toString());
    }
    
    // Validate fields
    const fieldErrors: Record<string, string> = {};
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
    
    return json({ success: true } satisfies ActionData);
  } catch (error) {
    console.error('Error saving schema:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    } satisfies ActionData, { status: 500 });
  }
}

export default function EditSchema() {
  const { schema, error: loaderError } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();
  const params = useParams();
  
  // Local state for the schema fields
  const [fields, setFields] = useState<SchemaField[]>(schema.fields);
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  
  // Reset fields when schema changes
  useEffect(() => {
    setFields(schema.fields);
    setIsDirty(false);
  }, [schema]);
  
  // Show success message and navigate back
  useEffect(() => {
    if (actionData?.success) {
      setNotification({
        show: true,
        message: 'Schema saved successfully!',
        type: 'success'
      });
      
      // Navigate after a short delay to show the notification
      const timer = setTimeout(() => {
        navigate('/schemas');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [actionData, navigate]);
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show]);
  
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
    setIsDirty(true);
  };
  
  // Remove a field
  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
    setIsDirty(true);
  };
  
  // Update a field property
  const updateField = (index: number, property: keyof SchemaField, value: any) => {
    const newFields = [...fields];
    newFields[index] = {
      ...newFields[index],
      [property]: value
    };
    setFields(newFields);
    setIsDirty(true);
  };
  
  return (
    <Layout>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            {params.schemaName ? `Edit Schema: ${params.schemaName}` : 'Edit Schema'}
          </h1>
          <div className="flex gap-2">
            <Link
              to="/schemas"
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded shadow-md transition duration-150 ease-in-out"
            >
              Cancel
            </Link>
          </div>
        </div>
        
        {loaderError && (
          <div className="mb-4 p-4 border border-red-700 rounded-md bg-red-900 text-red-100">
            <p className="font-bold">Error</p>
            <p>{loaderError}</p>
          </div>
        )}
        
        {actionData?.error && (
          <div className="mb-4 p-4 border border-red-700 rounded-md bg-red-900 text-red-100">
            <p className="font-bold">Error Saving Schema</p>
            <p>{actionData.error}</p>
          </div>
        )}
        
        <Form method="post" className="space-y-6">
          <input type="hidden" name="fields" value={JSON.stringify(fields)} />
          
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
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-md transition duration-150 ease-in-out disabled:opacity-50"
            >
              Save Schema
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
