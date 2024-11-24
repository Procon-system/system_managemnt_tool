// import React from 'react';
// import { FaBell } from 'react-icons/fa'; // Importing the notification bell icon from react-icons
// import { useNavigate } from 'react-router-dom'; // Importing useNavigate for navigation
// import { useSelector} from "react-redux"; // Import useSelector and useDispatch

// // Logo Component
// const Logo = () => (
//   <div className="flex items-center ml-6 space-x-4">
//     {/* <img src="https://cdn.pixabay.com/photo/2024/05/30/05/54/nature-8797824_640.png" alt="Logo" className="h-8 rounded-full w-auto" /> */}
//     <span className="font-bold text-xl">TMT </span>
//   </div>
// );

// // Notifications Component
// const Notifications = () => (
//   <button className="text-blue-600 hover:text-blue-800">
//     <FaBell className="text-2xl" /> {/* Using the icon with the size class */}
//   </button>
// );

// // Profile Component
// const Profile = () => {
//   const navigate = useNavigate(); // Hook to navigate
//   const user = useSelector((state) => state.auth.user);
//   const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

//   const handleProfileClick = () => {
//     if (isLoggedIn) {
//       navigate('/profile'); // Navigate to profile page if logged in
//     } else {
//       navigate('/login'); // Navigate to login page if not logged in
//     }
//   };


//   return (
//     <div className="flex items-center md:space-x-2 space-x-0cursor-pointer" onClick={handleProfileClick}>
//       {isLoggedIn ? (
//         <>
//           <img
//             src={user?.profileImage || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtWEEWgiyAT_KVW1VcGhDPXe1wqDUx2e3eWMpcH5v3CgRtwRvq0ReyojDSqI5WJ2WYuWg&usqp=CAU"} // Use default or user's profile image
//             alt="Profile"
//             className="h-8 w-8 rounded-full object-cover border border-gray-300"
//           />
//           <span className="text-gray-800 font-medium">{user?.first_name}</span>
//         </>
//       ) : (
//         <button
//           onClick={() => navigate('/login')}
//           className="text-blue-600 hover:text-blue-800"
//         >
//           Login
//         </button>
//       )}
//     </div>
//   );
// };

// // Navbar Component
// const Navbar = () => (
//   <div className="fixed top-0 w-full bg-white shadow-md z-10">
//     <div className="container mx-auto px-4 py-3 flex items-center justify-between">
//       <Logo />
//       <div className="flex items-center space-x-6">
//         <Notifications />
//         <Profile />
//       </div>
//     </div>
//   </div>
// );

// export default Navbar;
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
