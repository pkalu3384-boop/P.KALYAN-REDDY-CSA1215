import React, { useState } from 'react';
import { IoSimulationConfig } from '../types';
import { calculateIoPowerMetrics, SENSOR_IO_PROFILES } from '../utils/ioPowerModel';
import {
  Radio,
  Battery,
  Zap,
  Activity,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';

export const IoStrategyView: React.FC = () => {
  const [samplingRateHz, setSamplingRateHz] = useState<number>(2000); // 2 kHz structural vibration default
  const [adcResolutionBits, setAdcResolutionBits] = useState<8 | 12 | 16>(16);
  const [bufferBlockSize, setBufferBlockSize] = useState<number>(64);
  const [mcuClockMHz, setMcuClockMHz] = useState<number>(32);
  const [mcuActiveCurrentMA, setMcuActiveCurrentMA] = useState<number>(2.4);
  const [mcuSleepCurrentUA, setMcuSleepCurrentUA] = useState<number>(0.8);
  const [wakeUpTimeUs, setWakeUpTimeUs] = useState<number>(12);
  const [isrCyclesPerSample, setIsrCyclesPerSample] = useState<number>(38);

  const config: IoSimulationConfig = {
    samplingRateHz,
    adcResolutionBits,
    bufferBlockSize,
    mcuClockMHz,
    mcuActiveCurrentMA,
    mcuSleepCurrentUA,
    wakeUpTimeMicroSeconds: wakeUpTimeUs,
    isrCyclesPerSample,
    dmaActiveCurrentUA: 45,
    dmaTransferCycles: 2,
    coinCellCapacityMAh: 220,
    operatingVoltage: 3.0,
  };

  const results = calculateIoPowerMetrics(config);

  const applyProfile = (profile: (typeof SENSOR_IO_PROFILES)[0]) => {
    setSamplingRateHz(profile.samplingRateHz);
    setAdcResolutionBits(profile.adcResolutionBits);
    setBufferBlockSize(profile.bufferBlockSize);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">ADC I/O Interfacing Strategy: Interrupt vs DMA Simulator</h2>
            <p className="text-xs text-slate-400">
              Quantitative evaluation of power dissipation, duty cycle & battery life on CR2032 coin cell
            </p>
          </div>
        </div>

        {/* Recommended Strategy Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Core Architecture Decision:</span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
              results.recommendedStrategy === 'DMA'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-md shadow-emerald-950/50'
                : results.recommendedStrategy === 'HYBRID'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}
          >
            {results.recommendedStrategy === 'DMA' && 'RECOMMEND: DMA-BASED STREAMING'}
            {results.recommendedStrategy === 'HYBRID' && 'RECOMMEND: HYBRID DMA/INTERRUPT'}
            {results.recommendedStrategy === 'INTERRUPT' && 'RECOMMEND: INTERRUPT-DRIVEN'}
          </span>
        </div>
      </div>

      {/* Sensor Domain Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SENSOR_IO_PROFILES.map((profile) => (
          <button
            key={profile.id}
            onClick={() => applyProfile(profile)}
            className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200 group-hover:text-cyan-300">
                {profile.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                {profile.samplingRateHz} Hz
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{profile.description}</p>
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              Domain: <span className="text-slate-300">{profile.domain}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Side-by-Side Quantitative Power & Battery Longevity Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy A: Interrupt-Driven */}
        <div className="p-5 rounded-xl bg-slate-900 border border-rose-950/80 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <h3 className="text-sm font-bold text-white">Strategy A: Interrupt-Driven ADC Sampling</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              ISR per Sample
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Every incoming ADC sample fires an IRQ. The CPU wakes up from deep sleep ({wakeUpTimeUs} µs), saves 16 core registers, executes ISR to read APB bus and update ring-buffer index, restores context, and returns to sleep.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Average Current (I_avg)</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {results.interrupt.avgCurrentUA} <span className="text-xs font-normal text-slate-400">µA</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">CR2032 Battery Longevity</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {results.interrupt.batteryLifetimeYears < 1
                  ? `${results.interrupt.batteryLifetimeDays} Days`
                  : `${results.interrupt.batteryLifetimeYears} Years`}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">CPU Active Duty Cycle</div>
              <div className="text-lg font-bold font-mono text-rose-300 mt-0.5">
                {results.interrupt.cpuActiveDutyCyclePercent}%
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Annual Energy Used</div>
              <div className="text-lg font-bold font-mono text-rose-300 mt-0.5">
                {results.interrupt.annualEnergyMilliWattHours} mWh
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-200/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>High-Frequency Bottleneck:</strong> Context switching and wake-up latencies consume {results.interrupt.cpuWakeupsPerSecond} wakeups/sec, causing severe CPU thrashing and high latency jitter ({results.interrupt.latencyJitterMicroSeconds} µs).
            </div>
          </div>
        </div>

        {/* Strategy B: DMA-Based */}
        <div className="p-5 rounded-xl bg-slate-900 border border-emerald-950/80 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <h3 className="text-sm font-bold text-white">Strategy B: Autonomous Circular DMA Streaming</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              {results.powerSavingsRatio}× Longer Battery Life
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Hardware DMA peripheral controller autonomously transfers ADC samples directly to SRAM circular buffer in 2 bus cycles per sample. CPU sleeps at {mcuSleepCurrentUA} µA and only wakes up once per {bufferBlockSize} samples ({results.dma.cpuWakeupsPerSecond} wakeups/sec).
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Average Current (I_avg)</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {results.dma.avgCurrentUA} <span className="text-xs font-normal text-slate-400">µA</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">CR2032 Battery Longevity</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
                {results.dma.batteryLifetimeYears} <span className="text-xs font-normal text-slate-400">Years</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">CPU Active Duty Cycle</div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                {results.dma.cpuActiveDutyCyclePercent}%
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Annual Energy Used</div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                {results.dma.annualEnergyMilliWattHours} mWh
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-200/90 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Optimal Low-Power Silicon Design:</strong> Reduces average current by {results.powerSavingsRatio}× and achieves sub-microsecond sampling jitter ({results.dma.latencyJitterMicroSeconds} µs) for ~2,650 gates.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Parameter Controls & Silicon Area Trade-off */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Dynamic Operating Parameter Sliders</span>
            <span className="text-[10px] font-mono text-cyan-400">Real-Time Evaluation</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Sampling Rate */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">ADC Sampling Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{samplingRateHz.toLocaleString()} Hz</span>
              </div>
              <input
                type="range"
                min="10"
                max="10000"
                step="10"
                value={samplingRateHz}
                onChange={(e) => setSamplingRateHz(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>10 Hz (Soil/Weather)</span>
                <span>1 kHz (Acoustic)</span>
                <span>10 kHz (Structural Vibration)</span>
              </div>
            </div>

            {/* Buffer Block Size */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">DMA Circular Buffer Block Size (N)</span>
                <span className="font-mono text-cyan-400 font-bold">{bufferBlockSize} Samples</span>
              </div>
              <input
                type="range"
                min="16"
                max="256"
                step="16"
                value={bufferBlockSize}
                onChange={(e) => setBufferBlockSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Wakeup Latency */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">CPU Deep Sleep Wake-Up Latency</span>
                <span className="font-mono text-cyan-400 font-bold">{wakeUpTimeUs} µs</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={wakeUpTimeUs}
                onChange={(e) => setWakeUpTimeUs(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Core Clock */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Core Clock Frequency</span>
                <span className="font-mono text-cyan-400 font-bold">{mcuClockMHz} MHz</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[16, 24, 32, 48].map((clk) => (
                  <button
                    key={clk}
                    onClick={() => setMcuClockMHz(clk)}
                    className={`py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                      mcuClockMHz === clk
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {clk} MHz
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Silicon Area vs Power Justification Panel */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Silicon Area vs Power Justification</span>
            <span className="text-[10px] font-mono text-emerald-400">Silicon Sign-Off Evidence</span>
          </h3>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Hardware Gate Complexity Comparison:</span>
              <span className="text-cyan-400 font-mono">65nm LP Standard Cell</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Interrupt Controller NVIC Logic:</span>
                <span className="text-slate-200">~450 NAND2 Gates (0.0018 mm²)</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900">
                <span className="text-slate-400">Autonomous 2-Channel Circular DMA Engine:</span>
                <span className="text-emerald-400 font-bold">~2,650 NAND2 Gates (0.0106 mm²)</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-2 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Architectural Verdict for NanoSense Node:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {results.justificationText}
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The ~2,200 gate silicon area delta amounts to <strong className="text-slate-200">less than $0.004 per die</strong> on 65nm LP silicon, while extending CR2032 coin-cell operation from <strong className="text-rose-400">{results.interrupt.batteryLifetimeDays} days</strong> to <strong className="text-emerald-400">{results.dma.batteryLifetimeYears} years</strong>. Committing a hardware circular DMA engine to silicon is definitively justified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
