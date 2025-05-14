import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from "@remix-run/node";
import { getProjects, createOrUpdateProject, deleteProject } from "~/utils/api.server";
import type { Project } from "~/utils/api.server";

const handleApiError = (error: any, defaultMessage: string) => {
  console.error("API Action Error:", error);
  const message = error?.response?.data?.detail || error?.detail || error?.message || defaultMessage;
  const status = error?.response?.status || error?.status || 500;
  let errorDetail = message;
  if (Array.isArray(error?.response?.data?.detail)) {
     errorDetail = error.response.data.detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join('; ');
  }
  return json({ error: errorDetail }, { status });
};

export const loader = async ({}: LoaderFunctionArgs) => {
  try {
    const projects = await getProjects();
    return json(projects);
  } catch (error) {
    return handleApiError(error, "Failed to fetch projects");
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "POST") {
    // Existing POST logic for creating/updating projects
    try {
      const formData = await request.formData();
      const name = formData.get("name") as string;
      const urlsString = formData.get("urls") as string;
      const llm_type = formData.get("llm_type") as string;
      const llm_model_name = formData.get("llm_model_name") as string;
      const schema_name = formData.get("schema_name") as string;

      const enable_crawling = formData.get("enable_crawling") as string;
      const max_depth = formData.get("max_depth") as string;
      const max_urls = formData.get("max_urls") as string;

      const scraper_chunk_size = formData.get("scraper_config.chunk_size") as string;
      const scraper_chunk_overlap = formData.get("scraper_config.chunk_overlap") as string;

      if (!name) {
          return json({ error: "Project name is required" }, { status: 400 });
      }

      let urls: string[] = [];
      try {
          urls = JSON.parse(urlsString || '[]');
          if (!Array.isArray(urls)) throw new Error("URLs not an array");
      } catch (e) {
          urls = urlsString ? urlsString.split(',').map(u => u.trim()).filter(u => u) : [];
      }

      const payload = {
        name: name,
        urls: urls,
        llm_type: llm_type || "openai",
        llm_model_name: llm_model_name || "gpt-4",
        schema_name: schema_name,
        crawl_config: {
          enable_crawling: enable_crawling === "on",
          max_depth: max_depth ? parseInt(max_depth, 10) : 2,
          max_urls: max_urls ? parseInt(max_urls, 10) : 10,
        },
        scraper_config: {
          chunk_size: scraper_chunk_size ? parseInt(scraper_chunk_size, 10) : 1024,
          chunk_overlap: scraper_chunk_overlap ? parseInt(scraper_chunk_overlap, 10) : 200,
        }
      };

      const result = await createOrUpdateProject(payload);
      return json(result);

    } catch (error: any) {
        if (error.response) {
            console.error("Backend API Error Status:", error.response.status);
            console.error("Backend API Error Data:", JSON.stringify(error.response.data, null, 2));
            if (error.response.status === 422 && error.response.data.detail) {
                 const validationErrors = error.response.data.detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join('; ');
                 return json({ error: `Validation Error: ${validationErrors}` }, { status: 422 });
            }
            return json({ error: `API Error (${error.response.status}): ${error.response.data?.detail || error.message}` }, { status: error.response.status });
        } else if (error.request) {
            console.error("Backend API No Response:", error.request);
            return json({ error: "Could not connect to the backend API." }, { status: 503 });
        } else {
            console.error("Request Setup Error:", error.message);
            return json({ error: "Failed to send request to create project." }, { status: 500 });
        }
    }
  } else if (request.method === "DELETE") {
    try {
      const formData = await request.formData();
      const projectName = formData.get("projectName") as string;

      if (!projectName) {
        return json({ error: "Project name is required for deletion" }, { status: 400 });
      }

      await deleteProject(projectName);
      return json({ success: true, message: "Project deleted successfully" });

    } catch (error: any) {
      console.error("Delete Project Error:", error);
      return handleApiError(error, "Failed to delete project.");
    }
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};