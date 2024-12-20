import React from "react";
import Logo from "../../../assets/webslayer_logo.png";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 text-gray-100 p-4 flex items-center">
      <img src={Logo} alt="WebSlayer Logo" className="h-30 w-28 mr-2" />
      <h1 className="text-xl font-bold">WebSlayer Dashboard</h1>
    </header>
  );
};

export default Header; 