import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sites from './components/dashboard/Sites';
import SiteDetails from './components/dashboard/SiteDetails';
import ReportDetails from './components/dashboard/ReportDetails';


function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
      <Route path="/sites" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
      <Route path="/sites/:id" element={<ProtectedRoute><SiteDetails /></ProtectedRoute>} />
      <Route path="/reports/:id" element={<ProtectedRoute><ReportDetails /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}

export default App;