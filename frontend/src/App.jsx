import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DemoBanner } from './components/DemoBanner';
import { ConfirmModal } from './components/ConfirmModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { GeminiExplainModal } from './components/GeminiExplainModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { PhcNetwork } from './pages/PhcNetwork';
import { MedicineStock } from './pages/MedicineStock';
import { FootfallTracker } from './pages/FootfallTracker';
import { BedCapacity } from './pages/BedCapacity';
import { StaffAttendance } from './pages/StaffAttendance';
import { DemandForecast } from './pages/DemandForecast';
import { EarlyWarnings } from './pages/EarlyWarnings';
import { RedistributionPlan } from './pages/RedistributionPlan';
import { FederatedLearning } from './pages/FederatedLearning';
import { GeminiAssistant } from './pages/GeminiAssistant';
import { EmergencySimulation } from './pages/EmergencySimulation';
import { BricsScalability } from './pages/BricsScalability';
import { Settings } from './pages/Settings';
import { MapPage } from './pages/MapPage';

export function App() {
  const {
    activeTab,
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
  } = useApp();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'phcs':
        return <PhcNetwork />;
      case 'stock':
        return <MedicineStock />;
      case 'footfall':
        return <FootfallTracker />;
      case 'beds':
        return <BedCapacity />;
      case 'staff':
        return <StaffAttendance />;
      case 'forecast':
        return <DemandForecast />;
      case 'alerts':
        return <EarlyWarnings />;
      case 'redistribution':
        return <RedistributionPlan />;
      case 'federated':
        return <FederatedLearning />;
      case 'assistant':
        return <GeminiAssistant />;
      case 'emergency':
        return <EmergencySimulation />;
      case 'brics':
        return <BricsScalability />;
      case 'settings':
        return <Settings />;
      case 'map':
        return <MapPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <Navbar />

      {/* Demo Banner */}
      <DemoBanner />

      {/* Main Layout: Sidebar + Page Container */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>

      {/* Load Demo Data Confirm Modal */}
      <ConfirmModal
        isOpen={showDemoModal}
        title="Load synthetic demo data?"
        message="This action will generate realistic synthetic Primary Health Centres, medicine stock records, footfalls, bed capacities, staff logs, and 28 days of historical consumption across 3 distinct districts (Pune, Nashik, Thane). Every row will be tagged with is_demo=true and can be cleared at any time."
        confirmLabel="Load Demo Data"
        confirmVariant="teal"
        onConfirm={handleLoadDemo}
        onCancel={() => setShowDemoModal(false)}
      />

      {/* Clear Demo Data Confirm Modal */}
      <ConfirmModal
        isOpen={showClearDemoModal}
        title="Clear synthetic demo data?"
        message="This action will permanently delete only synthetic demo rows (is_demo=true) across all tables, returning your dashboard to its initial clean state without touching custom user records."
        confirmLabel="Clear Demo Data"
        confirmVariant="danger"
        onConfirm={handleClearDemo}
        onCancel={() => setShowClearDemoModal(false)}
      />

      {/* CSV Ingestion Modal */}
      <CsvUploadModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
      />

      {/* Gemini AI Explanation Modal */}
      <GeminiExplainModal
        isOpen={!!explainModalData}
        onClose={() => setExplainModalData(null)}
        data={explainModalData}
      />
    </div>
  );
}

export default App;
