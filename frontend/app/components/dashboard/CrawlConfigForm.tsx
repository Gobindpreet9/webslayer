interface CrawlConfig {
  enableCrawling: boolean;
  maxDepth: number;
  maxUrls: number;
  enableChunking: boolean;
  chunkSize: number;
  chunkOverlap: number;
}

interface CrawlConfigFormProps {
  crawlConfig: CrawlConfig;
  onConfigChange: (config: CrawlConfig) => void;
}

const CrawlConfigForm: React.FC<CrawlConfigFormProps> = ({
  crawlConfig,
  onConfigChange,
}) => {
  return (
    <section className="mb-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            name="enableCrawling"
            checked={crawlConfig.enableCrawling}
            onChange={(e) =>
              onConfigChange({ ...crawlConfig, enableCrawling: e.target.checked })
            }
            id="enableCrawling"
            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
          />
          <label htmlFor="enableCrawling" className="text-sm font-medium text-gray-100">
            Enable Crawling
          </label>
        </div>

        {crawlConfig.enableCrawling && (
          <>
            <div>
              <label className="block mb-1">Max Depth</label>
              <input
                type="number"
                name="maxDepth"
                value={crawlConfig.maxDepth}
                onChange={(e) =>
                  onConfigChange({ ...crawlConfig, maxDepth: Math.max(1, Number(e.target.value)) })
                }
                className="w-full p-2 border border-gray-300 rounded"
                min={1}
                max={10}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Max URLs</label>
              <input
                type="number"
                name="maxUrls"
                value={crawlConfig.maxUrls}
                onChange={(e) =>
                  onConfigChange({ ...crawlConfig, maxUrls: Math.max(1, Number(e.target.value)) })
                }
                className="w-full p-2 border border-gray-300 rounded"
                min={1}
                max={1000}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Enable Chunking</label>
              <input
                type="checkbox"
                name="enableChunking"
                checked={crawlConfig.enableChunking}
                onChange={(e) =>
                  onConfigChange({ ...crawlConfig, enableChunking: e.target.checked })
                }
                id="enableChunking"
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
              />
            </div>
            <div>
              <label className="block mb-1">Chunk Size</label>
              <input
                type="number"
                name="chunkSize"
                value={crawlConfig.chunkSize}
                onChange={(e) =>
                  onConfigChange({ ...crawlConfig, chunkSize: Math.max(1000, Number(e.target.value)) })
                }
                className="w-full p-2 border border-gray-300 rounded"
                min={1000}
                max={1000000}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Chunk Overlap</label>
              <input
                type="number"
                name="chunkOverlap"
                value={crawlConfig.chunkOverlap}
                onChange={(e) =>
                  onConfigChange({ ...crawlConfig, chunkOverlap: Math.max(0, Number(e.target.value)) })
                }
                className="w-full p-2 border border-gray-300 rounded"
                min={0}
                max={100000}
                required
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CrawlConfigForm; 