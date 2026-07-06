import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/fetchClient';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // State to hold the real data
  const [sites, setSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sites on mount
  useEffect(() => {
    const loadSites = async () => {
      try {
        const data = await apiFetch('/test/sites'); 
        setSites(data);
      } catch (error) {
        console.error("Failed to load sites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSites();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const recentSites = sites.slice(0, 5);
  const hasMoreSites = sites.length > 5;

  return (
    <aside className="w-72 h-screen bg-gradient-to-br from-brand-400 to-brand-600 text-white flex flex-col shadow-2xl flex-shrink-0 z-20 rounded-r-[2.5rem]">
      
      {/* Header / Logo Area */}
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-2xl font-extrabold tracking-tight">Auto QA</span>
        </Link>
      </div>

      {/* Sites List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 mt-2 space-y-3 custom-scrollbar">
        <div className="text-orange-50 text-sm font-serif italic mb-4 ml-2">
          Recent Sites
        </div>
        
        {isLoading ? (
          <div className="text-white/60 text-sm px-2 animate-pulse">Loading projects...</div>
        ) : recentSites.length === 0 ? (
          <div className="text-white/60 text-sm px-2">No sites added yet.</div>
        ) : (
          recentSites.map((site) => (
            <Link
              key={site.id}
              to={`/sites/${site.id}`}
              className="w-full flex items-center gap-3 px-4 py-3 bg-black/10 border border-white/10 rounded-xl text-left transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              <div className="bg-white/20 p-2 rounded-lg shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="truncate">
                {/* Adjust site.name or site.url based on your actual MonitoredSiteDto */}
                <p className="text-sm font-bold text-white truncate">{site.url.replace(/^https?:\/\//, '')}</p>
                <p className="text-xs text-brand-100 truncate mt-0.5">Every {site.scanFrequencyMinutes} mins</p>
              </div>
            </Link>
          ))
        )}

        {hasMoreSites && (
          <Link to="/sites" className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white border-2 border-white/20 hover:bg-white/10 transition-colors">
            View All Sites
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto mb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/20 text-white hover:bg-red-500/80 transition-colors duration-300 font-bold shadow-inner"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;