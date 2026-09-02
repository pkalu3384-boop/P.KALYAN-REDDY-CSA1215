import React, { useState } from 'react';
import { HazardMitigationMode } from '../types';
import {
  simulatePipeline,
  DEFAULT_SENSOR_FUSION_PROGRAM,
  REORDERED_SENSOR_FUSION_PROGRAM,
} from '../utils/pipelineSimulator';
import {
  Layers,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Zap,
  Clock,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Info,
} from 'lucide-react';

export const PipelineSimulatorView: React.FC = () => {
  const [mitigationMode, setMitigationMode] = useState<HazardMitigationMode>('FULL_FORWARDING');
  const [highlightCycle, setHighlightCycle] = useState<number | null>(null);

  const currentSimulation = simulatePipeline(DEFAULT_SENSOR_FUSION_PROGRAM, mitigationMode);

  // Baseline No Forwarding simulation for comparison
  const baselineSimulation = simulatePipeline(DEFAULT_SENSOR_FUSION_PROGRAM, 'NO_FORWARDING');
  const fullFwdSimulation = simulatePipeline(DEFAULT_SENSOR_FUSION_PROGRAM, 'FULL_FORWARDING');
  const reorderedSimulation = simulatePipeline(DEFAULT_SENSOR_FUSION_PROGRAM, 'FORWARDING_AND_REORDERING');

  const speedupVsBaseline = +(
    (baselineSimulation.totalCycles - currentSimulation.totalCycles) /
    baselineSimulation.totalCycles *
    100
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">5-Stage Instruction Pipeline Simulator (IF-ID-EX-MEM-WB)</h2>
            <p className="text-xs text-slate-400">
              Sensor-fusion micro-routine hazard detection, hardware forwarding paths & compiler scheduling
            </p>
          </div>
        </div>

        {/* Hazard Mitigation Mode Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setMitigationMode('NO_FORWARDING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mitigationMode === 'NO_FORWARDING'
                ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. No Forwarding (Stalls)
          </button>
          <button
            onClick={() => setMitigationMode('FULL_FORWARDING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mitigationMode === 'FULL_FORWARDING'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Full Hardware Forwarding
          </button>
          <button
            onClick={() => setMitigationMode('FORWARDING_AND_REORDERING')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              mitigationMode === 'FORWARDING_AND_REORDERING'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Compiler Reordering + Fwd
          </button>
        </div>
      </div>

      {/* Quantitative Before / After Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cycles */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Execution Latency</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {currentSimulation.totalCycles} <span className="text-xs font-normal text-slate-400">Cycles</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Baseline: {baselineSimulation.totalCycles} cyc</span>
            <span className="text-emerald-400 font-semibold font-mono">
              ({speedupVsBaseline >= 0 ? `-${speedupVsBaseline}%` : `+${Math.abs(+speedupVsBaseline)}%`})
            </span>
          </div>
        </div>

        {/* CPI / IPC */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Cycles Per Instruction (CPI)</span>
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {currentSimulation.cpi}{' '}
            <span className="text-xs font-normal text-slate-400">(IPC: {currentSimulation.ipc})</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Ideal Pipeline Target: <span className="font-mono text-slate-200">1.00 CPI</span>
          </div>
        </div>

        {/* Stall Cycles */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Pipeline Stall Bubbles</span>
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {currentSimulation.stallCycles}{' '}
            <span className="text-xs font-normal text-slate-400">Cycles Stalled</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Wasted Battery Power: <span className="font-mono text-amber-400">{((currentSimulation.stallCycles / currentSimulation.totalCycles) * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Silicon Energy per Routine */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Energy per Sensor Fusion Run</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {+(currentSimulation.totalCycles * 1.8).toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">pJ @ 1.2V</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Est. at 32 MHz, 65nm LP logic
          </div>
        </div>
      </div>

      {/* Main Gantt Space-Time Diagram */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>Cycle-by-Cycle Space-Time Pipeline Matrix</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {currentSimulation.program.length} Instructions × {currentSimulation.totalCycles} Clock Cycles
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover or click on any cycle column to inspect pipeline register snapshot and active forwarding buses.
            </p>
          </div>

          {/* Stage Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-700">IF: Fetch</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700">ID: Decode</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-700">EX: Execute</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-300 border border-purple-700">MEM: Memory</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">WB: WriteBack</span>
          </div>
        </div>

        {/* Space-Time Table */}
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3 text-left w-56 sticky left-0 bg-slate-950 z-10">Instruction Assembly</th>
                {Array.from({ length: currentSimulation.totalCycles }, (_, i) => i + 1).map((cycle) => (
                  <th
                    key={cycle}
                    onClick={() => setHighlightCycle(highlightCycle === cycle ? null : cycle)}
                    className={`py-2 px-2 text-center min-w-[36px] cursor-pointer transition-colors ${
                      highlightCycle === cycle
                        ? 'bg-cyan-950 text-cyan-300 border-b-2 border-cyan-400'
                        : 'hover:bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    C{cycle}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/60">
              {currentSimulation.program.map((instr, rIdx) => (
                <tr key={instr.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-left font-semibold text-slate-200 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-mono">0x{instr.pc.toString(16).padStart(4, '0')}</span>
                      <span className="text-cyan-400">{instr.asm}</span>
                    </div>
                  </td>
                  {Array.from({ length: currentSimulation.totalCycles }, (_, cIdx) => {
                    const cell = currentSimulation.grid[rIdx]?.[cIdx];
                    const isCycleHighlighted = highlightCycle === cIdx + 1;
                    return (
                      <td
                        key={cIdx}
                        className={`py-2 px-1 text-center font-bold transition-all ${
                          isCycleHighlighted ? 'bg-slate-800/80' : ''
                        }`}
                      >
                        {cell?.stage ? (
                          <span
                            className={`inline-block w-7 py-0.5 rounded text-[10px] shadow-sm ${
                              cell.stage === 'IF'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : cell.stage === 'ID'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : cell.stage === 'EX'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : cell.stage === 'MEM'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : cell.stage === 'WB'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {cell.stage}
                          </span>
                        ) : (
                          <span className="text-slate-700">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hazard Detection Log & Mitigation Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          {/* Hazards Detected */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-400" />
                <span>Detected Hazards in Routine</span>
              </div>
              <span className="font-mono text-amber-400">{currentSimulation.hazards.length} Events</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {currentSimulation.hazards.length === 0 ? (
                <div className="p-3 text-center text-slate-500 italic">
                  No hazards detected in current configuration!
                </div>
              ) : (
                currentSimulation.hazards.map((h, i) => (
                  <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-300">
                        Cycle {h.cycle}: {h.type}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 rounded bg-slate-800 text-slate-400">
                        {h.mitigation}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{h.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Architectural Trade-Off Analysis */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Architectural Mitigation Recommendation</span>
            </div>

            <div className="space-y-2 text-slate-400 leading-relaxed text-[11px]">
              <p>
                • <strong className="text-slate-200">Mode 1 (No Forwarding):</strong> Suffers from severe RAW data stalls (Load-Use and ALU-ALU dependencies on R1, R2, R6), consuming{' '}
                <span className="font-mono text-rose-400">{baselineSimulation.totalCycles} cycles</span> and dropping CPI to {baselineSimulation.cpi}.
              </p>
              <p>
                • <strong className="text-slate-200">Mode 2 (Hardware Forwarding):</strong> Adding EX→EX and MEM→EX forwarding multiplexers reduces latency to{' '}
                <span className="font-mono text-cyan-400">{fullFwdSimulation.totalCycles} cycles</span>, with only a 1-cycle bubble for the LW load-use hazard. Gate cost overhead is only ~320 NAND2 equivalents.
              </p>
              <p>
                • <strong className="text-slate-200">Mode 3 (Compiler Reordering):</strong> By rescheduling the independent threshold load (<code className="text-cyan-300 font-mono">LW R6, 4(R4)</code>) and pointer advance (<code className="text-cyan-300 font-mono">ADDI R4</code>), the compiler eliminates all load-use stalls with zero extra silicon gates, achieving the ideal{' '}
                <span className="font-mono text-emerald-400">{reorderedSimulation.totalCycles} cycles (CPI: {reorderedSimulation.cpi})</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
