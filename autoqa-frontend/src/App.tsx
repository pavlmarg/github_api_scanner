import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import type { MonitoredSite } from './types';
import Sidebar from './components/Sidebar';
import SiteDashboard from './components/siteDashboard';
import SiteGallery from './components/SiteGallery';
import Login from './components/Login';
import Signup from './components/Signup';

// --------------------------------------------------------
// 1. SECURITY: The Protected Route Wrapper
// If a user tries to access a URL without a token, boot them to login.
// --------------------------------------------------------
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// --------------------------------------------------------
// 2. ROUTING HELPER: The Site Wrapper
// Reads the URL, finds the right data, and passes it to the Dashboard
// --------------------------------------------------------
function SiteRouteWrapper({ sites, onSiteUpdated, onSiteDeleted }: { 
  sites: MonitoredSite[], 
  onSiteUpdated: (s: MonitoredSite) => void, 
  onSiteDeleted: (id: number) => void 
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const site = sites.find(s => s.id === Number(id));

  const handleDeleteAndNavigate = (deletedId: number) => {
    onSiteDeleted(deletedId);
    navigate('/'); // Go back to the main screen after deleting
  };

  return <SiteDashboard site={site} onSiteUpdated={onSiteUpdated} onSiteDeleted={handleDeleteAndNavigate} />;
}

// --------------------------------------------------------
// 3. SIDEBAR HELPER: The Add Site Logic
// --------------------------------------------------------
function SidebarController({ sites, setSites }: { sites: MonitoredSite[], setSites: React.Dispatch<React.SetStateAction<MonitoredSite[]>> }) {
  const navigate = useNavigate();

  const handleAddSite = async (url: string, scanIntervalSeconds: number) => {
    const token = localStorage.getItem('token'); 
    
    const response = await fetch('/api/test/sites', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ url, scanIntervalSeconds }), 
    });
    
    if (!response.ok) throw new Error('Failed to add site');
    
    const newSite = await response.json();
    setSites(prev => [...prev, newSite]);
    navigate(`/site/${newSite.id}`); 
  };

  return <Sidebar sites={sites} onAddSite={handleAddSite} />;
}

// --------------------------------------------------------
// 4. THE MAIN APP ORCHESTRATOR
// --------------------------------------------------------
function App() {
  const [sites, setSites] = useState<MonitoredSite[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Fetch the dashboard data ONLY if we are logged in
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    
    fetch('/api/test/sites', {
      headers: {
        'Authorization': `Bearer ${token}` // Show the wristband to Java
      }
    })
      .then(res => {
        if (res.status === 401 || res.status == 403) {
          // If the token is expired or fake, force a logout
          handleLogout();
          throw new Error('Unauthorized');
        }
        return res.ok ? res.json() : Promise.reject('Failed to fetch');
      })
      .then(data => {
        if (Array.isArray(data)) setSites(data);
      })
      .catch(console.error);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Rip off the wristband
    setIsAuthenticated(false);
    setSites([]); // Wipe the memory clean
  };

  return (
    <Router>
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
        <Route path="/signup" element={<Signup />} />

        {/* === PROTECTED ROUTES === */}
        {/* The /* means "catch everything else" and apply this layout */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app-layout">
              
              {/* Left Column: Sidebar & Logout */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <SidebarController sites={sites} setSites={setSites} />
                
                {/* Logout Button anchored to the bottom of the sidebar */}
                <div style={{ position: 'absolute', bottom: '2rem', left: '1.5rem', right: '1.5rem' }}>
                  <button 
                    onClick={handleLogout} 
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      backgroundColor: 'transparent', 
                      color: '#e74c3c', 
                      border: '1px solid #e74c3c', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e74c3c'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#e74c3c'; }}
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Right Column: Main Content Area */}
              <Routes>
                {/* Default Dashboard view */}
                <Route path="/" element={
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7f8c8d' }}>
                    <h2>Welcome to AutoQA. Select a site to begin.</h2>
                  </div>
                } />
                
                {/* Single Site Detail view */}
                <Route path="/site/:id" element={
                  <SiteRouteWrapper 
                    sites={sites} 
                    onSiteUpdated={(updated) => setSites(prev => prev.map(s => s.id === updated.id ? updated : s))} 
                    onSiteDeleted={(id) => setSites(prev => prev.filter(s => s.id !== id))} 
                  />
                } />
                
                {/* Screenshot Gallery view */}
                <Route path="/site/:id/logs" element={<SiteGallery sites={sites} />} />
              </Routes>

            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;