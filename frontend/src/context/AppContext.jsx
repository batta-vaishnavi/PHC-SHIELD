import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Modals
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [explainModalData, setExplainModalData] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
      setHasData(data.has_data);
      setIsDemoActive(data.is_demo_active);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setHasData(false);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleLoadDemo = async () => {
    try {
      const res = await apiClient.loadDemoData();
      showToast(res.message || 'Synthetic demo dataset successfully loaded!', 'success');
      setShowDemoModal(false);
      await refreshStats();
      setActiveTab('dashboard');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load demo data.', 'error');
    }
  };

  const handleClearDemo = async () => {
    try {
      const res = await apiClient.clearDemoData();
      showToast(res.message || 'Demo data successfully cleared.', 'success');
      setShowClearDemoModal(false);
      await refreshStats();
      setActiveTab('dashboard');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to clear demo data.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        stats,
        hasData,
        isDemoActive,
        loadingStats,
        refreshStats,
        showToast,
        showDemoModal,
        setShowDemoModal,
        showClearDemoModal,
        setShowClearDemoModal,
        showCsvModal,
        setShowCsvModal,
        explainModalData,
        setExplainModalData,
        handleLoadDemo,
        handleClearDemo,
      }}
    >
      {children}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium border flex items-center gap-2 transition-all transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-teal-900 text-teal-100 border-teal-700'
                : t.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-navy-900 text-white border-navy-700'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
