import React from "react";
import Dashboard from "./Dashboard";
import PanelEditor from "./PanelEditor";
import Logo from "../../assets/webslayer_logo.png";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 text-gray-100 p-4 flex items-center">
        <img src={Logo} alt="WebSlayer Logo" className="h-30 w-28 mr-2" />
        <h1 className="text-xl font-bold">WebSlayer Dashboard</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 p-6 gap-6">
        {/* Sidebar Dashboard */}
        <aside className="w-1/3 bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-auto">
          <Dashboard />
        </aside>

        {/* Panel Editor */}
        <section className="w-2/3 bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-auto">
          <PanelEditor />
        </section>
      </main>
    </div>
  );
};

export default Layout; 