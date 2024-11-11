
// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import RegisterPage from '../src/Pages/registerPage';
// import LoginPage from '../src/Pages/loginPage';
// import LogoutPage from '../src/Pages/logoutPage';
// import TaskPage from '../src/Pages/taskPage';
// import HomePage from '../src/Pages/homePage';
// import ForgotPasswordPage from '../src/Pages/forgotPasswordPage';
// import ResetPasswordPage from '../src/Pages/resetPasswordPage';
// import ConfirmEmail from  './Components/authComponents/confirmEmail'
// const App = () => {
//   return (
//     <Router>
//       <div>
//         <Routes>
//           <Route path="/home" element={<HomePage/>}/>
//           <Route path="/register" element={<RegisterPage />} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/logout" element={<LogoutPage />} />
//           <Route path="/create-task" element={<TaskPage />} />
//           <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//           <Route path="/reset-password/:id/:token" element={<ResetPasswordPage/>} />
//           <Route path="/confirm-email/:confirmationCode" element={<ConfirmEmail />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// };

// export default App;
// App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './Components/navbarComponent';
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
const App = () => {
  return (
    <Router>
      <ConditionalNavBar />
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/create-task" element={<TaskPage />} />
        <Route path="/create-facility" element={<CreateFacilityPage/>} />
        <Route path="/create-machines" element={<CreateMachinePage/>} />
        <Route path="/create-materials" element={<CreateMaterialPage/>} />
        <Route path="/create-tools" element={<CreateToolPage/>} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:id/:token" element={<ResetPasswordPage />} />
        <Route path="/confirm-email/:confirmationCode" element={<ConfirmEmail />} />
      </Routes>
    </Router>
  );
};

// ConditionalNavBar component to hide NavBar on authentication pages
const ConditionalNavBar = () => {
  const location = useLocation();
  
  // Define paths where NavBar should not be displayed
  const authPaths = ["/register", "/login", "/logout", "/forgot-password", "/reset-password", "/confirm-email"];
  
  // Check if current location matches any auth path
  const hideNavBar = authPaths.some(path => location.pathname.startsWith(path));

  return hideNavBar ? null : <NavBar />;
};

export default App;
