
import React from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Logo Component
const Logo = () => (
  <div className="flex items-center ml-2 mt-1 sm:ml-2 space-x-2 sm:space-x-4">
    <span className="font-bold text-lg  sm:text-xl">TMT</span>
  </div>
);

// Notifications Component
const Notifications = () => (
  <button className="text-blue-600 hover:text-blue-800">
    <FaBell className="text-xl sm:text-2xl" />
  </button>
);

// Profile Component
const Profile = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
 console.log("user",user)
  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      className="flex  items-center space-x-1 sm:space-x-2 cursor-pointer"
      onClick={handleProfileClick}
    >
      {isLoggedIn ? (
        <>
          <img
            src={
              user?.profileImage ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtWEEWgiyAT_KVW1VcGhDPXe1wqDUx2e3eWMpcH5v3CgRtwRvq0ReyojDSqI5WJ2WYuWg&usqp=CAU"
            }
            alt="Profile"
            className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover border border-gray-300"
          />
          <span className="text-gray-800 font-medium text-sm sm:text-base">
            {user?.first_name}
          </span>
        </>
      ) : (
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:text-blue-800 text-sm sm:text-base"
        >
          Login
        </button>
      )}
    </div>
  );
};

// Navbar Component
const Navbar = () => (
  <div className="fixed top-0 w-full bg-white shadow-md z-10">
    <div className="container mx-auto px-4 py-2 sm:py-3 flex items-center justify-between">
      <Logo />
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Notifications />
        <Profile />
      </div>
    </div>
  </div>
);

export default Navbar;
