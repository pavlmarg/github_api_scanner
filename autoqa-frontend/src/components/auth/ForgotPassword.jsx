import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/fetchClient';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      // Assuming your Spring Boot endpoint is /auth/forgot-password
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      
      // If it doesn't throw an error, we assume success
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || "Failed to process request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige-50 font-sans p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-beige-200">
        
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-4 text-brand-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-brand-600">Reset Password</h2>
        </div>

        {status === 'success' ? (
          <div className="text-center animate-text-fade">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 border border-green-200 font-medium">
              If an account exists for {email}, we have sent a password reset link. Please check your inbox.
            </div>
            <Link to="/login" className="inline-block w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-full shadow-md transition-transform transform active:scale-95">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-brand-700 mb-6 text-sm">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>

            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200 text-center font-medium animate-text-fade">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-brand-600 mb-1 pl-4">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-brand-300"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-full shadow-md transition-transform transform active:scale-95 disabled:bg-brand-300 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-brand-700">
              Remember your password?{' '}
              <Link to="/login" className="text-brand-600 font-bold relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:-bottom-1 after:left-0 after:bg-brand-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left transition-colors">
                Log in here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;