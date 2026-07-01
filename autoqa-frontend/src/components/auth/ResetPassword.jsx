import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/fetchClient';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Grabs ?token=... from the URL
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  // If there's no token in the URL, don't even let them try to submit
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-50 font-sans p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-beige-200 text-center">
          <h2 className="text-2xl font-extrabold text-red-600 mb-4">Invalid Link</h2>
          <p className="text-brand-700 mb-6">Your password reset link is invalid or missing the secure token.</p>
          <Link to="/forgot-password" className="text-brand-600 hover:underline font-bold">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setStatus('loading');

    try {
      // Assuming your Spring Boot endpoint is /auth/reset-password
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword: password, confirmNewPassword: confirmPassword }
      });
      
      setStatus('success');
      
      // Send them to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || "Failed to reset password. The token may have expired.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige-50 font-sans p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-beige-200">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-brand-600">Set New Password</h2>
          <p className="text-brand-700 mt-2 text-sm">Please enter your new password below.</p>
        </div>

        {status === 'success' ? (
          <div className="text-center animate-text-fade">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 border border-green-200 font-medium">
              Password reset successful! Redirecting you to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-text-fade">
            
            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm border border-red-200 text-center font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-brand-600 mb-1 pl-4">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={20}
                className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-brand-300"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-600 mb-1 pl-4">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={20}
                className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-brand-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-full shadow-md transition-transform transform active:scale-95 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;