

import { BrowserRouter as Router, Route, Routes, useLocation , Navigate } from 'react-router-dom';
import Sidebar from './Components/sidebarComponent';
import React, { useEffect } from 'react';
import RegisterPage from './Pages/Auth/registerPage';
import LoginPage from './Pages/Auth/loginPage';
import LogoutPage from './Pages/Auth/logoutPage';
import TaskPage from './Pages/Task/createTaskPage';
import HomePage from './Pages/homePage';
import ForgotPasswordPage from './Pages/Auth/forgotPasswordPage';
import ResetPasswordPage from './Pages/Auth/resetPasswordPage';
import ConfirmEmail from './Components/authComponents/confirmEmail';
import CreateFacilityPage from './Pages/Facility/createFacilityPage';
import CreateMachinePage from './Pages/Machine/createMachinePage';
import CreateMaterialPage from './Pages/Material/createMaterialPage';
import CreateToolPage from './Pages/Tool/createToolPage';
import FilterPage from './Pages/FilterAndReport/filterPage'
import Navbar from './Components/navbarComponents';
import ProfilePage from './Components/profileComponents';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from "./accessControl/protectedRoute";
import { ROLES } from "./accessControl/roles";
import UnauthorizedPage from "./Pages/unauthorizedPage";
import UserManagementPage from "./Pages/User/userPage"
import { useDispatch, useSelector } from 'react-redux';
// Import Redux actions for fetching global data
import { getUsers } from "./features/userSlice";
import {fetchMaterials } from "./features/materialsSlice";
import { fetchTools } from "./features/toolsSlice";
import { fetchMachines } from "./features/machineSlice";
import { fetchFacilities } from "./features/facilitySlice";

// ConditionalNavBar Component
const ConditionalNavBar = () => {
  const location = useLocation();
  
  // Paths where Navbar and Sidebar are not displayed
  const authPaths = ["/register","/login", "/logout", "/forgot-password", "/reset-password", "/confirm-email"];
  
  const hideNavBar = authPaths.some(path => location.pathname.startsWith(path));

  return hideNavBar ? null : (
    <>
      <Navbar />
      <Sidebar />
    </>
  );
};
const App = () => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
   // ✅ Fetch shared data when the app loads
   useEffect(() => {
    dispatch(getUsers());
    dispatch(fetchMaterials());
    dispatch(fetchTools());
    dispatch(fetchMachines());
    dispatch(fetchFacilities());
  }, [dispatch]);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick pauseOnFocusLoss pauseOnHover />
      <ConditionalNavBar />
      <div className="pt-16"> {/* Pushes content below navbar */}
        <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/home" /> : <Navigate to="/login" />} />

          {/* Public Routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:id/:token" element={<ResetPasswordPage />} />
          <Route path="/confirm-email/:confirmationCode" element={<ConfirmEmail />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.RANDOM_USER}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
<Route
  path="/user"
  element={
    <ProtectedRoute requiredAccessLevel={ROLES.ADMIN}>
      <UserManagementPage />
    </ProtectedRoute>
  }
/>

          <Route
            path="/create-task"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.MANAGER}>
                <TaskPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/filter-tasks"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.MANAGER}>
                <FilterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-facility"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.MANAGER}>
                <CreateFacilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-machines"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.MANAGER}>
                <CreateMachinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-materials"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.FREE}>
                <CreateMaterialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-tools"
            element={
              <ProtectedRoute requiredAccessLevel={ROLES.FREE}>
                <CreateToolPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;