
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RegisterPage from '../src/Pages/registerPage';
import LoginPage from '../src/Pages/loginPage';
import LogoutPage from '../src/Pages/logoutPage';
import TaskPage from '../src/Pages/taskPage';
import HomePage from '../src/Pages/homePage';
import ForgotPasswordPage from '../src/Pages/forgotPasswordPage';
import ResetPasswordPage from '../src/Pages/resetPasswordPage';
import ConfirmEmail from  './Components/authComponents/confirmEmail'
const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/home" element={<HomePage/>}/>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/create-task" element={<TaskPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:id/:token" element={<ResetPasswordPage/>} />
          <Route path="/confirm-email/:confirmationCode" element={<ConfirmEmail />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
