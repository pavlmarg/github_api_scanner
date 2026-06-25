import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MonitoredSite } from '../types';

interface SidebarProps {
  sites: MonitoredSite[];
  onAddSite: (url: string, intervalSeconds: number) => Promise<void>;
}

export default function Sidebar({ sites, onAddSite }: SidebarProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [intervalValue, setIntervalValue] = useState('');
  const [intervalUnit, setIntervalUnit] = useState('minutes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Inside Sidebar.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setError('');

    // Default to 60 minutes
    let totalMinutes = 60; 
    
    if (intervalValue) {
      const val = parseInt(intervalValue);
      if (val < 1) {
        setError("Minimum interval is 1 minute.");
        return;
      }
      
      if (intervalUnit === 'minutes') totalMinutes = val;
      if (intervalUnit === 'hours') totalMinutes = val * 60;
    }

    // 72 hours = 4320 minutes
    if (totalMinutes > 4320) {
      setError("Maximum allowed interval is 72 hours.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSite(inputUrl, totalMinutes); // Pass minutes back to App.tsx
      setInputUrl('');
      setIntervalValue('');
      setIntervalUnit('minutes');
    } catch (err: any) {
      setError(err.message || 'Failed to add site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const topSites = sites.slice(0, 5);

  return (
    <div style={{ width: '300px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
      <h2 onClick={() => navigate('/')} style={{ margin: '0 0 2rem 0', color: '#ecf0f1', cursor: 'pointer' }}>
        AutoQA
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="https://example.com" 
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: 'none' }}
        />
        
        {/* NEW: Interval Input Row */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="number" 
            placeholder="60 (Default)" 
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', flex: 1, minWidth: '0' }}
          />
          <select 
            value={intervalUnit} 
            onChange={(e) => setIntervalUnit(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#34495e', color: 'white', cursor: 'pointer' }}
          >
            <option value="minutes">Min(s)</option>
            <option value="hours">Hour(s)</option>
          </select>
        </div>
        
        {error && <p style={{ color: '#e74c3c', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting || !inputUrl} style={{ padding: '0.5rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' }}>
          {isSubmitting ? 'Adding...' : 'Add Site'}
        </button>
      </form>

      <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#95a5a6', marginBottom: '1rem' }}>Top Sites</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {topSites.map(site => {
          const isActive = location.pathname === `/site/${site.id}`;
          return (
            <button key={site.id} onClick={() => navigate(`/site/${site.id}`)} style={{ padding: '0.75rem', textAlign: 'left', backgroundColor: isActive ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {site.name}
            </button>
          )
        })}
      </div>
    </div>
  );
}