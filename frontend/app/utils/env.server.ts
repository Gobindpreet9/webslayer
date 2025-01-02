const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value == null) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const ENV = {
  API_URL: getEnvVariable('API_URL', 'http://localhost:8000/webslayer'),
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
}; 