import type { MetaFunction } from "@remix-run/node";
import Layout from "~/components/Layout";

export const meta: MetaFunction = () => {
  return [
    { title: "WebSlayer Dashboard" },
    { name: "description", content: "Web scraping and data extraction tool" },
  ];
};

export default function Index() {
  return <Layout />;
}
