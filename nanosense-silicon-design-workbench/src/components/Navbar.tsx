import React from 'react';
import { Cpu, Zap, Activity, Layers, Database, Radio, FileText, Battery } from 'lucide-react';

interface NavbarProps {
  activeTab: 'arithmetic' | 'fpu' | 'pipeline' | 'cache' | 'io' | 'report';
  setActiveTab: (tab: 'arithmetic' | 'fpu' | 'pipeline' | 'cache' | 'io' | 'report') => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenReport }) => {
  const tabs = [
    { id: 'arithmetic', label: '1. Integer Arithmetic Unit', icon: Cpu, badge: 'Booth & Divider' },
    { id: 'fpu', label: '2. IEEE-754 FPU Add/Sub', icon: Zap, badge: 'Sensor Fusion FPU' },
    { id: 'pipeline', label: '3. 5-Stage Core Pipeline', icon: Layers, badge: 'Hazard & Forwarding' },
    { id: 'cache', label: '4. Sensor Cache & Memory', icon: Database, badge: 'Buffer AMAT & Sets' },
    { id: 'io', label: '5. ADC I/O: Interrupt vs DMA', icon: Radio, badge: 'CR2032 Power Model' },
  ] as const;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Meta Status Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400 uppercase tracking-wider">Silicon Prototype Mode</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Target Process: <span className="text-slate-200 font-mono">65nm LP CMOS</span></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Core Clock: <span className="text-slate-200 font-mono">32 MHz @ 1.2V</span></span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700/50">
            <Battery className="w-3.5 h-3.5 text-amber-400" />
            <span>Power Source: <strong className="text-slate-200 font-mono">CR2032 3.0V (220 mAh)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700/50">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Longevity: <strong className="text-cyan-300 font-mono">3–5 Years</strong></span>
          </div>
        </div>
      </div>

      {/* Main Header & Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">NanoSense Devices</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">Core Architecture Lab</span>
            </div>
            <p className="text-xs text-slate-400">Ultra-Low-Power Microcontroller Core & Memory Subsystem Prototyping</p>
          </div>
        </div>

        {/* Silicon Justification Dossier CTA */}
        <button
          id="btn-open-dossier"
          onClick={onOpenReport}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Silicon Justification Dossier</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
        <nav className="flex space-x-1 py-1 border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
