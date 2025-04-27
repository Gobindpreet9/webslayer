import React from "react";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;