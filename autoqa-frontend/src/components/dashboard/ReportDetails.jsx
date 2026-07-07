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
  const [expandedImage, setExpandedImage] = useState(null); // { src, label }

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const reportData = await apiFetch(`/test/logs/${id}`);
        setReport(reportData);

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

  useEffect(() => {
    if (!expandedImage) return;
    const handleKey = (e) => { if (e.key === 'Escape') setExpandedImage(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expandedImage]);

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

  const handleSetAsDefault = async () => {
    if (!window.confirm("This will make THIS scan's screenshot the new baseline and DELETE all previous reports. Are you sure?")) return;
    setIsProcessing(true);
    try {
      await apiFetch(`/test/sites/${site.id}/logs/${report.id}/set-baseline`, { method: 'POST' });
      navigate(`/sites/${site.id}`);
    } catch (err) {
      alert("Failed to set new baseline: " + err.message);
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
          <div className="relative overflow-hidden bg-gradient-to-br from-white to-beige-100 p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-100 rounded-full opacity-40 blur-2xl pointer-events-none"></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Link to={`/sites/${site.id}`} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-colors shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                  </Link>
                  <h1 className="text-3xl font-extrabold text-gray-900">Scan #{report.id}</h1>
                  {isBaseline ? (
                    <span className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full font-bold tracking-wider">BASELINE</span>
                  ) : (
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {matchPercent}% Match
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm ml-14">{new Date(report.executedAt).toLocaleString()}</p>
                <p className="text-gray-400 text-xs ml-14 mt-1">{site.url.replace(/^https?:\/\//, '')}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isBaseline && (
                  <button
                    onClick={handleSetBaseline}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-white border-2 border-brand-200 text-brand-700 font-bold rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-colors disabled:opacity-50"
                  >
                    Rescan &amp; Reset
                  </button>
                )}
                {!isBaseline && (
                  <button
                    onClick={handleSetAsDefault}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-md hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Set As Default
                  </button>
                )}
                <button
                  onClick={handleDeleteReport}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Image Viewer */}
          {isBaseline ? (
            <ImageCard
              title="Baseline Image"
              accent="blue"
              src={report.screenshotPath}
              onExpand={() => setExpandedImage({ src: report.screenshotPath, label: 'Baseline Image' })}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImageCard
                title="Current Baseline"
                accent="gray"
                src={site.baselineScreenshotPath}
                onExpand={() => setExpandedImage({ src: site.baselineScreenshotPath, label: 'Current Baseline' })}
              />
              <ImageCard
                title={isPass ? 'Scan Result' : 'Visual Difference'}
                accent={isPass ? 'green' : 'red'}
                src={report.screenshotPath}
                onExpand={() => setExpandedImage({ src: report.screenshotPath, label: isPass ? 'Scan Result' : 'Visual Difference' })}
              />
            </div>
          )}

        </div>
      </main>

      {/* LIGHTBOX */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm p-6 cursor-zoom-out"
          onClick={() => setExpandedImage(null)}
        >
          <div className="flex items-center justify-between w-full max-w-6xl mb-4">
            <p className="text-white font-bold text-lg">{expandedImage.label}</p>
            <button
              onClick={() => setExpandedImage(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <img
            src={expandedImage.src}
            alt={expandedImage.label}
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

const accentClasses = {
  blue: 'border-blue-100 ring-blue-50',
  gray: 'border-gray-100 ring-gray-50',
  green: 'border-green-100 ring-green-50',
  red: 'border-red-100 ring-red-50',
};

const ImageCard = ({ title, src, accent, onExpand }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border ring-1 ${accentClasses[accent]}`}>
    <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
    <div
      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-zoom-in"
      onClick={onExpand}
    >
      <img src={src} alt={title} className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-3 rounded-full shadow-lg">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h4m0 0v-4m0 4l-5-5" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

export default ReportDetails;