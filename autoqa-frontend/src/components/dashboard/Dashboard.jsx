import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Mock data to visualize the layout before we connect the backend
  const [projects] = useState([
    { id: 1, name: 'Production Marketing Site', url: 'https://example.com', status: 'passed', lastTested: '10 mins ago', diff: '0.0%' },
    { id: 2, name: 'Staging Dashboard UI', url: 'https://staging.example.com', status: 'failed', lastTested: '2 hours ago', diff: '4.2%' },
    { id: 3, name: 'E-commerce Checkout Flow', url: 'https://shop.example.com', status: 'passed', lastTested: '5 hours ago', diff: '0.1%' },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-beige-50 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-beige-200 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo Area */}
          <div className="h-20 flex items-center px-8 border-b border-beige-100">
            <svg className="w-8 h-8 text-brand-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xl font-extrabold text-brand-700">Auto QA</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <a href="#" className="flex items-center px-4 py-3 bg-brand-50 text-brand-700 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-beige-600 hover:bg-beige-100 hover:text-beige-900 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Test Runs
            </a>
            <a href="#" className="flex items-center px-4 py-3 text-beige-600 hover:bg-beige-100 hover:text-beige-900 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Settings
            </a>
          </nav>
        </div>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-beige-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          
          {/* Top Header */}
          <header className="flex justify-between items-center mb-10 mt-2">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-900 tracking-tight">Overview</h1>
              <p className="text-beige-600 mt-1">Monitor and manage your automated visual tests.</p>
            </div>
            <button className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-transform transform active:scale-95 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Project
            </button>
          </header>

          {/* 3. QUICK STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-beige-200 flex flex-col justify-center">
              <span className="text-beige-500 font-medium text-sm">Total Projects</span>
              <span className="text-4xl font-extrabold text-brand-900 mt-2">{projects.length}</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-beige-200 flex flex-col justify-center">
              <span className="text-beige-500 font-medium text-sm">Passing Tests</span>
              <span className="text-4xl font-extrabold text-green-500 mt-2">2</span>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-beige-200 flex flex-col justify-center border-b-4 border-b-red-400">
              <span className="text-beige-500 font-medium text-sm">Failing Tests</span>
              <span className="text-4xl font-extrabold text-red-500 mt-2">1</span>
            </div>
          </div>

          {/* 4. PROJECTS LIST */}
          <h2 className="text-xl font-bold text-brand-900 mb-6">Recent Projects</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-beige-200 overflow-hidden">
            <ul className="divide-y divide-beige-100">
              {projects.map((project) => (
                <li key={project.id} className="p-6 hover:bg-beige-50 transition-colors flex items-center justify-between cursor-pointer">
                  
                  {/* Left Side: Info */}
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-4 ${project.status === 'passed' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] animate-pulse'}`}></div>
                    <div>
                      <h3 className="text-lg font-bold text-brand-900">{project.name}</h3>
                      <a href={project.url} target="_blank" rel="noreferrer" className="text-sm text-brand-500 hover:underline">{project.url}</a>
                    </div>
                  </div>

                  {/* Right Side: Metadata & Action */}
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-beige-900">Diff: {project.diff}</p>
                      <p className="text-xs text-beige-500">Last tested {project.lastTested}</p>
                    </div>
                    <button className="text-beige-400 hover:text-brand-600 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                </li>
              ))}
            </ul>
          </div>

        </div>
      </main>

    </div>
  );
};

export default Dashboard;