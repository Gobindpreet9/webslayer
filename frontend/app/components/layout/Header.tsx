import React from "react";
import { Link } from "@remix-run/react";
import Logo from "../../../assets/webslayer_logo.png";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 text-gray-100 p-4 flex items-center">
      <Link to="/" className="flex items-center group focus:outline-none">
        <img
          src={Logo}
          alt="WebSlayer Logo"
          className="h-30 w-28 mr-2 transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
        />
        <h1 className="text-xl font-bold transition-colors duration-200 group-hover:text-blue-300 group-active:text-blue-400 group-focus:text-blue-300">
          WebSlayer Dashboard
        </h1>
      </Link>
    </header>
  );
};

export default Header;