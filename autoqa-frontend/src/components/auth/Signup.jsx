import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/fetchClient';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
  // 1. State Management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // 2. The Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: { email, password }
      });

      if (data.token) {
        login(data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: { 
          tokenId: credentialResponse.credential
        }
      });

      if (data.token) {
        login(data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError("Google authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // The main container uses the global beige background. Added overflow-hidden to contain the slide.
    <div className="min-h-screen flex bg-beige-50 font-sans overflow-hidden">
      
      {/* LEFT SIDE: The Asymmetrical Orange Field */}
      {/* Notice bg-grid-pattern is GONE from this line */}
    <div className="absolute top-0 left-0 bottom-0 hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-br-[150px] shadow-2xl overflow-hidden items-center justify-center p-12 animate-slide-to-left z-20">
        
        <div className="absolute inset-0 bg-grid-pattern opacity-50 z-0 pointer-events-none"></div>
        {/* Your existing blur circles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-black/10 rounded-full blur-3xl"></div>
        
        
        <div className="absolute top-1/4 right-8 lg:right-12 z-30 animate-text-fade">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform rotate-3 animate-float-fast">
            <div className="flex items-center gap-3">
              <div className="bg-green-400/20 p-2.5 rounded-full">
                <svg className="w-5 h-5 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs text-brand-100 font-medium">Homepage UI</p>
                <p className="text-sm font-extrabold text-white">0 Diffs Found</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- NEW: Floating Glass Card 2 (Bottom Left) --- */}
        <div className="absolute bottom-1/4 left-8 lg:left-12 z-30 animate-text-fade">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform -rotate-6 animate-float-slow">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-full">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs text-brand-100 font-medium">Visual Match</p>
                <p className="text-sm font-extrabold text-white">99.4% Perfect</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your existing text */}
        <div className="relative text-white text-center animate-text-fade z-20">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">Auto QA</h1>
          <p className="text-brand-50 text-lg max-w-xs mx-auto drop-shadow-sm">Automate your visual regression testing effortlessly.</p>
        </div>

      </div>

      {/* RIGHT SIDE: The Form Container */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 z-0 lg:ml-auto">
        
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            {/* Added an SVG logo for Auto QA */}
            <div className="flex justify-center items-center gap-2 mb-4 text-brand-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-2xl font-bold">Auto QA</span>
            </div>
            
            <h2 className="text-4xl font-extrabold text-brand-600">Create Account</h2>
          </div>

          {/* Google Sign-up Button */}
          {/* Fixed styling: Added text="signup_with" and specific width for correct layout */}
          <div className="flex justify-center mb-6 w-full">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError("Google Login was closed or failed.")} 
              theme="outline"
              size="large"
              text="signup_with"
              width="320"
            />
          </div>

          <div className="flex items-center text-center mb-6">
            <hr className="flex-grow border-brand-300" />
            <span className="mx-4 text-sm font-medium text-brand-600 uppercase tracking-widest">or</span>
            <hr className="flex-grow border-brand-300" />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200 text-center font-medium">
              {error}
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
                className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-orange"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-600 mb-1 pl-4">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={20}
                className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-orange"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-600 mb-1 pl-4">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={20}
                className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-orange"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-full shadow-md transition-transform transform active:scale-95 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
                
          </form>

          <p className="mt-8 text-center text-sm font-medium text-brand-700">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-bold relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:-bottom-1 after:left-0 after:bg-brand-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left transition-colors">
              Log in here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Signup;