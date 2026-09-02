import React from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  CheckCircle2,
  Cpu,
  Zap,
  Layers,
  Database,
  Radio,
  ShieldCheck,
} from 'lucide-react';

interface EngineeringReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineeringReportModal: React.FC<EngineeringReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">NanoSense Microcontroller Core Architectural Justification Dossier</h2>
              <p className="text-xs text-slate-400">Formal Silicon Commit Design Review Document (DOC-NS-CORE-65LP)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 font-sans text-xs leading-relaxed print:text-black print:bg-white">
          {/* Document Meta Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">PROJECT</span>
              <span className="text-cyan-400 font-bold">NanoSense Core v1.0</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">PROCESS NODE</span>
              <span className="text-slate-200">TSMC 65nm LP CMOS</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">POWER TARGET</span>
              <span className="text-emerald-400">CR2032 220mAh (3-5 Yrs)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">STATUS</span>
              <span className="text-emerald-400 font-bold">COMMIT APPROVED</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400">1.</span> Executive Summary & Silicon Constraints
            </h3>
            <p className="text-slate-300 text-xs">
              NanoSense Devices produces ultra-low-power IoT nodes for smart-agriculture (dielectric soil moisture permittivity) and structural-health monitoring (bridge vibration FFT analysis). Powered exclusively by a single 3.0V CR2032 coin-cell battery (220 mAh capacity), average current consumption across sensing, computation, and deep sleep must remain strictly below <strong>5.5 µA</strong> to achieve a 4+ year deployment lifetime.
            </p>
          </div>

          {/* Section 2: Integer Arithmetic Architecture (Booth & Non-Restoring Divider) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400">2.</span> Integer Arithmetic Unit Justification (Booth Multiplier & Non-Restoring Divider)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Signed Multiplier: Radix-2 Booth's Algorithm</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Directly handles two's complement signed operands without magnitude-sign conversion overhead.</li>
                  <li>Skips addition on runs of 1s and 0s, slashing dynamic gate switching activity by ~35%.</li>
                  <li>Silicon footprint: 420 NAND2 gates (8-bit) / 1,180 NAND2 gates (16-bit) at 2.8 pJ/op.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Division Unit: Non-Restoring Algorithm</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Eliminates intermediate restore addition cycles required in standard restoring dividers.</li>
                  <li>Guarantees strict N-cycle execution determinism ($N=8$ or $16$) with no data-dependent jitter.</li>
                  <li>Total dynamic energy: 3.2 pJ per 8-bit division vs 4.5 pJ for restoring divider.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: IEEE-754 FPU */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400">3.</span> IEEE-754 Single-Precision FPU Add/Sub Micro-Architecture
            </h3>
            <p className="text-slate-300 text-xs">
              Sensor fusion routines (Kalman filter state updates and accelerometer baseline nulling) require 32-bit single-precision floating-point precision to avoid cumulative drift.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center">
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">PIPELINE DEPTH</span>
                  <span className="text-cyan-300 font-bold">3 Cycles (Pipelined)</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">ROUNDING MODE</span>
                  <span className="text-slate-200 font-bold">Round to Nearest Even (G/R/S)</span>
                </div>
                <div className="p-2 rounded bg-slate-900">
                  <span className="text-slate-400 block text-[10px]">EXCEPTION FLAGS</span>
                  <span className="text-emerald-300 font-bold">Overflow, Underflow, Inexact, NaN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: 5-Stage Pipeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400">4.</span> 5-Stage Pipeline & Hazard Mitigation Strategy
            </h3>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1.5">Configuration</th>
                    <th className="py-1.5">Cycles</th>
                    <th className="py-1.5">CPI</th>
                    <th className="py-1.5">Stall Cycles</th>
                    <th className="py-1.5">Silicon Gate Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-1.5 text-rose-400">Mode 1: No Forwarding</td>
                    <td className="py-1.5">16</td>
                    <td className="py-1.5">2.00</td>
                    <td className="py-1.5">8 cyc (50%)</td>
                    <td className="py-1.5">Baseline (0 gates)</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-cyan-400">Mode 2: Full Hardware Forwarding</td>
                    <td className="py-1.5">14</td>
                    <td className="py-1.5">1.75</td>
                    <td className="py-1.5">2 cyc (Load-use)</td>
                    <td className="py-1.5">+320 NAND2 gates</td>
                  </tr>
                  <tr className="font-bold text-emerald-400">
                    <td className="py-1.5">Mode 3: Compiler Reordering + Fwd</td>
                    <td className="py-1.5">12</td>
                    <td className="py-1.5">1.50</td>
                    <td className="py-1.5">0 cyc (0%)</td>
                    <td className="py-1.5">+320 NAND2 gates</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Cache Memory Architecture */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400">5.</span> Sensor Buffer Cache: Direct-Mapped vs 2-Way Set-Associative
            </h3>
            <p className="text-slate-300 text-xs">
              <strong>Final Choice: 256-Byte 2-Way Set-Associative Cache (16-Byte Line Size, LRU, Write-Back).</strong>
              <br />
              Justification: In sliding-window FIR and FFT calculations, the processor interleaves circular sample buffer access and calibration coefficient table access. In a Direct-Mapped cache, these addresses alias to the same set, inducing severe conflict thrashing (miss rate 24.3%, AMAT = 6.8 cyc). The 2-Way associative architecture eliminates conflict thrashing entirely (miss rate 4.2%, AMAT = 2.1 cyc), lowering overall memory subsystem energy by <strong>38%</strong>.
            </p>
          </div>

          {/* Section 6: I/O Interfacing Strategy (DMA vs Interrupt) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <span className="text-cyan-400">6.</span> ADC Streaming I/O: Autonomous Circular DMA Justification
            </h3>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-900/50 space-y-2">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Quantitative Battery Life Comparison (2,000 Hz Vibration Sampling)</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center font-mono">
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900/50">
                  <span className="text-rose-400 font-bold block">Interrupt-Driven Strategy</span>
                  <span className="text-lg font-bold text-rose-300">127 Days Longevity</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">I_avg = 62.4 µA (Duty: 2.6%)</span>
                </div>
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-900/50">
                  <span className="text-emerald-400 font-bold block">Autonomous Circular DMA</span>
                  <span className="text-lg font-bold text-emerald-300">4.8 Years Longevity</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">I_avg = 4.2 µA (14.8× savings)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sign-Off Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Prepared by: Embedded Core Architecture Design Group</span>
            <span>NanoSense Silicon Engineering Inc.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
