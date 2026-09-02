/**
 * NanoSense Devices - Microcontroller Core Architecture & Hardware Design Types
 */

// -------------------------------------------------------------
// 1. ARITHMETIC UNIT TYPES (Booth Multiplier & Restoring/Non-Restoring Divider)
// -------------------------------------------------------------

export type BitWidth = 8 | 16;

export interface BoothStep {
  stepIndex: number;
  description: string;
  operation: 'INITIAL' | 'SUB_M' | 'ADD_M' | 'NO_OP' | 'ASR' | 'FINAL';
  multiplicandM: number;
  accumulatorA: number;
  multiplierQ: number;
  qMinus1: number;
  binA: string;
  binQ: string;
  qPair: string; // "00", "01", "10", "11"
  explanation: string;
}

export interface BoothResult {
  multiplicand: number;
  multiplier: number;
  product: number;
  bitWidth: BitWidth;
  steps: BoothStep[];
  radix: 2 | 4;
  totalCycles: number;
  gateCountEst: number;
  energyPicoJoules: number;
}

export interface DivisionStep {
  stepIndex: number;
  description: string;
  operation: 'INITIAL' | 'SHIFT_LEFT' | 'SUB_M' | 'ADD_M' | 'RESTORE' | 'SET_Q0' | 'FINAL';
  accumulatorA: number;
  quotientQ: number;
  divisorM: number;
  binA: string;
  binQ: string;
  q0Bit: number;
  restored: boolean;
  explanation: string;
}

export interface DivisionResult {
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
  bitWidth: BitWidth;
  method: 'RESTORING' | 'NON_RESTORING';
  steps: DivisionStep[];
  totalCycles: number;
  gateCountEst: number;
  energyPicoJoules: number;
}

// -------------------------------------------------------------
// 2. IEEE-754 FLOATING-POINT UNIT TYPES
// -------------------------------------------------------------

export type RoundingMode = 'NEAREST_EVEN' | 'TOWARD_ZERO' | 'TOWARD_POS_INF' | 'TOWARD_NEG_INF';

export interface IEEE754Float {
  rawFloat: number;
  sign: number; // 0 or 1
  exponent: number; // 0 to 255
  unbiasedExp: number; // exponent - 127
  mantissa: number; // 23-bit integer fraction
  binaryString: string; // 32 chars: 1 bit sign + 8 bits exp + 23 bits mantissa
  hexString: string;
  isZero: boolean;
  isSubnormal: boolean;
  isInfinity: boolean;
  isNaN: boolean;
}

export interface FPUAddSubStep {
  stage: string;
  title: string;
  description: string;
  regState: {
    expA: number;
    expB: number;
    expDiff: number;
    mantissaA: string; // 24+ bits with hidden bit
    mantissaB: string;
    guardBit?: number;
    roundBit?: number;
    stickyBit?: number;
    alignedMantissaB?: string;
    rawSum?: string;
    normalizedMantissa?: string;
    finalExponent?: number;
    finalMantissa?: string;
  };
}

export interface FPUResult {
  operandA: IEEE754Float;
  operandB: IEEE754Float;
  operation: 'ADD' | 'SUB';
  roundingMode: RoundingMode;
  result: IEEE754Float;
  steps: FPUAddSubStep[];
  flags: {
    overflow: boolean;
    underflow: boolean;
    inexact: boolean;
    invalid: boolean;
    zero: boolean;
    subnormal: boolean;
  };
  latencyCycles: number;
  gateCountEst: number;
}

// -------------------------------------------------------------
// 3. 5-STAGE PIPELINE SIMULATOR TYPES
// -------------------------------------------------------------

export type PipelineStageName = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';

export interface Instruction {
  id: number;
  pc: number;
  asm: string;
  opcode: 'LW' | 'SW' | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'BEQ' | 'BNE' | 'ADDI' | 'NOP';
  rd?: string;
  rs?: string;
  rt?: string;
  imm?: number;
  comment?: string;
}

export interface PipelineCell {
  instructionId: number;
  stage: PipelineStageName | 'STALL' | 'FLUSH' | null;
  isForwarded?: boolean;
  forwardSource?: string;
}

export interface HazardEvent {
  cycle: number;
  instructionId: number;
  type: 'DATA_RAW' | 'LOAD_USE' | 'CONTROL_BRANCH' | 'STRUCTURAL';
  description: string;
  mitigation: string;
  stalledCycles: number;
}

export type HazardMitigationMode = 'NO_FORWARDING' | 'FULL_FORWARDING' | 'FORWARDING_AND_REORDERING';

