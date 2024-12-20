import React from "react";
import Header from "./Header";
import Dashboard from "../dashboard/Dashboard";
import PanelEditor from "../editor/PanelEditor";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <Header />
      <main className="flex flex-1 p-8 gap-8">
        <aside className="w-1/3 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
          <div className="p-6 h-full">
            <Dashboard />
          </div>
        </aside>
        <section className="w-2/3 bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-auto">
          <div className="p-6">
            <PanelEditor />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout; 