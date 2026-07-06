import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { apiFetch } from '../../api/fetchClient';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSites = async () => {
      try {
        // Matches your TestController's @GetMapping("/sites")
        const data = await apiFetch('/test/sites');
        const sortedData = data.sort((a, b) => b.id - a.id);
        setSites(sortedData);
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(sites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSites = sites.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="flex h-screen bg-beige-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-900">All Projects</h1>
              <p className="text-gray-500 mt-1">Manage your monitored URLs and view visual regression reports.</p>
            </div>
            <Link 
              to="/dashboard" 
              className="px-5 py-2.5 bg-white border-2 border-brand-200 text-brand-700 font-bold rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Sites List Container */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Monitored Sites <span className="ml-2 text-sm font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{sites.length} Total</span>
              </h2>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-12 text-center text-gray-500 animate-pulse font-medium">
                  Loading projects...
                </div>
              ) : sites.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4 border border-brand-100">
                    <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-800">No Projects Found</h3>
                  <p className="text-gray-500 mt-2 max-w-sm">
                    Head back to the dashboard to add your first URL for monitoring.
                  </p>
                </div>
              ) : (
                currentSites.map((site) => (
                  <div key={site.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50 transition-colors group">
                    
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-gray-900 text-lg truncate">{site.url.replace(/^https?:\/\//, '')}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Every {site.scanFrequencyMinutes} mins
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      {/* DYNAMIC STATUS BADGE */}
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-lg border ${
                        site.isActive 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {site.isActive ? 'Active' : 'Paused'}
                      </span>
                      <Link 
                        to={`/sites/${site.id}`}
                        className="px-4 py-2 bg-brand-50 border border-brand-100 text-brand-700 font-bold rounded-xl hover:bg-brand-500 hover:text-white transition-colors text-sm shadow-sm"
                      >
                        View Project
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls (Only show if there are sites) */}
            {sites.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600 font-medium">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(startIndex + itemsPerPage, sites.length)}</span> of <span className="font-bold text-gray-900">{sites.length}</span> results
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sites;