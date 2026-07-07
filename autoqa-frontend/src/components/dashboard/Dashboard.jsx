import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { apiFetch } from '../../api/fetchClient';

const Dashboard = () => {
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Real Data State
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sites on component mount
  useEffect(() => {
    const loadSites = async () => {
      try {
        const data = await apiFetch('/test/sites'); 
        setSites(data);
      } catch (err) {
        console.error("Failed to fetch sites:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSites();
  }, []);

  // Derived Stats (Passed/Failed can be derived from QaLogs later)
  const stats = {
    active: sites.filter((s) => s.isActive).length,
    passed: sites.filter((s) => s.lastStatus === 'PASS' || s.lastStatus === 'BASELINE_CREATED').length,
    failed: sites.filter((s) => s.lastStatus === 'FAIL').length,
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Manual validation fallback just in case
    const freqNum = parseInt(frequency, 10);
    if (freqNum < 1 || freqNum > 1440) {
      setError("Frequency must be between 1 and 1440 minutes.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        url: url,
        scanFrequencyMinutes: freqNum
      };

      await apiFetch('/test/sites', {
        method: 'POST',
        body: payload
      });

      // Reset & Close on success
      setIsModalOpen(false);
      setUrl('');
      setFrequency(60);
      
      // Reload the page to refresh both Sidebar and Dashboard data
      window.location.reload(); 
    } catch (err) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-beige-50 font-sans overflow-hidden">
      
      {/* Custom Animations */}
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

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar relative">
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
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md hover:bg-brand-600 transition-transform active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                New Project
              </button>
            </div>
          </div>

          {/* 2. Stats Blocks (Driven by Real Data) */}
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

          {/* 3. Recent Projects List */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Recent Projects</h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 animate-pulse font-medium">
                Loading projects...
              </div>
            ) : sites.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4 border border-brand-100">
                  <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-extrabold text-gray-800">No Projects Yet</h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                  You haven't added any URLs to monitor. Click <strong>New Project</strong> above to get started with visual regression testing.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sites.slice(0, 5).map((site) => {
                const statusColor = site.isActive ? 'bg-green-400' : 'bg-orange-400';
                return (
                  <div key={site.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${statusColor}`}></div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg truncate max-w-xs md:max-w-md">
                          {site.url.replace(/^https?:\/\//, '')}
                        </h3>
                      <p className="text-sm text-gray-500">Scans every {site.scanFrequencyMinutes} mins</p>
                    </div>
                  </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className={`font-extrabold ${site.isActive ? 'text-green-600' : 'text-orange-600'}`}>
              {site.isActive ? 'Active' : 'Paused'}
            </p>
              </div>
              {site.lastStatus && site.lastStatus !== 'BASELINE_CREATED' && (
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-lg border ${
                    site.lastStatus === 'PASS'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                  Last: {site.lastStatus}
                </span>
                )}
                <Link
                  to={`/sites/${site.id}`}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
                >
                  View Details
                </Link>
                </div>
              </div>
                );
              })}
            </div>
            )}
          </div>

          {/* 4. "How it Works" Animated Explainer */}
          <div className="pt-8 pb-4">
            <h2 className="text-2xl font-extrabold text-brand-900 mb-6 text-center">How Auto QA Protects Your UI</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
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

              <div className="flex flex-col gap-4 group">
                <div className="h-40 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden">
                  <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-3/4 h-4 bg-gray-100 rounded mb-4"></div>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div className="bg-gray-50 rounded"></div>
                    <div className="bg-gray-100 rounded"></div>
                  </div>
                  <div className="absolute left-0 right-0 h-1 bg-brand-500 shadow-[0_0_10px_#f97316] animate-laser z-10"></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs">2</span> Bots Scan
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Our headless browsers visit your site to capture live screenshots of every page.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 group">
                <div className="h-40 bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-center relative">
                   <div className="w-3/4 h-24 bg-gray-50 rounded-lg border border-gray-200 relative p-3 flex flex-col gap-2">
                     <div className="w-full h-4 bg-gray-200 rounded"></div>
                     <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
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

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-transform">
            
            <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-brand-50 to-white border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-brand-900">New Project</h2>
                  <p className="text-sm text-gray-500 mt-1">Add a URL to begin visual regression testing.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateProject} className="p-8 space-y-6">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Target URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-gray-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Scan Frequency (Minutes)</label>
                <input 
                  type="number"
                  min="1"
                  max="1440"
                  required
                  placeholder="e.g. 60"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a value between 1 and 1440 (24 hours).</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center"
                >
                  {isSubmitting ? 'Adding...' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;