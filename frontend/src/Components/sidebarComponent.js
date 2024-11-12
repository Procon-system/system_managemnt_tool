
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="fixed mt-12 top-0 left-0 h-full w-64 bg-gray-50 border-r border-gray-300 shadow-lg">
      <div className="flex flex-col mt-3 space-y-2 p-4">
        <Link to="/home">
          <button className="w-full text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition">
            Home
          </button>
        </Link>
        <Link to="/create-task">
          <button className="w-full text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition">
            Task
          </button>
        </Link>
        <Link to="/create-facility">
          <button className="w-full text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition">
            Facility
          </button>
        </Link>
        <Link to="/create-machines">
          <button className="w-full text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition">
            Machine
          </button>
        </Link>
        <Link to="/create-tools">
          <button className="w-full text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition">
            Tool
          </button>
        </Link>
        <Link to="/create-materials">
          <button className="w-full text-left text-gray-800 bg-blue-100 px-4 py-3 rounded-md hover:bg-blue-200 transition">
            Material
          </button>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
