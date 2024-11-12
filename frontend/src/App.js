
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './Components/sidebarComponent';
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
import CreateToolPage from './Pages/Tool/createToolPage'
import Navbar from './Components/navbarComponents'
// ConditionalNavBar Component
const ConditionalNavBar = () => {
  const location = useLocation();
  
  // Paths where Navbar and Sidebar are not displayed
  const authPaths = ["/register", "/login", "/logout", "/forgot-password", "/reset-password", "/confirm-email"];
  
  const hideNavBar = authPaths.some(path => location.pathname.startsWith(path));

  return hideNavBar ? null : (
    <>
      <Navbar />
      <Sidebar />
    </>
  );
};

// App Component with routes
const App = () => {
  return (
    <Router>
      <ConditionalNavBar />
      <div className="pt-16"> {/* Pushes content below navbar */}
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/create-task" element={<TaskPage />} />
          <Route path="/create-facility" element={<CreateFacilityPage />} />
          <Route path="/create-machines" element={<CreateMachinePage />} />
          <Route path="/create-materials" element={<CreateMaterialPage />} />
          <Route path="/create-tools" element={<CreateToolPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:id/:token" element={<ResetPasswordPage />} />
          <Route path="/confirm-email/:confirmationCode" element={<ConfirmEmail />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;