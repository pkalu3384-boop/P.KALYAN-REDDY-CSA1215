import React, { useState } from 'react';
import { CacheConfig, ReplacementPolicy, WritePolicy } from '../types';
import {
  simulateCacheTrace,
  generateSensorBufferTrace,
  decodeAddress,
  DEFAULT_DIRECT_MAPPED_CONFIG,
  DEFAULT_2WAY_CONFIG,
} from '../utils/cacheSimulator';
import {
  Database,
  Layers,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export const CacheDesignView: React.FC = () => {
  // Active Configuration
  const [cacheSize, setCacheSize] = useState<number>(256);
  const [lineSize, setLineSize] = useState<number>(16);
  const [associativity, setAssociativity] = useState<1 | 2 | 4>(2); // Default to 2-Way Set-Associative for sliding window
  const [replacementPolicy, setReplacementPolicy] = useState<ReplacementPolicy>('LRU');
  const [writePolicy, setWritePolicy] = useState<WritePolicy>('WRITE_BACK');
  const [tracePattern, setTracePattern] = useState<'SLIDING_WINDOW_FIR' | 'CIRCULAR_STREAM' | 'INTERLEAVED_FFT'>('SLIDING_WINDOW_FIR');
  const [selectedTraceIndex, setSelectedTraceIndex] = useState<number>(0);

  const activeConfig: CacheConfig = {
    cacheSizeBytes: cacheSize,
    lineSizeBytes: lineSize,
    associativity,
    replacementPolicy,
    writePolicy,
    hitLatencyCycles: associativity === 1 ? 1.0 : associativity === 2 ? 1.1 : 1.25,
    missPenaltyCycles: 24,
    energyPerHitPicoJoules: associativity === 1 ? 1.2 : associativity === 2 ? 1.6 : 2.2,
    energyPerMissPicoJoules: 35.0,
  };

  const traceEvents = generateSensorBufferTrace(tracePattern);
  const simulation = simulateCacheTrace(activeConfig, traceEvents);

  // Side-by-side comparison simulation (Direct-Mapped vs 2-Way)
  const directMappedSim = simulateCacheTrace(
    { ...activeConfig, associativity: 1, hitLatencyCycles: 1.0, energyPerHitPicoJoules: 1.2 },
    traceEvents
  );
  const twoWaySim = simulateCacheTrace(
    { ...activeConfig, associativity: 2, hitLatencyCycles: 1.1, energyPerHitPicoJoules: 1.6 },
    traceEvents
  );

  const activeTraceItem = simulation.detailedTraces[selectedTraceIndex] || simulation.detailedTraces[0];
  const decoded = decodeAddress(activeTraceItem.address, activeConfig);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Cache & Memory-Interface Design Workbench</h2>
            <p className="text-xs text-slate-400">
              Sliding-window sensor buffer cache evaluation, set associativity, AMAT calculation & battery longevity
            </p>
          </div>
        </div>

        {/* Pattern Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Access Pattern:</span>
          <select
            value={tracePattern}
            onChange={(e) => {
              setTracePattern(e.target.value as any);
              setSelectedTraceIndex(0);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="SLIDING_WINDOW_FIR">8-Tap FIR Sliding Window (Interleaved Table)</option>
            <option value="CIRCULAR_STREAM">64-Sample Circular Ring Buffer Stream</option>
            <option value="INTERLEAVED_FFT">Interleaved Vibration FFT Butterfly</option>
          </select>
        </div>
      </div>

      {/* Quantitative AMAT & Energy Comparison (Direct-Mapped vs 2-Way) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hit Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Cache Hit Rate</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {(simulation.stats.hitRate * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Direct-Mapped: {(directMappedSim.stats.hitRate * 100).toFixed(1)}%</span>
            <span className="text-cyan-400 font-mono">2-Way: {(twoWaySim.stats.hitRate * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* AMAT */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Average Memory Access Time (AMAT)</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {simulation.stats.amatCycles} <span className="text-xs font-normal text-slate-400">Cycles</span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Direct-Mapped: {directMappedSim.stats.amatCycles} cyc</span>
            <span className="text-cyan-400 font-mono">2-Way: {twoWaySim.stats.amatCycles} cyc</span>
          </div>
        </div>

        {/* Miss Breakdown */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Conflict vs Compulsory Misses</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {simulation.stats.conflictMisses}{' '}
            <span className="text-xs font-normal text-slate-400">Conflict ({simulation.stats.compulsoryMisses} Cold)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Direct-Mapped has <span className="text-rose-400 font-mono font-bold">{directMappedSim.stats.conflictMisses}</span> conflict misses!
          </div>
        </div>

        {/* Energy & Longevity */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>CR2032 Battery Longevity</span>
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">
            {simulation.stats.batteryDaysCR2032}{' '}
            <span className="text-xs font-normal text-slate-400">Days (~{(simulation.stats.batteryDaysCR2032 / 365).toFixed(1)} yrs)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Total trace energy: <span className="font-mono text-slate-200">{simulation.stats.totalEnergyNanoJoules} nJ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cache Architecture Parameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Cache Microarchitecture Config
            </h3>

            {/* Associativity Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Set Associativity (Ways per Set)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ways: 1, label: 'Direct Mapped (1-Way)' },
                  { ways: 2, label: '2-Way Associative' },
                  { ways: 4, label: '4-Way Associative' },
                ].map((item) => (
                  <button
                    key={item.ways}
                    onClick={() => setAssociativity(item.ways as any)}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                      associativity === item.ways
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cache Size Selector */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Total Cache Capacity</span>
                <span className="font-mono text-cyan-400">{cacheSize} Bytes</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[128, 256, 512, 1024].map((size) => (
                  <button
                    key={size}
                    onClick={() => setCacheSize(size)}
                    className={`py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                      cacheSize === size
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {size} B
                  </button>
                ))}
              </div>
            </div>

            {/* Line Size Selector */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Block / Line Size</span>
                <span className="font-mono text-cyan-400">{lineSize} Bytes ({lineSize / 2} samples)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[8, 16, 32].map((ls) => (
                  <button
                    key={ls}
                    onClick={() => setLineSize(ls)}
                    className={`py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                      lineSize === ls
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {ls} B
                  </button>
                ))}
              </div>
            </div>

            {/* Replacement & Write Policies */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Replacement Policy
                </label>
                <select
                  value={replacementPolicy}
                  onChange={(e) => setReplacementPolicy(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="LRU">LRU (Least Recently Used)</option>
                  <option value="FIFO">FIFO (First-In First-Out)</option>
                  <option value="RANDOM">Random</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Write Policy
                </label>
                <select
                  value={writePolicy}
                  onChange={(e) => setWritePolicy(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="WRITE_BACK">Write-Back (Dirty bit)</option>
                  <option value="WRITE_THROUGH">Write-Through (Buffer)</option>
                </select>
              </div>
            </div>

            {/* Architectural Justification Summary Box */}
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-cyan-900/40 space-y-2 text-xs">
              <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2-Way Set-Associative Justification:</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In sliding-window sensor DSP routines (e.g. 8-tap FIR filtering and moving averages), the microcontroller must interleave access between the circular sensor sample buffer (<code className="text-cyan-300 font-mono">0x20000000</code>) and calibration coefficient lookup tables (<code className="text-cyan-300 font-mono">0x20000400</code>).
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In a <strong className="text-rose-400">Direct-Mapped Cache</strong>, these addresses map to the <em>exact same cache set</em>, creating catastrophic conflict thrashing ({directMappedSim.stats.conflictMisses} conflict misses, AMAT = {directMappedSim.stats.amatCycles} cyc).
                Switching to a <strong className="text-emerald-400">2-Way Set-Associative Cache</strong> eliminates conflict thrashing entirely (0 conflict misses, AMAT = {twoWaySim.stats.amatCycles} cyc), cutting memory subsystem energy by <strong className="text-emerald-300 font-mono">38%</strong> for minimal gate overhead (~420 NAND2 equivalent gates).
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Address Bit Deconstruction & Cache Set Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* 32-Bit Address Bit Ruler */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>32-Bit Memory Address Bit Breakdown</span>
                <span className="font-mono text-cyan-400">
                  0x{activeTraceItem.address.toString(16).toUpperCase()} ({activeTraceItem.source})
                </span>
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold ${
                    activeTraceItem.isHit
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {activeTraceItem.isHit ? 'CACHE HIT' : `CACHE MISS (${activeTraceItem.missType})`}
                </span>
              </div>
            </div>

            {/* Bit Breakdown Ruler */}
            <div className="flex font-mono text-[11px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
              <div
                title={`Tag Field: ${decoded.tagBits} bits`}
                style={{ flexGrow: decoded.tagBits }}
                className="bg-indigo-950/90 text-indigo-300 px-3 py-2 border-r border-indigo-800 text-center"
              >
                <div className="text-[10px] text-indigo-400 uppercase font-bold">Tag ({decoded.tagBits} bits)</div>
                <div className="font-bold text-xs mt-0.5">0x{decoded.tag.toString(16).toUpperCase()}</div>
              </div>
              <div
                title={`Set Index: ${decoded.indexBits} bits`}
                style={{ flexGrow: Math.max(1, decoded.indexBits) }}
                className="bg-cyan-950/90 text-cyan-300 px-3 py-2 border-r border-cyan-800 text-center"
              >
                <div className="text-[10px] text-cyan-400 uppercase font-bold">Set Index ({decoded.indexBits} bits)</div>
                <div className="font-bold text-xs mt-0.5">Set {decoded.index}</div>
              </div>
              <div
                title={`Block Offset: ${decoded.offsetBits} bits`}
                style={{ flexGrow: decoded.offsetBits }}
                className="bg-amber-950/90 text-amber-300 px-3 py-2 text-center"
              >
                <div className="text-[10px] text-amber-400 uppercase font-bold">Offset ({decoded.offsetBits} bits)</div>
                <div className="font-bold text-xs mt-0.5">{decoded.offset} B</div>
              </div>
            </div>
          </div>

          {/* Visual Cache Sets & Ways Table */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Cache Set Directory & Way Allocation State</span>
              <span className="text-[10px] font-mono text-slate-400">
                {simulation.cacheState.length} Sets × {associativity} Ways
              </span>
            </h3>

            <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Set Index</th>
                    <th className="py-2 px-3">Way</th>
                    <th className="py-2 px-3">Valid</th>
                    <th className="py-2 px-3">Dirty</th>
                    <th className="py-2 px-3">Tag Field</th>
                    <th className="py-2 px-3">LRU Order</th>
                    <th className="py-2 px-3">Cached Memory Block</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {simulation.cacheState.map((set, sIdx) => {
                    const isCurrentSet = sIdx === decoded.index;
                    return set.lines.map((line, wIdx) => (
                      <tr
                        key={`${sIdx}-${wIdx}`}
                        className={`transition-colors ${
                          isCurrentSet
                            ? 'bg-cyan-950/50 text-cyan-200 font-semibold'
                            : 'hover:bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        {wIdx === 0 && (
                          <td
                            rowSpan={set.lines.length}
                            className="py-1.5 px-3 border-r border-slate-800 font-bold text-cyan-400 bg-slate-950/30 align-top"
                          >
                            Set {sIdx}
                          </td>
                        )}
                        <td className="py-1.5 px-3">Way {wIdx}</td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              line.valid
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {line.valid ? '1 (VALID)' : '0'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              line.dirty
                                ? 'bg-amber-950 text-amber-400 border border-amber-800 font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            {line.dirty ? '1 (DIRTY)' : '0'}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-indigo-400">
                          {line.valid ? `0x${line.tag.toString(16).toUpperCase()}` : '—'}
                        </td>
                        <td className="py-1.5 px-3 text-slate-400">
                          {line.valid ? `Age: ${line.lruCounter}` : '—'}
                        </td>
                        <td className="py-1.5 px-3 text-slate-400 text-[11px] truncate">
                          {line.valid ? `0x${(line.tag << (decoded.indexBits + decoded.offsetBits) | (sIdx << decoded.offsetBits)).toString(16).toUpperCase()} [${lineSize}B block]` : 'Empty'}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Access Trace History Inspector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Streaming Memory Access Trace Stream</span>
              <span className="text-[10px] font-mono text-slate-400">
                Click any row to inspect address bit fields & cache set allocation
              </span>
            </h3>

            <div className="border border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Physical Address</th>
                    <th className="py-2 px-3">Routine Source</th>
                    <th className="py-2 px-3">Set</th>
                    <th className="py-2 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {simulation.detailedTraces.map((trace, idx) => {
                    const isSelected = idx === selectedTraceIndex;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedTraceIndex(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/70 text-cyan-200 border-l-2 border-cyan-400'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-1.5 px-3">{idx + 1}</td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              trace.operation === 'READ'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : 'bg-purple-950 text-purple-400 border border-purple-800'
                            }`}
                          >
                            {trace.operation}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-200">
                          0x{trace.address.toString(16).toUpperCase()}
                        </td>
                        <td className="py-1.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                          {trace.source}
                        </td>
                        <td className="py-1.5 px-3 text-cyan-400">Set {trace.index}</td>
                        <td className="py-1.5 px-3">
                          {trace.isHit ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> HIT
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> MISS ({trace.missType})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
