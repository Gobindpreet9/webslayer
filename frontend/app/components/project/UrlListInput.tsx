import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react'; // Import icons

interface UrlListInputProps {
  initialUrls?: string[];
  inputName: string; // Name attribute for form submission
}

const UrlListInput: React.FC<UrlListInputProps> = ({ initialUrls, inputName }) => {
  const [urls, setUrls] = useState<string[]>(initialUrls || []);
  const [newUrl, setNewUrl] = useState<string>('');

  const handleAddUrl = () => {
    const trimmedUrl = newUrl.trim();

    if (!trimmedUrl) {
      alert('URL cannot be empty.');
      return;
    }

    if (urls.includes(trimmedUrl)) {
      alert('URL already exists in the list.');
      return;
    }

    try {
      const parsedUrl = new URL(trimmedUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        alert('Invalid URL: Must start with http:// or https://');
        return;
      }
      // URL is valid and not a duplicate
      setUrls([...urls, trimmedUrl]);
      setNewUrl(''); // Clear input field
    } catch (_) {
      alert('Invalid URL format.');
    }
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    setUrls(urls.filter(url => url !== urlToRemove));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission on Enter key
      handleAddUrl();
    }
  };

  return (
    <div className="space-y-2">
      {/* Render hidden inputs for each URL to be included in form submission */}
      {urls.map((url) => (
        <input key={url} type="hidden" name={inputName} value={url} />
      ))}

      {/* List of current URLs */}
      <ul className="mb-3 space-y-1 list-disc list-inside text-sm">
        {urls.length === 0 ? (
          <li className="text-gray-500 italic list-none">No URLs added yet.</li>
        ) : (
          urls.map((url) => (
            <li key={url} className="flex justify-between items-center group">
              <span className="text-gray-300 break-all">{url}</span>
              <button 
                type="button" 
                onClick={() => handleRemoveUrl(url)} 
                title="Remove URL" // Add tooltip
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-red-600 transition-colors duration-150"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Input for adding new URLs */}
      <div className="flex space-x-2">
        <input
          type="url" // Use type="url" for basic browser validation
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a website URL (e.g., https://example.com)"
          className="flex-grow p-2 border rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <button 
          type="button" 
          onClick={handleAddUrl} 
          title="Add new URL input" // Add tooltip
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm shadow-sm transition duration-150 ease-in-out"
        >
          <Plus size={16} className="mr-1" /> Add URL
        </button>
      </div>
    </div>
  );
};

export default UrlListInput;
