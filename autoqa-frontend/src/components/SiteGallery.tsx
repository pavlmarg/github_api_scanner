import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { MonitoredSite, QaLog } from '../types';

interface SiteGalleryProps {
  sites: MonitoredSite[];
}

export default function SiteGallery({ sites }: SiteGalleryProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<QaLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLastPage, setIsLastPage] = useState(true);

  const site = sites.find(s => s.id === Number(id));

  // Notice we added currentPage as a dependency so it re-fetches when you click Next/Prev
  useEffect(() => {
    if (!site) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    // Fetch with page parameters!
    fetch(`/api/test/sites/${site.id}/logs?page=${currentPage}&size=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch logs'))
      .then(data => {
        // Spring Page object puts the array inside 'content'
        setLogs(data.content); 
        setTotalPages(data.totalPages);
        setIsLastPage(data.last);
        setLoading(false);
      })
      .catch(console.error);
  }, [site, currentPage]);

  if (!site) return <div style={{ padding: '2rem' }}>Site not found.</div>;

  return (
    <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', backgroundColor: '#ecf0f1' }}>
      <button 
        onClick={() => navigate(`/site/${site.id}`)}
        style={{ padding: '0.5rem 1rem', marginBottom: '2rem', cursor: 'pointer', border: '1px solid #bdc3c7', borderRadius: '4px', backgroundColor: 'white' }}
      >
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>Test History: {site.name}</h1>
        
        {/* NEW: Pagination Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            disabled={currentPage === 0 || loading}
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ padding: '0.5rem 1rem', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', border: 'none', borderRadius: '4px', backgroundColor: currentPage === 0 ? '#bdc3c7' : '#3498db', color: 'white' }}
          >
            Previous
          </button>
          <span style={{ color: '#7f8c8d', fontWeight: 'bold' }}>
            Page {currentPage + 1} of {totalPages === 0 ? 1 : totalPages}
          </span>
          <button 
            disabled={isLastPage || loading}
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ padding: '0.5rem 1rem', cursor: isLastPage ? 'not-allowed' : 'pointer', border: 'none', borderRadius: '4px', backgroundColor: isLastPage ? '#bdc3c7' : '#3498db', color: 'white' }}
          >
            Next
          </button>
        </div>
      </div>
      
      {loading ? <p>Loading history...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {logs.length === 0 ? <p>No tests have been run yet.</p> : logs.map(log => (
            <div key={log.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', borderLeft: `6px solid ${log.status === 'PASS' || log.status === 'BASELINE_CREATED' ? '#2ecc71' : '#e74c3c'}` }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '1.2rem', color: log.status === 'FAIL' ? '#e74c3c' : '#2ecc71' }}>{log.status}</strong>
                  <span style={{ marginLeft: '1rem', color: '#7f8c8d' }}>
                    {new Date(log.executedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong>Diff: </strong> {log.visualDifferenceScore.toFixed(2)}% | 
                  <strong> Load: </strong> {log.actualLoadTimeMs}ms
                </div>
              </div>

              {log.screenshotPath && (
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                    {log.status === 'FAIL' ? 'Visual Difference Highlighted (Red):' : 'Captured Screenshot:'}
                  </p>
                  <img 
                    src={log.screenshotPath} 
                    alt="Test Result" 
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '4px' }} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}