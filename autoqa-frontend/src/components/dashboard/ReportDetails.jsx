import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { apiFetch } from '../../api/fetchClient';

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [site, setSite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Fetch the specific report
        const reportData = await apiFetch(`/test/logs/${id}`);
        setReport(reportData);

        // Fetch the parent site to get the baseline image
        if (reportData.siteId) {
            const siteData = await apiFetch(`/test/sites/${reportData.siteId}`);
            setSite(siteData);
        }
      } catch (error) {
        console.error("Failed to load report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [id]);

  const handleSetBaseline = async () => {
    if (!window.confirm("This will capture a fresh screenshot right now to set as the new baseline and DELETE all previous reports. Are you sure?")) return;
    setIsProcessing(true);
    try {
      await apiFetch(`/test/sites/${site.id}/reset`, { method: 'POST' });
      navigate(`/sites/${site.id}`);
    } catch (err) {
      alert("Failed to reset baseline: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleDeleteReport = async () => {
    if (isBaseline) {
        if (!window.confirm("WARNING: This report is a BASELINE. Deleting it will delete the entire project. Proceed?")) return;
        setIsProcessing(true);
        try {
            await apiFetch(`/test/sites/${site.id}`, { method: 'DELETE' });
            navigate('/sites');
        } catch (err) {
            alert("Failed to delete project: " + err.message);
            setIsProcessing(false);
        }
    } else {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        setIsProcessing(true);
        try {
            await apiFetch(`/test/sites/${site.id}/logs/${id}`, { method: 'DELETE' });
            navigate(`/sites/${site.id}`);
        } catch (err) {
            alert("Failed to delete report: " + err.message);
            setIsProcessing(false);
        }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-beige-50 font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
           <div className="animate-pulse text-brand-500 font-bold text-xl">Loading report...</div>
        </main>
      </div>
    );
  }

  if (!report || !site) {
    return (
      <div className="flex h-screen bg-beige-50 font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-red-500 font-bold text-xl">
           Report not found.
        </main>
      </div>
    );
  }

  const isBaseline = report.status === 'BASELINE_CREATED';
  const isPass = report.status === 'PASS';
  const matchPercent = report.visualDifferenceScore !== undefined 
      ? (100 - report.visualDifferenceScore).toFixed(2) 
      : 100;

  return (
    <div className="flex h-screen bg-beige-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <div className="flex items-center gap-3">
                <Link to={`/sites/${site.id}`} className="text-gray-400 hover:text-brand-500 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-900">Scan #{report.id}</h1>
                {isBaseline ? (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-bold tracking-wider">BASELINE</span>
                ) : (
                    <span className={`text-xs px-2 py-1 rounded-md font-bold ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {matchPercent}% Match
                    </span>
                )}
              </div>
              <p className="text-gray-500 mt-2 text-sm ml-9">{new Date(report.executedAt).toLocaleString()}</p>
            </div>
            
            <div className="flex gap-3">
              {!isBaseline && (
                  <button 
                    onClick={handleSetBaseline}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md hover:bg-brand-600 transition-all disabled:opacity-50"
                  >
                    Set New Baseline
                  </button>
              )}
              <button 
                onClick={handleDeleteReport}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Image Viewer */}
          {isBaseline ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Baseline Image</h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img src={report.screenshotPath} alt="Baseline" className="w-full h-auto" />
                  </div>
              </div>
          ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">Current Baseline</h2>
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img src={site.baselineScreenshotPath} alt="Baseline" className="w-full h-auto" />
                      </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 ring-1 ring-red-50">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">
                          {isPass ? 'Scan Result' : 'Visual Difference'}
                      </h2>
                      <div className="border border-red-200 rounded-lg overflow-hidden bg-gray-50">
                          <img src={report.screenshotPath} alt="Scan Result" className="w-full h-auto" />
                      </div>
                  </div>
              </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default ReportDetails;