export interface PipelineSimulationResult {
  program: Instruction[];
  mitigationMode: HazardMitigationMode;
  totalCycles: number;
  instructionCount: number;
  cpi: number;
  ipc: number;
  stallCycles: number;
  flushCycles: number;
  hazards: HazardEvent[];
  grid: (PipelineCell | null)[][]; // row: instructions, col: cycles
  cycleLogs: {
    cycle: number;
    activeStages: Record<PipelineStageName, string>;
    forwardingEvents: string[];
    hazardsDetected: string[];
  }[];
}

// -------------------------------------------------------------
// 4. CACHE & MEMORY INTERFACE TYPES
// -------------------------------------------------------------

export type CacheType = 'DIRECT_MAPPED' | 'TWO_WAY_SET_ASSOCIATIVE' | 'FOUR_WAY_SET_ASSOCIATIVE';
export type ReplacementPolicy = 'LRU' | 'FIFO' | 'RANDOM';
export type WritePolicy = 'WRITE_THROUGH' | 'WRITE_BACK';

export interface CacheConfig {
  cacheSizeBytes: number; // e.g. 256, 512, 1024
  lineSizeBytes: number; // e.g. 16, 32
  associativity: 1 | 2 | 4; // 1 = Direct, 2 = 2-Way, 4 = 4-Way
  replacementPolicy: ReplacementPolicy;
  writePolicy: WritePolicy;
  hitLatencyCycles: number; // e.g. 1
  missPenaltyCycles: number; // e.g. 25 (External Flash/SRAM)
  energyPerHitPicoJoules: number;
  energyPerMissPicoJoules: number;
}

export interface CacheLineState {
  valid: boolean;
  dirty: boolean;
  tag: number;
  lruCounter: number;
  dataBlock: number[];
  lastAddressAccessed?: number;
}

export interface CacheSetState {
  lines: CacheLineState[];
}

export interface MemoryAccessTrace {
  address: number;
  operation: 'READ' | 'WRITE';
  source: string; // e.g. "Sensor_Buffer[i]", "Calibration_Table"
  tag: number;
  index: number;
  offset: number;
  isHit: boolean;
  missType?: 'COMPULSORY' | 'CONFLICT' | 'CAPACITY';
  evictedWay?: number;
  dirtyEvicted?: boolean;
}

export interface CacheSimulationStats {
  totalAccesses: number;
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  compulsoryMisses: number;
  conflictMisses: number;
  capacityMisses: number;
  amatCycles: number; // Average Memory Access Time
  totalEnergyNanoJoules: number;
  batteryDaysCR2032: number;
}

// -------------------------------------------------------------
// 5. I/O INTERFACING STRATEGY (Interrupt vs DMA)
// -------------------------------------------------------------

export interface IoSimulationConfig {
  samplingRateHz: number; // e.g. 100 Hz (soil) to 10000 Hz (vibration)
  adcResolutionBits: 8 | 12 | 16;
  bufferBlockSize: number; // samples per processing window (e.g. 32, 64, 128)
  mcuClockMHz: number; // e.g. 32 MHz
  mcuActiveCurrentMA: number; // e.g. 2.4 mA @ 3V
  mcuSleepCurrentUA: number; // e.g. 0.8 uA @ 3V
  wakeUpTimeMicroSeconds: number; // e.g. 12 us
  isrCyclesPerSample: number; // e.g. 38 cycles (context save, read, store, restore)
  dmaActiveCurrentUA: number; // e.g. 45 uA
  dmaTransferCycles: number; // e.g. 2 cycles per sample
  coinCellCapacityMAh: number; // e.g. 220 mAh (CR2032)
  operatingVoltage: number; // 3.0 V
}

export interface IoComparisonResult {
  interrupt: {
    cpuActiveDutyCyclePercent: number;
    avgCurrentUA: number;
    annualEnergyMilliWattHours: number;
    batteryLifetimeYears: number;
    batteryLifetimeDays: number;
    latencyJitterMicroSeconds: number;
    cpuWakeupsPerSecond: number;
    gateCount: number;
  };
  dma: {
    cpuActiveDutyCyclePercent: number;
    avgCurrentUA: number;
    annualEnergyMilliWattHours: number;
    batteryLifetimeYears: number;
    batteryLifetimeDays: number;
    latencyJitterMicroSeconds: number;
    cpuWakeupsPerSecond: number;
    gateCount: number;
  };
  powerSavingsRatio: number;
  recommendedStrategy: 'INTERRUPT' | 'DMA' | 'HYBRID';
  justificationText: string;
}
