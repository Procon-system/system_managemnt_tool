// Navbar.js

import React from 'react';
import { FaBell } from 'react-icons/fa'; // Importing the notification bell icon from react-icons

// Logo Component
const Logo = () => (
  <div className="flex items-center space-x-4">
    <img src="https://cdn.pixabay.com/photo/2024/05/30/05/54/nature-8797824_640.png" alt="Logo" className="h-8 w-auto" />
    <span className="font-bold text-xl">AppName</span>
  </div>
);

// Notifications Component
const Notifications = () => (
    <button className="text-blue-600 hover:text-blue-800">
      <FaBell className="text-2xl" /> {/* Using the icon with the size class */}
    </button>
  );
// Profile Component
const Profile = () => (
  <div className="flex items-center space-x-2">
    <img
      src="https://gratisography.com/wp-content/uploads/2024/10/gratisography-cool-cat-800x525.jpg"
      alt="Profile"
      className="h-8 w-8 rounded-full object-cover border border-gray-300"
    />
    <span className="text-gray-800 font-medium">UserName</span> {/* Display user's name */}
  </div>
);

// Navbar Component
const Navbar = () => (
  <div className="fixed top-0 w-full bg-white shadow-md z-10">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <Logo />
      <div className="flex items-center space-x-6">
        <Notifications />
        <Profile />
      </div>
    </div>
  </div>
);

export default Navbar;
