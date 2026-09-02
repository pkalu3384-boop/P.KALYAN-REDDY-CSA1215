/**
 * NanoSense Devices - Microcontroller Core Architecture & Hardware Design Workbench
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ArithmeticUnitView } from './components/ArithmeticUnitView';
import { FloatingPointUnitView } from './components/FloatingPointUnitView';
import { PipelineSimulatorView } from './components/PipelineSimulatorView';
import { CacheDesignView } from './components/CacheDesignView';
import { IoStrategyView } from './components/IoStrategyView';
import { EngineeringReportModal } from './components/EngineeringReportModal';
import { Cpu, Zap, Layers, Database, Radio, FileText, ChevronRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'arithmetic' | 'fpu' | 'pipeline' | 'cache' | 'io' | 'report'
  >('arithmetic');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation & Status */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'report') {
            setIsReportModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'arithmetic' && <ArithmeticUnitView />}
        {activeTab === 'fpu' && <FloatingPointUnitView />}
        {activeTab === 'pipeline' && <PipelineSimulatorView />}
        {activeTab === 'cache' && <CacheDesignView />}
        {activeTab === 'io' && <IoStrategyView />}
      </main>

      {/* Engineering Silicon Justification Dossier Modal */}
      <EngineeringReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 text-slate-500 text-xs py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">NanoSense Devices</span>
            <span>•</span>
            <span>Ultra-Low-Power IoT Microcontroller Silicon Verification Lab</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>65nm LP CMOS</span>
            <span>CR2032 3.0V (220mAh)</span>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              View Full Design Dossier
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
