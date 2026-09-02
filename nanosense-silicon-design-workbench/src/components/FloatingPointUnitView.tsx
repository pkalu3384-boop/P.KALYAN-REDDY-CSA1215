import React, { useState } from 'react';
import { RoundingMode } from '../types';
import { simulateFPUAddSub, SENSOR_FPU_PRESETS, parseIEEE754Float } from '../utils/ieee754';
import {
  Zap,
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export const FloatingPointUnitView: React.FC = () => {
  const [operandAInput, setOperandAInput] = useState<number>(1.0245);
  const [operandBInput, setOperandBInput] = useState<number>(0.980665);
  const [operation, setOperation] = useState<'ADD' | 'SUB'>('SUB');
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('NEAREST_EVEN');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);

  // Run simulation
  const fpuResult = simulateFPUAddSub(operandAInput, operandBInput, operation, roundingMode);

  const applyPreset = (preset: (typeof SENSOR_FPU_PRESETS)[0]) => {
    setOperandAInput(preset.operandA);
    setOperandBInput(preset.operandB);
    setOperation(preset.operation);
    setSelectedStageIndex(0);
  };

  const activeStep = fpuResult.steps[selectedStageIndex] || fpuResult.steps[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">IEEE-754 Single-Precision FPU Add/Subtract Engine</h2>
            <p className="text-xs text-slate-400">
              Hardware floating-point arithmetic verification with alignment, G/R/S rounding, and exception flags
            </p>
          </div>
        </div>

        {/* Rounding Mode Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Rounding Mode:</span>
          <select
            value={roundingMode}
            onChange={(e) => setRoundingMode(e.target.value as RoundingMode)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="NEAREST_EVEN">Round to Nearest (Ties to Even)</option>
            <option value="TOWARD_ZERO">Round toward Zero (Truncate)</option>
            <option value="TOWARD_POS_INF">Round toward +Infinity (Ceiling)</option>
            <option value="TOWARD_NEG_INF">Round toward -Infinity (Floor)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operands & Sensor Fusion Presets */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Sensor Fusion Operands
            </h3>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sensor-Fusion & Edge-Case Presets:</span>
              </label>
              <div className="space-y-2">
                {SENSOR_FPU_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 group-hover:text-cyan-300">
                        {preset.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {preset.operation}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.description}</p>
                    <div className="mt-1.5 text-[10px] font-mono text-cyan-400/90 truncate">
                      {preset.contextFormula}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Float Inputs */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Operand A (Primary Sensor Reading)</span>
                  <span className="font-mono text-cyan-400">{fpuResult.operandA.hexString}</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={operandAInput}
                  onChange={(e) => setOperandAInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Operation Toggle (ADD / SUB) */}
              <div className="flex items-center justify-center gap-2 py-1">
                <button
                  onClick={() => setOperation('ADD')}
                  className={`px-4 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    operation === 'ADD'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ADD (+)
                </button>
                <button
                  onClick={() => setOperation('SUB')}
                  className={`px-4 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    operation === 'SUB'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  SUB (−)
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Operand B (Baseline / Predicted Reference)</span>
                  <span className="font-mono text-cyan-400">{fpuResult.operandB.hexString}</span>
                </div>
                <input
                  type="number"
                  step="any"
                  value={operandBInput}
                  onChange={(e) => setOperandBInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Hardware Flags Register */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-300 font-semibold flex items-center justify-between">
                <span>IEEE-754 Status Flags (FPSR)</span>
                <span className="font-mono text-[10px] text-slate-500">Latency: 3 Cycles</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-center text-[10px]">
                <div
                  className={`p-1.5 rounded border ${
                    fpuResult.flags.overflow
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  OVERFLOW
                </div>
                <div
                  className={`p-1.5 rounded border ${
                    fpuResult.flags.underflow
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  UNDERFLOW
                </div>
                <div
                  className={`p-1.5 rounded border ${
                    fpuResult.flags.inexact
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  INEXACT
                </div>
                <div
                  className={`p-1.5 rounded border ${
                    fpuResult.flags.invalid
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  INVALID / NaN
                </div>
                <div
                  className={`p-1.5 rounded border ${
                    fpuResult.flags.zero
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  ZERO (Z)
                </div>
                <div
                  className={`p-1.5 rounded border ${
                    fpuResult.flags.subnormal
                      ? 'bg-purple-950/80 text-purple-300 border-purple-600 font-bold'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  SUBNORMAL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 32-Bit Bit-Level Deconstruction & Pipeline Stages */}
        <div className="lg:col-span-8 space-y-4">
          {/* Binary IEEE-754 Bit Viewer */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              32-Bit Register Word Deconstruction (Sign, Biased Exponent, Mantissa)
            </h3>

            {/* Operand A Deconstruct */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Operand A: {fpuResult.operandA.rawFloat}</span>
                <span className="font-mono text-slate-400">
                  Exp = {fpuResult.operandA.exponent} (2^{fpuResult.operandA.unbiasedExp})
                </span>
              </div>
              <div className="flex font-mono text-[11px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                <div
                  title="Sign (1 bit)"
                  className="bg-rose-950/90 text-rose-300 px-2 py-1.5 border-r border-rose-800 font-bold"
                >
                  {fpuResult.operandA.sign}
                </div>
                <div
                  title="Biased Exponent (8 bits, Bias = 127)"
                  className="bg-indigo-950/90 text-indigo-300 px-3 py-1.5 border-r border-indigo-800 font-semibold"
                >
                  {fpuResult.operandA.binaryString.slice(1, 9)}
                </div>
                <div
                  title="Significand / Mantissa Fraction (23 bits)"
                  className="bg-emerald-950/90 text-emerald-300 px-3 py-1.5 flex-1 break-all"
                >
                  {fpuResult.operandA.binaryString.slice(9)}
                </div>
              </div>
            </div>

            {/* Operand B Deconstruct */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Operand B: {fpuResult.operandB.rawFloat}</span>
                <span className="font-mono text-slate-400">
                  Exp = {fpuResult.operandB.exponent} (2^{fpuResult.operandB.unbiasedExp})
                </span>
              </div>
              <div className="flex font-mono text-[11px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                <div
                  title="Sign (1 bit)"
                  className="bg-rose-950/90 text-rose-300 px-2 py-1.5 border-r border-rose-800 font-bold"
                >
                  {fpuResult.operandB.sign}
                </div>
                <div
                  title="Biased Exponent (8 bits)"
                  className="bg-indigo-950/90 text-indigo-300 px-3 py-1.5 border-r border-indigo-800 font-semibold"
                >
                  {fpuResult.operandB.binaryString.slice(1, 9)}
                </div>
                <div
                  title="Significand (23 bits)"
                  className="bg-emerald-950/90 text-emerald-300 px-3 py-1.5 flex-1 break-all"
                >
                  {fpuResult.operandB.binaryString.slice(9)}
                </div>
              </div>
            </div>

            {/* Result Word Deconstruct */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300">
                  FPU Result: {fpuResult.result.rawFloat} ({fpuResult.result.hexString})
                </span>
                <span className="font-mono text-cyan-400">
                  Exp = {fpuResult.result.exponent} (2^{fpuResult.result.unbiasedExp})
                </span>
              </div>
              <div className="flex font-mono text-[11px] rounded-lg overflow-hidden border border-cyan-500/50 shadow-inner">
                <div
                  title="Sign (1 bit)"
                  className="bg-rose-900 text-rose-200 px-2 py-1.5 border-r border-rose-700 font-bold"
                >
                  {fpuResult.result.sign}
                </div>
                <div
                  title="Biased Exponent (8 bits)"
                  className="bg-indigo-900 text-indigo-200 px-3 py-1.5 border-r border-indigo-700 font-semibold"
                >
                  {fpuResult.result.binaryString.slice(1, 9)}
                </div>
                <div
                  title="Significand (23 bits)"
                  className="bg-emerald-900 text-emerald-200 px-3 py-1.5 flex-1 break-all"
                >
                  {fpuResult.result.binaryString.slice(9)}
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step FPU Pipeline Inspector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                FPU Add/Sub Micro-Architecture Pipeline Stages
              </h3>
              <div className="flex gap-1">
                {fpuResult.steps.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedStageIndex(idx)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                      selectedStageIndex === idx
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Stage {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Detail Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-500/20">
                    {activeStep.stage}
                  </span>
                  <h4 className="text-sm font-bold text-white">{activeStep.title}</h4>
                </div>
              </div>

              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {activeStep.description}
              </div>

              {/* Guard, Round, Sticky (G, R, S) bit indicator if in alignment / normalization */}
              {activeStep.regState.guardBit !== undefined && (
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-xs">
                  <div className="p-1 rounded bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Guard Bit (G)</span>
                    <span className="text-amber-400 font-bold">{activeStep.regState.guardBit}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Round Bit (R)</span>
                    <span className="text-amber-400 font-bold">{activeStep.regState.roundBit}</span>
                  </div>
                  <div className="p-1 rounded bg-slate-950">
                    <span className="text-[10px] text-slate-400 block">Sticky Bit (S)</span>
                    <span className="text-amber-400 font-bold">{activeStep.regState.stickyBit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
