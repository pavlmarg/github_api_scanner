import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../../api/fetchClient';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (data.token) {
        login(data.token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Invalid email or password.");
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

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex bg-beige-50 font-sans overflow-hidden">
      
      {/* LEFT SIDE: The Form Container */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 z-0 lg:mr-auto">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-4 text-brand-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-2xl font-bold">Auto QA</span>
            </div>
            <h2 className="text-4xl font-extrabold text-brand-600">Welcome Back</h2>
          </div>

          {/* Corrected Google Sign-in Button */}
          <div className="flex justify-center mb-6 w-full">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError("Google Login was closed or failed.")} 
              theme="outline"
              size="large"
              text="signin_with"
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
              <div className="flex justify-between items-center mb-1 px-4">
                <label className="block text-sm font-semibold text-brand-600">
                  Password
                </label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-brand-500 hover:text-brand-700 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3 border border-brand-500 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-brand-900 placeholder:text-orange"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-full shadow-md transition-transform transform active:scale-95 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-brand-700">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 font-bold relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:-bottom-1 after:left-0 after:bg-brand-600 after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left transition-colors">
              Sign up here
            </Link>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE: The Asymmetrical Orange Field (Mirrored) */}
      {/* 4. Add absolute, top-0, right-0, bottom-0, and z-20 */}
      {/* RIGHT SIDE: The Asymmetrical Orange Field (Mirrored) */}
      <div className="absolute top-0 right-0 bottom-0 hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-bl-[150px] shadow-2xl overflow-hidden items-center justify-center p-12 animate-slide-to-right z-20">
        
        {/* --- Standalone Grid Layer --- */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50 z-0 pointer-events-none"></div>

        {/* Existing blur circles */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-black/10 rounded-full blur-3xl z-0"></div>
        
        {/* --- Floating Glass Card 1 (Top Left for mirrored symmetry) --- */}
        <div className="absolute top-1/4 left-8 lg:left-12 z-30 animate-text-fade">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform -rotate-3 animate-float-fast">
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

        {/* --- Floating Glass Card 2 (Bottom Right for mirrored symmetry) --- */}
        <div className="absolute bottom-1/4 right-8 lg:right-12 z-30 animate-text-fade">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform rotate-6 animate-float-slow">
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

        {/* Updated Typography matched with Signup page */}
        <div className="relative text-white text-center animate-text-fade z-20">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">Welcome Back</h1>
          <p className="text-brand-50 text-lg max-w-xs mx-auto drop-shadow-sm">Log in to review your latest visual tests.</p>
        </div>
      </div>

    </div>
  );
};

export default Login;