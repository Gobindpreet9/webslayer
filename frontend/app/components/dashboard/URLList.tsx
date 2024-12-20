interface URLListProps {
  urls: string[];
  urlError: string | null;
  onUrlChange: (index: number, value: string) => void;
  onAddUrl: () => void;
  onDeleteUrl: (index: number) => void;
}

const URLList: React.FC<URLListProps> = ({
  urls,
  urlError,
  onUrlChange,
  onAddUrl,
  onDeleteUrl,
}) => {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-medium text-gray-100">URLs to Scrape</h3>
      <div className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => onUrlChange(index, e.target.value)}
                placeholder="https://example.com"
                className={`flex-1 p-2.5 bg-gray-700 border ${
                  urlError && index === urls.length - 1
                    ? "border-red-500"
                    : "border-gray-600"
                } text-gray-100 rounded-md focus:border-accent-500 focus:ring-1 focus:ring-accent-500`}
                required
              />
              {urls.length > 1 && url && !(index === urls.length - 1 && !url) && (
                <button
                  type="button"
                  onClick={() => onDeleteUrl(index)}
                  className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  -
                </button>
              )}
              {index === urls.length - 1 && (
                <button
                  type="button"
                  onClick={onAddUrl}
                  className="p-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-md transition-colors"
                  disabled={!url}
                >
                  +
                </button>
              )}
            </div>
            {urlError && index === urls.length - 1 && (
              <span className="text-red-500 text-sm">{urlError}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default URLList; 