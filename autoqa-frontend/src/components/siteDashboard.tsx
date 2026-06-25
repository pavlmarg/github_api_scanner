import { useState, useEffect } from 'react';
import type { MonitoredSite } from '../types';
import { useNavigate } from 'react-router-dom';

interface SiteDashboardProps {
  site: MonitoredSite | undefined;
  onSiteUpdated: (updatedSite: MonitoredSite) => void;
  onSiteDeleted: (id: number) => void;
}

export default function SiteDashboard({ site, onSiteUpdated, onSiteDeleted }: SiteDashboardProps) {
    const navigate = useNavigate();
    const [isRunning, setIsRunning] = useState(false);

  // New States for Editing and Deleting
    const [isEditing, setIsEditing] = useState(false);
    const [editFrequency, setEditFrequency] = useState(60);
    const [isSaving, setIsSaving] = useState(false);

  // Sync the form value whenever the user selects a different site
    useEffect(() => {
    if (site) {
        setEditFrequency(site.scanFrequencyMinutes);
        setIsEditing(false); // Reset edit view on site switch
    }
    }, [site]);

    if (!site) {
        return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7f8c8d' }}>
            <h2>Select a site from the sidebar to view details.</h2>
        </div>
        );
    }

    const handleCheckNow = async () => {
    setIsRunning(true);
    try {
      const token = localStorage.getItem('token'); // 1. Grab the token
      const response = await fetch(`/api/test/sites/${site.id}/run`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` } // 2. Attach it!
      });
      if (!response.ok) throw new Error('Failed to execute test');
      const updatedSite = await response.json();
      onSiteUpdated(updatedSite); 
    } catch (error) {
      console.error("Error running test:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetBaseline = async () => {
    const confirmReset = window.confirm(`Are you sure you want to reset the baseline for ${site.name}? This will immediately run a new test to capture a new golden image.`);
    if (!confirmReset) return;

    setIsRunning(true); // Re-use the running state to show the loading indicator
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/test/sites/${site.id}/reset`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (!response.ok) throw new Error('Failed to reset baseline');
      
      const updatedSite = await response.json();
      onSiteUpdated(updatedSite); 
    } catch (error) {
      console.error("Error resetting baseline:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/test/sites/${site.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Attach it here too
        },
        body: JSON.stringify({ scanFrequencyMinutes: editFrequency })
      });

      if (!response.ok) throw new Error('Failed to update configuration');
      
      const updatedSite = await response.json();
      onSiteUpdated(updatedSite);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating frequency:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSite = async () => {
    const confirmDelete = window.confirm(`Are you sure you want to remove ${site.name}? This will stop all scheduled background tests.`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/test/sites/${site.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!response.ok) throw new Error('Failed to delete site');
      
      onSiteDeleted(site.id);
    } catch (error) {
      console.error("Error deleting site:", error);
    }
  };
  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    color: 'white',
    transition: 'opacity 0.2s'
  };

  return (
    <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginTop: 0, marginBottom: '0.5rem', color: '#2c3e50' }}>{site.name}</h1>
      <a href={site.url} target="_blank" rel="noreferrer" style={{ color: '#3498db', fontSize: '1.1rem' }}>{site.url}</a>

      {/* Actions Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', marginBottom: '3rem' }}>
        <button 
          onClick={handleCheckNow} 
          disabled={isRunning || isEditing} 
          style={{ ...buttonStyle, backgroundColor: '#2ecc71', opacity: isRunning || isEditing ? 0.5 : 1 }}
        >
          {isRunning ? '⏳ Running Test...' : '▶ Check Now'}
        </button>
        
        <button 
          onClick={() => navigate(`/site/${site.id}/logs`)}
          style={{ ...buttonStyle, backgroundColor: '#9b59b6', opacity: isEditing ? 0.5 : 1 }} 
          disabled={isEditing}
        >
          📷 View Screenshots
        </button>
        
        {isEditing ? (
          <>
            <button onClick={handleSaveChanges} disabled={isSaving} style={{ ...buttonStyle, backgroundColor: '#27ae60' }}>
              {isSaving ? 'Saving...' : '💾 Save'}
            </button>
            <button onClick={() => { setIsEditing(false); setEditFrequency(site.scanFrequencyMinutes); }} style={{ ...buttonStyle, backgroundColor: '#7f8c8d' }}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} style={{ ...buttonStyle, backgroundColor: '#f39c12' }}>
            ✏️ Edit
          </button>
        )}

        {!isEditing && (
          <button onClick={handleRemoveSite} style={{ ...buttonStyle, backgroundColor: '#e74c3c' }}>
            🗑️ Remove
          </button>
        )}

        <button 
          onClick={handleResetBaseline} 
          disabled={isRunning || isEditing} 
          style={{ ...buttonStyle, backgroundColor: '#34495e', opacity: isRunning || isEditing ? 0.5 : 1 }}
        >
          🔄 Reset Baseline
        </button>
      </div>

      {/* Configuration Details Card */}
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#34495e' }}>Configuration</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <strong>Scan Frequency:</strong>{' '}
          {isEditing ? (
            <input 
              type="number" 
              min="1"
              value={editFrequency}
              onChange={(e) => setEditFrequency(parseInt(e.target.value) || 1)}
              style={{ padding: '0.25rem 0.5rem', width: '80px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          ) : (
            `Every ${site.scanFrequencyMinutes}`
          )}{' '}
          minutes
        </div>

        <div>
          <strong>Baseline Status:</strong> {site.baselineScreenshotPath ? '✅ Established' : '⏳ Pending first run'}
        </div>
      </div>
    </div>
  );
}