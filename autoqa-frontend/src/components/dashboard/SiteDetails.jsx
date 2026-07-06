import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { apiFetch } from '../../api/fetchClient';

const SiteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [site, setSite] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFrequency, setEditFrequency] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Date Formatter Fix ---
  const formatReportDate = (dateVal) => {
    if (!dateVal) return 'Unknown Date';
    // If Spring Boot sent an array like [2026, 7, 6, 15, 30]
    if (Array.isArray(dateVal)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateVal;
      // JS Date months are 0-indexed, so we do month - 1
      return new Date(year, month - 1, day, hour, minute, second).toLocaleString();
    }
    // If it's a standard string
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
  };

  const loadSiteData = async () => {
    try {
      const siteData = await apiFetch(`/test/sites/${id}`);
      setSite(siteData);
      setEditFrequency(siteData.scanFrequencyMinutes); // Initialize edit form

      try {
        const reportsData = await apiFetch(`/test/sites/${id}/logs`);
        const logsArray = reportsData.content || [];
        setReports(Array.isArray(logsArray) ? logsArray.sort((a, b) => b.id - a.id) : []);
      } catch (logErr) {
        console.warn("Logs endpoint failed:", logErr);
        setReports([]);
      }
    } catch (err) {
      setError(err.message || "Could not fetch project details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSiteData();
  }, [id]);

  const limitReached = reports.length >= 50;
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

  // --- Actions ---
  const handleCheckNow = async () => {
    if (limitReached) return;
    setIsProcessing(true);
    try {
      await apiFetch(`/test/sites/${id}/run`, { method: 'POST' });
      await loadSiteData();
    } catch (err) {
      alert("Failed to start scan (Is it stuck testing?): " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetBaseline = async () => {
    if (!window.confirm("This will set the latest successful scan as the new baseline and DELETE all previous reports. Are you sure?")) return;
    setIsProcessing(true);
    try {
      await apiFetch(`/test/sites/${id}/reset`, { method: 'POST' });
      await loadSiteData();
    } catch (err) {
      alert("Failed to reset baseline: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePause = async () => {
    setIsProcessing(true);
    try {
      const endpoint = site.isActive ? `/test/sites/${id}/pause` : `/test/sites/${id}/resume`;
      await apiFetch(endpoint, { method: 'PUT' });
      setSite({ ...site, isActive: !site.isActive });
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete this project and all its data?")) return;
    setIsProcessing(true);
    try {
      await apiFetch(`/test/sites/${id}`, { method: 'DELETE' });
      navigate('/sites');
    } catch (err) {
      alert("Failed to delete project: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // Matches @PutMapping("/sites/{id}") from your TestController
      await apiFetch(`/test/sites/${id}`, {
        method: 'PUT',
        body: { scanFrequencyMinutes: parseInt(editFrequency, 10) }
      });
      setIsEditModalOpen(false);
      await loadSiteData();
    } catch (err) {
      alert("Failed to update settings: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReport = async (report) => {
    // Determine if it is the baseline (Assuming you have an isBaseline flag, or if difference is 0)
    const isBaseline = report.isBaseline === true || report.differencePercentage === 0;

    if (isBaseline) {
      if (window.confirm("WARNING: This report is a BASELINE. Deleting it will delete the entire site project. Do you want to proceed?")) {
        handleDeleteSite();
      }
    } else {
      if (window.confirm("Are you sure you want to delete this specific report?")) {
        try {
          setIsProcessing(true);
          await apiFetch(`/test/sites/${id}/logs/${report.id}`, { method: 'DELETE' });
          await loadSiteData();
        } catch (err) {
          alert("Failed to delete report: " + err.message);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-beige-50 font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
           <div className="animate-pulse text-brand-500 font-bold text-xl">Loading project details...</div>
        </main>
      </div>
    );
  }

  if (error || !site) return null;

  return (
    <div className="flex h-screen bg-beige-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar relative">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header & Status */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900 truncate max-w-xl">
                  {site.url.replace(/^https?:\/\//, '')}
                </h1>
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-lg border ${site.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                  {site.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Scanning every {site.scanFrequencyMinutes} minutes
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button onClick={handleCheckNow} disabled={isProcessing || limitReached} className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50">
                Check Now
              </button>
              <button onClick={handleResetBaseline} disabled={isProcessing} className="px-5 py-2.5 bg-white border-2 border-brand-200 text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-all">
                Set New Baseline
              </button>
            </div>
          </div>

          {limitReached && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm animate-pulse">
              <div className="text-red-500 shrink-0 mt-1">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-red-800">Storage Limit Reached (50/50 Reports)</h3>
                <p className="text-red-700 mt-1 font-medium">
                  Testing paused. Delete old reports manually or Set New Baseline to reset history.
                </p>
              </div>
            </div>
          )}

          {/* Secondary Actions */}
          <div className="flex flex-wrap gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-200">
             <button onClick={handleTogglePause} disabled={isProcessing || (limitReached && !site.isActive)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
                {site.isActive ? 'Stop Testing Temporarily' : 'Resume Testing'}
              </button>
              <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                Edit Settings
              </button>
              <button onClick={handleDeleteSite} disabled={isProcessing} className="px-4 py-2 ml-auto bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                Delete Project
              </button>
          </div>

          {/* Reports List */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Visual Regression Reports</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {reports.length === 0 ? (
                <div className="p-16 flex flex-col items-center text-center text-gray-500 font-medium">No reports generated yet.</div>
              ) : (
                currentReports.map((report) => {
                  
                  // Logic to determine badge presentation
                  const isBaseline = report.isBaseline === true || report.differencePercentage === 0;
                  const isPass = report.status === 'PASSED';
                  
                  return (
                    <div key={report.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${isPass ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-bold text-gray-900 flex items-center gap-2">
                            Scan #{report.id}
                            
                            {/* DYNAMIC BADGE */}
                            {isBaseline ? (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold tracking-wider">BASELINE</span>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isPass ? '100% Match' : `${report.differencePercentage}% Match`}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">{formatReportDate(report.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <Link to={`/reports/${report.id}`} className="text-sm font-bold text-brand-600 hover:text-brand-800">
                          View Diff &rarr;
                        </Link>
                        
                        {/* DELETE REPORT BUTTON */}
                        <button 
                          onClick={() => handleDeleteReport(report)}
                          className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {reports.length > itemsPerPage && (
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                 <span className="text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages}</span>
                 <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT SETTINGS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-brand-50 to-white border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-brand-900">Edit Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Update parameters for {site.url}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Scan Frequency (Minutes)</label>
                <input 
                  type="number" min="1" max="1440" required
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isProcessing} className="flex-1 px-4 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 disabled:opacity-70">
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SiteDetails;