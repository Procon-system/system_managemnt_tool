// src/components/NavBar.js

import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <nav className="bg-gray-50">
      <div className="space-x-2 mb-7 border-b border-gray-300 shadow-lg pb-4">
  <Link to="/home">
    <button className="text-gray-800 bg-blue-100 px-6 py-2 mt-5 ml-2 rounded-md hover:bg-blue-200 transition">
      Home
    </button>
  </Link>
  <Link to="/create-task">
    <button className="text-gray-800 bg-blue-100  px-6 py-2 mt-5 ml-2 rounded-md hover:bg-blue-200 transition">
      + Task
    </button>
  </Link>
  <Link to="/create-facility">
    <button className="text-gray-800 bg-blue-100 px-6 py-2 mt-5 ml-2 rounded-md hover:bg-blue-200 transition">
      + Facility
    </button>
  </Link>
  <Link to="/create-machines">
    <button className="text-gray-800 bg-blue-100  px-6 py-2 mt-5 ml-2 rounded-md hover:bg-blue-200 transition">
      + Machine
    </button>
  </Link>
  <Link to="/create-tools">
    <button className="text-gray-800 bg-blue-100 px-6 py-2 mt-5 ml-2 rounded-md hover:bg-blue-200 transition">
      + Tool
    </button>
  </Link>
  <Link to="/create-materials">
    <button className="text-gray-800 bg-blue-100 px-6 py-2 mt-5 ml-2 rounded-md hover:bg-blue-200 transition">
      + Material
    </button>
  </Link>
</div>

    </nav>
  );
};

export default NavBar;
