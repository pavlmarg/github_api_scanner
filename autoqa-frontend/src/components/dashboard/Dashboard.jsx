import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const Dashboard = () => {
  const stats = { active: 12, passed: 8, failed: 4 };
  
  const recentChecks = [
    { id: 101, site: 'Production App', rate: '99.8%', status: 'Passed', date: '2 mins ago' },
    { id: 102, site: 'Marketing Blog', rate: '100%', status: 'Passed', date: '1 hour ago' },
    { id: 103, site: 'Staging Environment', rate: '85.4%', status: 'Failed', date: '3 hours ago' },
  ];

  return (
    <div className="flex h-screen bg-beige-50 font-sans overflow-hidden">
      
      {/* Custom Animations for the "Video-like" blocks */}
      <style>{`
        @keyframes typing {
          0%, 100% { width: 0%; opacity: 0; }
          20%, 80% { width: 60%; opacity: 1; }
        }
        @keyframes scanLaser {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes diffPulse {
          0%, 100% { background-color: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); }
          50% { background-color: rgba(239, 68, 68, 0.3); border-color: rgba(239, 68, 68, 0.8); }
        }
        .animate-typing { animation: typing 3s ease-in-out infinite; }
        .animate-laser { animation: scanLaser 2s linear infinite; }
        .animate-diff { animation: diffPulse 1.5s ease-in-out infinite; }
      `}</style>

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 1. Top Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-brand-900">
              Dashboard Overview
            </h1>
            <div className="flex gap-3">
              <Link 
                to="/sites" 
                className="px-5 py-2.5 bg-white border-2 border-brand-200 text-brand-700 font-bold rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                View Sites
              </Link>
              <button 
                className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md hover:bg-brand-600 transition-transform active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                New Project
              </button>
            </div>
          </div>

          {/* 2. Stats Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-500 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Projects</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.active}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-green-50 text-green-500 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Checks Passed</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.passed}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-4 bg-red-50 text-red-500 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Checks Failed</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </div>

          {/* 3. Recent Checks List */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Recent Checks</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentChecks.map((check) => (
                <div key={check.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${check.status === 'Passed' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{check.site}</h3>
                      <p className="text-sm text-gray-500">Scanned {check.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Match Rate</p>
                      <p className={`font-extrabold ${check.status === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                        {check.rate}
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm">
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. "How it Works" Animated Explainer (Moved to bottom) */}
          <div className="pt-8 pb-4">
            <h2 className="text-2xl font-extrabold text-brand-900 mb-6 text-center">How Auto QA Protects Your UI</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Step 1: Add Project Animation */}
              <div className="flex flex-col gap-4 group">
                <div className="h-40 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="w-full h-8 bg-gray-50 rounded-lg border border-gray-200 flex items-center px-3">
                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
                    <div className="h-2 bg-brand-400 rounded animate-typing"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="w-1/3 h-16 bg-gray-100 rounded-lg"></div>
                    <div className="w-2/3 h-16 bg-gray-50 rounded-lg"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs">1</span> Add Project
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Register your website URL to capture a perfect baseline of how it should look.</p>
                </div>
              </div>

              {/* Step 2: Scan Animation */}
              <div className="flex flex-col gap-4 group">
                <div className="h-40 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden">
                  {/* Mock Wireframe */}
                  <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-3/4 h-4 bg-gray-100 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="bg-gray-50 rounded"></div>
                    <div className="bg-gray-100 rounded"></div>
                  </div>
                  {/* Animated Laser */}
                  <div className="absolute left-0 right-0 h-1 bg-brand-500 shadow-[0_0_10px_#f97316] animate-laser z-10"></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs">2</span> Bots Scan
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Our headless browsers visit your site to capture live screenshots of every page.</p>
                </div>
              </div>

              {/* Step 3: Diff Review Animation */}
              <div className="flex flex-col gap-4 group">
                <div className="h-40 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-center relative">
                   <div className="w-3/4 h-24 bg-gray-50 rounded-lg border border-gray-200 relative p-3 flex flex-col gap-2">
                     <div className="w-full h-4 bg-gray-200 rounded"></div>
                     <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                     {/* Pulsing Red "Bug" Overlay */}
                     <div className="absolute bottom-2 right-2 w-10 h-6 border-2 border-red-500 bg-red-100 rounded animate-diff"></div>
                   </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs">3</span> Review Diffs
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">We highlight exact pixel differences. Approve intentional updates or fix bugs.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;