import { json, type LoaderFunctionArgs } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { getJobStatus } from '~/utils/api.server'; // Safe to import here

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.jobId, 'Missing jobId parameter');
  const jobId = params.jobId;

  try {
    console.log(`[API Route] Fetching status for job: ${jobId}`);
    const status = await getJobStatus(jobId);
    return json(status);
  } catch (error: any) {
    console.error(`[API Route] Error fetching status for job ${jobId}:`, error);
    // Return error details in a standard format
    const status = error.response?.status || 500;
    const message = error.message || 'Failed to fetch job status';
    return json({ error: message, status: 'api_error' }, { status: status }); // Return an error structure
  }
}
