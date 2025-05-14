import React, { useState, useEffect, useRef } from 'react';
import { useFetcher } from '@remix-run/react';
import type { ActionData } from '~/routes/projects.$projectId'; 

type ProjectResultsProps = {
  actionData?: ActionData;
};

type JobStatus = {
  status: "accepted" | "failed" | "pending" | "success" | "api_error"; 
  report_name?: string;
  error?: string;
  result?: any;
};

const ProjectResults: React.FC<ProjectResultsProps> = ({ actionData }) => {
  const fetcher = useFetcher<JobStatus>();
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentJobId, setCurrentJobId] = useState<string | null>(actionData?.job_id ?? null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isPolling, setIsPolling] = useState<boolean>(false); 

  useEffect(() => {
    const newJobId = actionData?.job_id;
    if (newJobId && newJobId !== currentJobId) {
      console.log(`New job detected: ${newJobId}. Starting poll.`);
      setCurrentJobId(newJobId);
      setJobStatus(null);
      setReport(null);
      setError(null);
      setIsLoading(true);
      setIsPolling(true); 
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current); 
      }
      fetcher.load(`/api/job-status/${newJobId}`);
    } else if (!newJobId) {
        setCurrentJobId(null);
        setJobStatus(null);
        setReport(null);
        setError(null);
        setIsLoading(false);
        setIsPolling(false);
        if (pollTimeoutRef.current) {
             clearTimeout(pollTimeoutRef.current); 
        }
    }
  }, [actionData?.job_id]); 

  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data && currentJobId) {
      const statusResult = fetcher.data;
      setJobStatus(statusResult);
      setIsLoading(false); 
      console.log(`[Fetcher Update] Job: ${currentJobId}, Status:`, statusResult);

      if (statusResult.status === 'api_error' || statusResult.error) {
        setError(statusResult.error || 'An API error occurred while fetching status.');
        setIsPolling(false);
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        return;
      } else {
         setError(null); 
      }

      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }

      if (statusResult.status === 'pending' || statusResult.status === 'accepted') {
        setIsPolling(true);
        console.log(`Status is ${statusResult.status}. Polling again in 15s for job ${currentJobId}...`);
        pollTimeoutRef.current = setTimeout(() => {
          if (currentJobId) { 
             console.log(`Polling timeout triggered for job: ${currentJobId}`);
             fetcher.load(`/api/job-status/${currentJobId}`);
          }
        }, 15000);
      } else if (statusResult.status === 'success') {
        setIsPolling(false);
        console.log(`Job ${currentJobId} succeeded.`);
        if (statusResult.report_name) {
          console.log(`Fetching report: ${statusResult.report_name}`);
          fetch(`/api/reports/${statusResult.report_name}`) 
            .then(response => {
              if (!response.ok) {
                 return response.json().then(err => { throw new Error(err.error || `Report fetch failed with status ${response.status}`) });
              }
              return response.json();
            })
            .then(reportData => {
              console.log("Received report:", reportData);
              setReport(reportData);
            })
            .catch(reportError => {
              console.error("Error fetching report:", reportError);
              setError(`Job completed, but failed to fetch report: ${reportError.message}`);
            });
        } else {
          setError("Job completed, but no report name was provided.");
        }
      } else if (statusResult.status === 'failed') {
         setError(statusResult.error || "Job failed with an unknown error.");
         setIsPolling(false);
      } else {
        setIsPolling(false);
      }
    }
  }, [fetcher.data, fetcher.state, currentJobId]);

   useEffect(() => { 
       return () => {
           if (pollTimeoutRef.current) {
               clearTimeout(pollTimeoutRef.current);
           }
       };
   }, []);

  const renderContent = () => {
    if (!currentJobId && !actionData?.job_id) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17.672l-5.25-5.25L3 14.097l6.75 6.75 12-12-1.575-1.575L9.75 17.672z" />
           </svg>
           <p className="text-sm font-medium">Ready to Scrape!</p>
           <p className="text-xs mt-1">Configure your job and click 'Start Scraping' to see results here.</p>
         </div>
      );
    }
    
    if (isLoading) {
       return (
        <div className="flex items-center justify-center p-4 flex-col space-y-2">
          <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-gray-300">Loading initial status for Job ID: {currentJobId}...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-900 border border-red-700 text-red-100 px-3 py-2 rounded relative text-sm" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-1">{error}</span>
        </div>
      );
    }

    if (!jobStatus) {
         return <p className="text-gray-400 italic text-sm">Waiting for job status...</p>;
    }

    return (
        <div className="space-y-3 text-sm flex flex-col h-full">
          {/* Top section with Job ID and Status - Restyled */}
          <div className="flex-shrink-0 border-b border-gray-700 pb-3 mb-3 flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
             {/* Job ID Section */}
             <div className="flex items-center">
               <span className="font-semibold text-gray-300 mr-2">Job ID:</span> 
               <span className="font-mono bg-gray-600 text-gray-100 px-2 py-0.5 rounded-md text-xs">{currentJobId || 'N/A'}</span>
            </div>
            {/* Status / Report Name Section (Conditional) */}
              <div className="flex items-center">
              {/* Show Report Name on Success */} 
              {jobStatus?.status === 'success' && jobStatus.report_name ? (
                 <>
                   <span className="font-semibold text-gray-300 mr-2">Report:</span>
                    <span className="font-mono bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded-md text-xs">{jobStatus.report_name}</span>
                 </>
              ) : (
                /* Show Status Otherwise */
                 <>
                   <span className="font-semibold text-gray-300 mr-2">Status:</span> 
                   <span className={`px-2 py-0.5 rounded-md text-xs font-medium 
                    ${jobStatus?.status === 'success' ? 'bg-green-700 text-green-100' : // Success (before report name shown)
                      (jobStatus?.status === 'failed' || jobStatus?.status === 'api_error') ? 'bg-red-700 text-red-100' : // Failed
                      (jobStatus?.status === 'pending' || jobStatus?.status === 'accepted') ? 'bg-blue-700 text-blue-100' : // In Progress
                      'bg-gray-600 text-gray-100' /* Default/Idle */}
                   `}>{jobStatus?.status || 'Idle'}</span>
                   {isPolling && <span className="ml-2 text-xs text-gray-400 animate-pulse">(Checking...)</span>}
                 </> 
              )}
            </div>
           </div>
          
          {/* Middle section: Animation or Report */} 
          <div className="flex-grow flex items-center justify-center overflow-hidden py-4">
            {(jobStatus.status === 'pending' || jobStatus.status === 'accepted') && (
              // Centered SVG Animation - WebSlayer Inspired
               <div className="flex flex-col items-center text-center">
                 {/* Circuit / Scan Animation with Color Cycling*/}
                 <svg width="80" height="80" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    {/* Define colors */}
                    <defs>
                       <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#818CF8', stopOpacity: 1}} /> {/* Indigo */}
                          <stop offset="100%" style={{stopColor: '#A855F7', stopOpacity: 1}} /> {/* Purple */}
                       </linearGradient>
                    </defs>
                    <g fill="none" fillRule="evenodd" strokeWidth="2">
                      {/* Outer pulsing ring - Color Cycle */}
                      <circle cx="20" cy="20" r="1">
                         {/* Radius animation */}
                         <animate attributeName="r"
                           begin="0s" dur="1.8s"
                           values="1; 20" 
                           calcMode="spline"
                           keyTimes="0; 1"
                           keySplines="0.165, 0.84, 0.44, 1"
                           repeatCount="indefinite" />
                         {/* Opacity animation */}
                         <animate attributeName="stroke-opacity"
                           begin="0s" dur="1.8s"
                           values="1; 0" 
                           calcMode="spline"
                           keyTimes="0; 1"
                           keySplines="0.3, 0.61, 0.355, 1"
                           repeatCount="indefinite" />
                          {/* Color animation */}
                         <animate attributeName="stroke"
                            begin="0s" dur="3.6s" // Slower color change cycle
                            values="#818CF8; #A855F7; #EAB308; #14B8A6; #818CF8" // Indigo -> Purple -> Yellow -> Teal -> Indigo
                            keyTimes="0; 0.25; 0.5; 0.75; 1"
                            repeatCount="indefinite" />
                      </circle>
                      {/* Inner pulsing ring - Offset Color Cycle */}
                      <circle cx="20" cy="20" r="1">
                          {/* Radius animation */}
                         <animate attributeName="r"
                           begin="-0.9s" dur="1.8s"
                           values="1; 20"
                           calcMode="spline"
                           keyTimes="0; 1"
                           keySplines="0.165, 0.84, 0.44, 1"
                           repeatCount="indefinite" />
                          {/* Opacity animation */}
                         <animate attributeName="stroke-opacity"
                           begin="-0.9s" dur="1.8s"
                           values="1; 0"
                           calcMode="spline"
                           keyTimes="0; 1"
                           keySplines="0.3, 0.61, 0.355, 1"
                           repeatCount="indefinite" />
                         {/* Color animation (Offset start) */}
                          <animate attributeName="stroke"
                            begin="-0.9s" dur="3.6s" // Same cycle length
                            values="#818CF8; #A855F7; #EAB308; #14B8A6; #818CF8" // Indigo -> Purple -> Yellow -> Teal -> Indigo
                            keyTimes="0; 0.25; 0.5; 0.75; 1"
                            repeatCount="indefinite" />
                       </circle>
                    </g>
                 </svg>
                 <p className="text-xs mt-3 animate-pulse text-gray-400">Slaying the web for data...</p> {/* Text color set explicitly */}
              </div>
            )}
            
            {jobStatus.status === 'success' && report && (
               <div className="w-full h-full mt-2 pt-3 border-t border-gray-600">
                 <h3 className="text-base font-semibold mb-1 text-green-400 flex-shrink-0">Report Data:</h3>
                 <div className="flex-grow overflow-hidden">
                   <ClientOnlyJsonView data={report} />
                 </div>
              </div>
            )}
             
             {jobStatus.status === 'success' && !report && (
               <p className="text-yellow-400 italic text-xs animate-pulse">Job succeeded, fetching report data...</p> // Should be brief
            )}
          </div>

        </div>
    );
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-800 border-gray-700 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h2 className="text-xl font-semibold">Results</h2>
        {/* Removed edit button */}
      </div>
      <div className="flex-grow mt-1 overflow-hidden">
         {renderContent()}
      </div>
    </div>
  );
};

// Dynamically load react-json-view and only render on client.
const ClientOnlyJsonView: React.FC<{ data: any }> = ({ data }) => {
  const [ReactJson, setReactJson] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import('react-json-view').then(mod => {
      if (mounted) setReactJson(() => mod.default);
    });
    return () => { mounted = false; };
  }, []);
  if (!ReactJson) {
    // Fallback: show plain JSON or spinner
    return (
      <pre className="bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto text-gray-300">
        Loading viewer...
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }
  return (
    <ReactJson
      src={data["content"]}
      name={false}
      enableClipboard={true}
      displayDataTypes={false}
      collapsed={2}
      style={{
        background: 'transparent',
        fontSize: '0.85em',
        borderRadius: '0.375rem',
        maxHeight: 'calc(100vh - 300px)',
        overflow: 'auto',
        padding: '0.5em',
        color: '#d1d5db',
      }}
      theme="monokai"
    />
  );
};

export default ProjectResults;
