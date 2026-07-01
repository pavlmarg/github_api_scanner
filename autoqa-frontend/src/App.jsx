import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';

function App() {
  return (
    // <Routes> looks at the URL in your browser and decides which component to show
    <Routes>
      
      {/* Route 1: The Signup Page */}
      <Route path="/signup" element={<Signup />} />

      {/* Route 2: The Login Page */}
      <Route path="/login" element={<Login />}/>

      {/* Route 3: The Forgot Password Page*/}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Route 4: The Reset Password Page*/}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Route 5: The Dashboard*/}
      <Route path="/dashboard" element={ <Dashboard /> } />

      {/* Route 2: A temporary fallback. If they go to the root URL (/), send them to signup for now */}
      <Route path="/" element={<Navigate to="/signup" replace />} />
      
    </Routes>
  );
}

export default App;