interface ScraperConfig {
  maxHallucinationChecks: number;
  maxQualityChecks: number;
  enableHallucinationCheck: boolean;
  enableQualityCheck: boolean;
}

interface ScraperConfigFormProps {
  scraperConfig: ScraperConfig;
  onConfigChange: (config: ScraperConfig) => void;
}

const ScraperConfigForm: React.FC<ScraperConfigFormProps> = ({
  scraperConfig,
  onConfigChange,
}) => {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-medium mb-2 text-gray-100">
        Scraper Configuration
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Max Hallucination Checks</label>
          <input
            name="maxHallucinationChecks"
            type="number"
            value={scraperConfig.maxHallucinationChecks}
            onChange={(e) =>
              onConfigChange({
                ...scraperConfig,
                maxHallucinationChecks: Number(e.target.value),
              })
            }
            className="w-full p-2 border border-gray-300 rounded"
            min={0}
            max={5}
            required
          />
        </div>
        <div>
          <label className="block mb-1">Max Quality Checks</label>
          <input
            name="maxQualityChecks"
            type="number"
            value={scraperConfig.maxQualityChecks}
            onChange={(e) =>
              onConfigChange({
                ...scraperConfig,
                maxQualityChecks: Number(e.target.value),
              })
            }
            className="w-full p-2 border border-gray-300 rounded"
            min={0}
            max={5}
            required
          />
        </div>
        <div className="flex items-center">
          <input
            name="enableHallucinationCheck"
            type="checkbox"
            checked={scraperConfig.enableHallucinationCheck}
            onChange={(e) =>
              onConfigChange({
                ...scraperConfig,
                enableHallucinationCheck: e.target.checked,
              })
            }
            id="enableHallucinationCheck"
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
          />
          <label htmlFor="enableHallucinationCheck" className="text-gray-200 font-medium ml-2">
            Enable Hallucination Check
          </label>
        </div>
        <div className="flex items-center">
          <input
            name="enableQualityCheck"
            type="checkbox"
            checked={scraperConfig.enableQualityCheck}
            onChange={(e) =>
              onConfigChange({
                ...scraperConfig,
                enableQualityCheck: e.target.checked,
              })
            }
            id="enableQualityCheck"
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent-500 focus:ring-accent-500"
          />
          <label htmlFor="enableQualityCheck" className="text-gray-200 font-medium ml-2">
            Enable Quality Check
          </label>
        </div>
      </div>
    </section>
  );
};

export default ScraperConfigForm; 