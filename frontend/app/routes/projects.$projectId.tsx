import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useParams, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";

import Layout from "~/components/layout/Layout";
import { startScrapeJob, getProjectByName, getSchemas } from "~/utils/api.server";
import type { Project } from "~/utils/api.server"; 

import ProjectHeader from '~/components/project/ProjectHeader';
import ProjectConfiguration from '~/components/project/ProjectConfiguration';
import ProjectResults from '~/components/project/ProjectResults';

export type ActionData = {
  success: boolean;
  message?: string;
  job_id?: string;
};

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.projectId, "Missing projectId (project name) param");
  const projectName = params.projectId; 
  console.log(`--- Loading project details for name: '${projectName}' ---`);
  try {
    const [projectDetailsData, schemasData] = await Promise.all([
      getProjectByName(projectName), 
      getSchemas() 
    ]);
    const projectDetails: Project = projectDetailsData;
    const availableSchemas: string[] = schemasData;
    return json({ projectDetails, availableSchemas });
  } catch (error) {
    console.error("Error fetching project data:", error);
    if (error instanceof Error && error.message.includes('Failed to fetch project')) {
       throw new Response("Project Not Found", { status: 404 });
    }
    throw new Response("Error loading project data", { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const enableCrawling = formData.get("crawlEnabled") === "on"; 

  const jobRequest = {
    urls: formData.getAll("urls").map(url => String(url)).filter(url => url !== ""), 
    schema_name: String(formData.get("schemaName") || ""), 
    return_schema_list: false, 
    crawl_config: enableCrawling ? {
      enable_crawling: true,
      max_depth: 2, 
      max_urls: 10, 
      enable_chunking: true, 
      chunk_size: 5000, 
      chunk_overlap: 100, 
    } : {
      enable_crawling: false,
      max_depth: 2,
      max_urls: 3,
      enable_chunking: true,
      chunk_size: 5000,
      chunk_overlap: 100
    },
    scraper_config: {
      max_hallucination_checks: 3, 
      max_quality_checks: 3, 
      enable_hallucination_check: true, 
      enable_quality_check: true, 
    },
    llm_model_type: String(formData.get("modelProvider") || ""), 
    llm_model_name: String(formData.get("modelName") || ""), 
  };

  console.log("Submitting Job Request:", jobRequest);

  try {
    const data = await startScrapeJob(jobRequest);
    console.log("Job Start Response:", data);
    return json<ActionData>({ success: true, job_id: data.job_id });
  } catch (error: any) {
    console.error("Job Start Error:", error);
    return json<ActionData>({ 
      success: false, 
      message: error.message || "Failed to start scraping job" 
    }, { status: 400 }); 
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const projectName = data?.projectDetails?.name ?? "Project";
  return [
    { title: `${projectName} - Webslayer` },
    { name: "description", content: `Configure and run the ${projectName} scraping project.` },
  ];
};

export default function ProjectView() {
  const { projectDetails, availableSchemas } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const params = useParams();
  const projectName = projectDetails?.name || params.projectId || "Unknown Project";

  return (
    <Layout>
      <ProjectHeader projectName={projectName} />
      
      <Form method="post">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          
          <ProjectConfiguration 
            projectDetails={projectDetails}
            availableSchemas={availableSchemas}
            actionData={actionData} 
          />

          <ProjectResults 
            actionData={actionData} 
          />

        </div>
      </Form>
    </Layout>
  );
}
