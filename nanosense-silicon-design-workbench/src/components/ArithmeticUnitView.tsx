import React, { useState, useEffect } from 'react';
import { BitWidth } from '../types';
import {
  simulateBoothRadix2,
  SENSOR_SCALING_PRESETS,
  toTwosComplementBin,
} from '../utils/boothMultiplier';
import {
  simulateRestoringDivision,
  simulateNonRestoringDivision,
  SENSOR_DIVISION_PRESETS,
} from '../utils/divider';
import {
  Cpu,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const ArithmeticUnitView: React.FC = () => {
  const [subModule, setSubModule] = useState<'BOOTH_MULTIPLIER' | 'DIVIDER'>('BOOTH_MULTIPLIER');

  // Multiplier State
  const [multBitWidth, setMultBitWidth] = useState<BitWidth>(8);
  const [multiplicandInput, setMultiplicandInput] = useState<number>(114);
  const [multiplierInput, setMultiplierInput] = useState<number>(18);
  const [currentMultStep, setCurrentMultStep] = useState<number>(0);
  const [isMultAutoPlaying, setIsMultAutoPlaying] = useState<boolean>(false);

  // Divider State
  const [divBitWidth, setDivBitWidth] = useState<BitWidth>(8);
  const [dividendInput, setDividendInput] = useState<number>(236);
  const [divisorInput, setDivisorInput] = useState<number>(16);
  const [divisionMethod, setDivisionMethod] = useState<'RESTORING' | 'NON_RESTORING'>('NON_RESTORING');
  const [currentDivStep, setCurrentDivStep] = useState<number>(0);
  const [isDivAutoPlaying, setIsDivAutoPlaying] = useState<boolean>(false);

  // Run Booth Simulation
  const boothResult = simulateBoothRadix2(multiplicandInput, multiplierInput, multBitWidth);

  // Run Division Simulation
  const divResult =
    divisionMethod === 'RESTORING'
      ? simulateRestoringDivision(dividendInput, divisorInput, divBitWidth)
      : simulateNonRestoringDivision(dividendInput, divisorInput, divBitWidth);

  // Auto-play interval for Multiplier
  useEffect(() => {
    let interval: any;
    if (isMultAutoPlaying) {
      interval = setInterval(() => {
        setCurrentMultStep((prev) => {
          if (prev < boothResult.steps.length - 1) {
            return prev + 1;
          } else {
            setIsMultAutoPlaying(false);
            return prev;
          }
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isMultAutoPlaying, boothResult.steps.length]);

  // Auto-play interval for Divider
  useEffect(() => {
    let interval: any;
    if (isDivAutoPlaying) {
      interval = setInterval(() => {
        setCurrentDivStep((prev) => {
          if (prev < divResult.steps.length - 1) {
            return prev + 1;
          } else {
            setIsDivAutoPlaying(false);
            return prev;
          }
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isDivAutoPlaying, divResult.steps.length]);

  // Helper for applying multiplier preset
  const applyMultPreset = (preset: (typeof SENSOR_SCALING_PRESETS)[0]) => {
    setMultBitWidth(preset.bitWidth);
    setMultiplicandInput(preset.multiplicand);
    setMultiplierInput(preset.multiplier);
    setCurrentMultStep(0);
    setIsMultAutoPlaying(false);
  };

  // Helper for applying division preset
  const applyDivPreset = (preset: (typeof SENSOR_DIVISION_PRESETS)[0]) => {
    setDivBitWidth(preset.bitWidth);
    setDividendInput(preset.dividend);
    setDivisorInput(preset.divisor);
    setCurrentDivStep(0);
    setIsDivAutoPlaying(false);
  };

  const activeBoothStep = boothResult.steps[currentMultStep] || boothResult.steps[0];
  const activeDivStep = divResult.steps[currentDivStep] || divResult.steps[0];

  return (
    <div className="space-y-6">
      {/* Sub-module Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Arithmetic Core Simulation Unit</h2>
            <p className="text-xs text-slate-400">
              Hardware verification of fixed-point signed multiplication & division for sensor scaling
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            id="btn-submod-booth"
            onClick={() => {
              setSubModule('BOOTH_MULTIPLIER');
              setCurrentMultStep(0);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              subModule === 'BOOTH_MULTIPLIER'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Booth Signed Multiplier
          </button>
          <button
            id="btn-submod-divider"
            onClick={() => {
              setSubModule('DIVIDER');
              setCurrentDivStep(0);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              subModule === 'DIVIDER'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Restoring / Non-Restoring Divider
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODULE 1: BOOTH MULTIPLIER
      ------------------------------------------------------------- */}
      {subModule === 'BOOTH_MULTIPLIER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Configuration & Sensor Presets */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Sensor Operands & Bit-Width
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setMultBitWidth(8);
                      setCurrentMultStep(0);
                    }}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${
                      multBitWidth === 8
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    8-Bit
                  </button>
                  <button
                    onClick={() => {
                      setMultBitWidth(16);
                      setCurrentMultStep(0);
                    }}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${
                      multBitWidth === 16
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    16-Bit
                  </button>
                </div>
              </div>

              {/* Sensor Scaling Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Representative Sensor Scaling Presets:</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SENSOR_SCALING_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyMultPreset(preset)}
                      className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 group-hover:text-cyan-300">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {preset.bitWidth}-bit
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.description}</p>
                      <div className="mt-1.5 text-[10px] font-mono text-cyan-400/90 flex items-center gap-2">
                        <span>M = {preset.multiplicand}</span>
                        <span>×</span>
                        <span>Q = {preset.multiplier}</span>
                        <span>→ Product = {preset.multiplicand * preset.multiplier}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input Controls */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Multiplicand M (Raw Sensor Reading)</span>
                    <span className="font-mono text-cyan-400">
                      {multiplicandInput} (0b{toTwosComplementBin(multiplicandInput, multBitWidth)})
                    </span>
                  </div>
                  <input
                    type="number"
                    value={multiplicandInput}
                    onChange={(e) => {
                      setMultiplicandInput(parseInt(e.target.value) || 0);
                      setCurrentMultStep(0);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Multiplier Q (Calibration Factor)</span>
                    <span className="font-mono text-cyan-400">
                      {multiplierInput} (0b{toTwosComplementBin(multiplierInput, multBitWidth)})
                    </span>
                  </div>
                  <input
                    type="number"
                    value={multiplierInput}
                    onChange={(e) => {
                      setMultiplierInput(parseInt(e.target.value) || 0);
                      setCurrentMultStep(0);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Hardware Estimates Card */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Synthesis Estimates (65nm LP)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cycles</div>
                    <div className="font-mono font-bold text-cyan-300">{boothResult.totalCycles}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Gate Count</div>
                    <div className="font-mono font-bold text-amber-300">{boothResult.gateCountEst} NAND2</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Energy / Op</div>
                    <div className="font-mono font-bold text-emerald-300">{boothResult.energyPicoJoules} pJ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Register Visualizer & Step Trace */}
          <div className="lg:col-span-8 space-y-4">
            {/* Live Register Dashboard */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Radix-2 Booth Multiplier Pipeline Registers</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Step {currentMultStep + 1} of {boothResult.steps.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeBoothStep.description}
                  </p>
                </div>

                {/* Step Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentMultStep(0);
                      setIsMultAutoPlaying(false);
                    }}
                    title="Reset to Step 0"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentMultStep((prev) => Math.max(0, prev - 1))}
                    disabled={currentMultStep === 0}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer text-xs font-medium"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setIsMultAutoPlaying(!isMultAutoPlaying)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow cursor-pointer"
                  >
                    {isMultAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isMultAutoPlaying ? 'Pause' : 'Auto Play'}</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMultStep((prev) => Math.min(boothResult.steps.length - 1, prev + 1))
                    }
                    disabled={currentMultStep === boothResult.steps.length - 1}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer text-xs font-medium flex items-center gap-1"
                  >
                    <span>Next</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bit Registers Display */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Accumulator A */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Accumulator (A)</span>
                    <span className="font-mono text-cyan-400">{activeBoothStep.accumulatorA}</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-emerald-400 tracking-wider break-all">
                    {activeBoothStep.binA}
                  </div>
                </div>

                {/* Multiplier Q */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Multiplier (Q)</span>
                    <span className="font-mono text-cyan-400">{activeBoothStep.multiplierQ}</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-cyan-400 tracking-wider break-all">
                    {activeBoothStep.binQ}
                  </div>
                </div>

                {/* Q-1 Bit */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Q-1 Flip-Flop</span>
                    <span className="font-mono text-cyan-400">Bit -1</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-amber-400 tracking-wider">
                    {activeBoothStep.qMinus1}
                  </div>
                </div>

                {/* Multiplicand M */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Multiplicand (M)</span>
                    <span className="font-mono text-cyan-400">{activeBoothStep.multiplicandM}</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-purple-400 tracking-wider break-all">
                    {toTwosComplementBin(activeBoothStep.multiplicandM, multBitWidth)}
                  </div>
                </div>
              </div>

              {/* Bit-Pair Decision Banner */}
              <div className="p-3 rounded-lg bg-slate-950/90 border border-cyan-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800">
                    (Q₀, Q₋₁) = ({activeBoothStep.qPair[0]}, {activeBoothStep.qPair[1]})
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-200">
                    {activeBoothStep.qPair === '10' && 'End of 1s string → Subtract M (A ← A - M)'}
                    {activeBoothStep.qPair === '01' && 'Beginning of 1s string → Add M (A ← A + M)'}
                    {(activeBoothStep.qPair === '00' || activeBoothStep.qPair === '11') &&
                      'String of identical bits → No arithmetic operation (Shift only)'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 italic">
                  {activeBoothStep.explanation}
                </div>
              </div>

              {/* Step Execution Timeline Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Step</th>
                      <th className="py-2 px-3">Operation</th>
                      <th className="py-2 px-3">Accumulator A</th>
                      <th className="py-2 px-3">Multiplier Q</th>
                      <th className="py-2 px-3">Q₋₁</th>
                      <th className="py-2 px-3">Action Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {boothResult.steps.map((step, idx) => {
                      const isSelected = idx === currentMultStep;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setCurrentMultStep(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-950/60 text-cyan-200 border-l-2 border-cyan-400'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td className="py-1.5 px-3">{step.stepIndex}</td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                step.operation === 'ADD_M'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : step.operation === 'SUB_M'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : step.operation === 'ASR'
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {step.operation}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-emerald-400">{step.binA}</td>
                          <td className="py-1.5 px-3 text-cyan-400">{step.binQ}</td>
                          <td className="py-1.5 px-3 text-amber-400">{step.qMinus1}</td>
                          <td className="py-1.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                            {step.description}
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
      )}

      {/* -------------------------------------------------------------
          MODULE 2: RESTORING & NON-RESTORING DIVIDER
      ------------------------------------------------------------- */}
      {subModule === 'DIVIDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Division Method & Config */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Division Algorithm
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setDivBitWidth(8);
                      setCurrentDivStep(0);
                    }}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${
                      divBitWidth === 8
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    8-Bit
                  </button>
                  <button
                    onClick={() => {
                      setDivBitWidth(16);
                      setCurrentDivStep(0);
                    }}
                    className={`px-2 py-0.5 text-xs rounded font-mono ${
                      divBitWidth === 16
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    16-Bit
                  </button>
                </div>
              </div>

              {/* Method Switch: Restoring vs Non-Restoring */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setDivisionMethod('NON_RESTORING');
                    setCurrentDivStep(0);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                    divisionMethod === 'NON_RESTORING'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Non-Restoring</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Saves restore cycles & dynamic switching</div>
                </button>
                <button
                  onClick={() => {
                    setDivisionMethod('RESTORING');
                    setCurrentDivStep(0);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                    divisionMethod === 'RESTORING'
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Restoring</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Classic trial subtraction + restore add</div>
                </button>
              </div>

              {/* Division Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Representative Sensor Normalization Presets:</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SENSOR_DIVISION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyDivPreset(preset)}
                      className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 group-hover:text-cyan-300">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {preset.bitWidth}-bit
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.description}</p>
                      <div className="mt-1.5 text-[10px] font-mono text-cyan-400/90">
                        {preset.dividend} ÷ {preset.divisor} = Q: {Math.floor(preset.dividend / preset.divisor)}, R: {preset.dividend % preset.divisor}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input Controls */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Dividend (Accumulated Sensor Sum)</span>
                    <span className="font-mono text-cyan-400">Q = {dividendInput}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={dividendInput}
                    onChange={(e) => {
                      setDividendInput(Math.max(0, parseInt(e.target.value) || 0));
                      setCurrentDivStep(0);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Divisor (Window Sample Count / Scaling Factor)</span>
                    <span className="font-mono text-cyan-400">M = {divisorInput}</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={divisorInput}
                    onChange={(e) => {
                      setDivisorInput(Math.max(1, parseInt(e.target.value) || 1));
                      setCurrentDivStep(0);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Hardware Metrics Comparison */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware Synthesis Comparison (65nm LP)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Non-Restoring Energy</div>
                    <div className="font-mono font-bold text-emerald-300">
                      {simulateNonRestoringDivision(dividendInput, divisorInput, divBitWidth).energyPicoJoules} pJ
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400">Restoring Energy</div>
                    <div className="font-mono font-bold text-rose-300">
                      {simulateRestoringDivision(dividendInput, divisorInput, divBitWidth).energyPicoJoules} pJ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Divider Register Visualizer & Trace */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{divisionMethod === 'RESTORING' ? 'Restoring' : 'Non-Restoring'} Divider Registers</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Step {currentDivStep + 1} of {divResult.steps.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeDivStep.description}
                  </p>
                </div>

                {/* Step Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setCurrentDivStep(0);
                      setIsDivAutoPlaying(false);
                    }}
                    title="Reset to Step 0"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDivStep((prev) => Math.max(0, prev - 1))}
                    disabled={currentDivStep === 0}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer text-xs font-medium"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setIsDivAutoPlaying(!isDivAutoPlaying)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow cursor-pointer"
                  >
                    {isDivAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isDivAutoPlaying ? 'Pause' : 'Auto Play'}</span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentDivStep((prev) => Math.min(divResult.steps.length - 1, prev + 1))
                    }
                    disabled={currentDivStep === divResult.steps.length - 1}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer text-xs font-medium flex items-center gap-1"
                  >
                    <span>Next</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bit Registers Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Remainder A */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Remainder Register (A)</span>
                    <span className="font-mono text-cyan-400">{activeDivStep.accumulatorA}</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-emerald-400 tracking-wider break-all">
                    {activeDivStep.binA}
                  </div>
                </div>

                {/* Quotient Q */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Quotient Register (Q)</span>
                    <span className="font-mono text-cyan-400">{activeDivStep.quotientQ}</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-cyan-400 tracking-wider break-all">
                    {activeDivStep.binQ}
                  </div>
                </div>

                {/* Divisor M */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                    <span>Divisor (M)</span>
                    <span className="font-mono text-cyan-400">{activeDivStep.divisorM}</span>
                  </div>
                  <div className="mt-2 font-mono text-xs font-bold text-purple-400 tracking-wider break-all">
                    {toTwosComplementBin(activeDivStep.divisorM, divBitWidth)}
                  </div>
                </div>
              </div>

              {/* Step Detail Explanation Box */}
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white mb-0.5">Execution Step Detail:</div>
                  <div className="text-slate-400">{activeDivStep.explanation}</div>
                </div>
              </div>

              {/* Divider Step Trace Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Step</th>
                      <th className="py-2 px-3">Op</th>
                      <th className="py-2 px-3">Remainder A</th>
                      <th className="py-2 px-3">Quotient Q</th>
                      <th className="py-2 px-3">Q₀ Bit</th>
                      <th className="py-2 px-3">Action Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {divResult.steps.map((step, idx) => {
                      const isSelected = idx === currentDivStep;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setCurrentDivStep(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-950/60 text-cyan-200 border-l-2 border-cyan-400'
                              : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <td className="py-1.5 px-3">{step.stepIndex}</td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                step.operation === 'SHIFT_LEFT'
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                                  : step.operation === 'SUB_M'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : step.operation === 'RESTORE'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {step.operation}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-emerald-400">{step.binA}</td>
                          <td className="py-1.5 px-3 text-cyan-400">{step.binQ}</td>
                          <td className="py-1.5 px-3 text-amber-400">{step.q0Bit}</td>
                          <td className="py-1.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                            {step.description}
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
      )}
    </div>
  );
};
