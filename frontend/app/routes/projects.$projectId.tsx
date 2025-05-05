import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useParams, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";

import Layout from "~/components/layout/Layout";
import { startScrapeJob, getProjectByName, getSchemas, createOrUpdateProject } from "~/utils/api.server";
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

export async function action({ request, params }: ActionFunctionArgs) { 
  invariant(params.projectId, "Missing projectId (project name) param"); 
  const projectName = params.projectId;

  const formData = await request.formData();
  const enableCrawling = formData.get("crawlEnabled") === "on";
  const urls = formData.getAll("urls").map(url => String(url)).filter(url => url !== "");
  const schemaName = String(formData.get("schemaName") || "");
  const modelProvider = String(formData.get("modelProvider") || "");
  const modelName = String(formData.get("modelName") || "");

  const projectPayload: Project = {
    name: projectName,
    urls: urls,
    schema_name: schemaName || undefined,
    crawl_config: {
      enable_crawling: enableCrawling,
      max_depth: 2,
      max_urls: 10, 
    },
    llm_type: modelProvider || "",
    llm_model_name: modelName || "",
  };

  const jobRequest = {
    urls: projectPayload.urls,
    schema_name: projectPayload.schema_name,
    return_schema_list: false, 
    crawl_config: projectPayload.crawl_config,
    llm_type: projectPayload.llm_type,
    llm_model_name: projectPayload.llm_model_name,
  };

  try {
    console.log("Saving project configuration:", JSON.stringify(projectPayload, null, 2));
    await createOrUpdateProject(projectPayload);
    console.log("Project configuration saved successfully.");

    console.log("Submitting Job Request:", JSON.stringify(jobRequest, null, 2));
    const data = await startScrapeJob(jobRequest);
    console.log("Job Start Response:", data);
    return json<ActionData>({ success: true, job_id: data.job_id });

  } catch (error: any) {
    console.error("Action Error (Save Project or Start Job):", error);
    return json<ActionData>({ 
      success: false, 
      message: error.message || "Failed to save configuration or start scraping job" 
    }, { status: 500 }); 
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
