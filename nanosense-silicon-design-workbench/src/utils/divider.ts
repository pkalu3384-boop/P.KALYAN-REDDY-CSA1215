import { BitWidth, DivisionResult, DivisionStep } from '../types';
import { toTwosComplementBin } from './boothMultiplier';

/**
 * Simulates Restoring Division Algorithm for unsigned / positive integers
 * (or magnitude of signed sensor readings) with bit-exact step logging.
 */
export function simulateRestoringDivision(
  dividend: number,
  divisor: number,
  bitWidth: BitWidth = 8
): DivisionResult {
  const maxVal = (1 << bitWidth) - 1;
  const D = Math.max(0, Math.min(maxVal, Math.abs(Math.trunc(dividend))));
  const M = Math.max(1, Math.min(maxVal, Math.abs(Math.trunc(divisor))));

  const steps: DivisionStep[] = [];
  const maskN = (1 << bitWidth) - 1;
  const maskNPlus1 = (1 << (bitWidth + 1)) - 1;

  let A = 0; // Accumulator (n+1 bits to hold sign during subtraction)
  let Q = D; // Quotient register initialized with Dividend (n bits)

  steps.push({
    stepIndex: 0,
    description: 'Initialization: Load Divisor M, Dividend Q; Clear Accumulator A to 0',
    operation: 'INITIAL',
    accumulatorA: A,
    quotientQ: Q,
    divisorM: M,
    binA: toTwosComplementBin(A, bitWidth + 1),
    binQ: toTwosComplementBin(Q, bitWidth),
    q0Bit: 0,
    restored: false,
    explanation: `Registers initialized: Dividend Q = ${D} (${toTwosComplementBin(Q, bitWidth)}₂), Divisor M = ${M} (${toTwosComplementBin(M, bitWidth)}₂), Remainder A = 0. Cycle count = ${bitWidth}.`,
  });

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    // 1. Shift Left [A, Q]
    const msbQ = (Q >> (bitWidth - 1)) & 1;
    Q = (Q << 1) & maskN;
    A = ((A << 1) | msbQ) & maskNPlus1;

    steps.push({
      stepIndex: (cycle * 3) - 2,
      description: `Cycle ${cycle} [Step 1]: Shift Left [A, Q]`,
      operation: 'SHIFT_LEFT',
      accumulatorA: A,
      quotientQ: Q,
      divisorM: M,
      binA: toTwosComplementBin(A, bitWidth + 1),
      binQ: toTwosComplementBin(Q, bitWidth),
      q0Bit: 0,
      restored: false,
      explanation: `Combined register [A, Q] shifted left by 1 bit. MSB of Q (${msbQ}) shifted into LSB of A.`,
    });

    // 2. Subtract Divisor: A = A - M
    // Note: A is treated as (bitWidth + 1) bit value
    let signedA = A;
    if (A >= (1 << bitWidth)) {
      signedA = A - (1 << (bitWidth + 1));
    }
    signedA = signedA - M;
    A = signedA & maskNPlus1;
    const isNegative = (A >> bitWidth) & 1;

    steps.push({
      stepIndex: (cycle * 3) - 1,
      description: `Cycle ${cycle} [Step 2]: Subtract Divisor A ← A - M`,
      operation: 'SUB_M',
      accumulatorA: signedA,
      quotientQ: Q,
      divisorM: M,
      binA: toTwosComplementBin(A, bitWidth + 1),
      binQ: toTwosComplementBin(Q, bitWidth),
      q0Bit: 0,
      restored: false,
      explanation: `Calculated A - M = ${signedA}. Sign bit is ${isNegative ? '1 (Negative: trial subtraction failed)' : '0 (Positive: trial subtraction succeeded)'}.`,
    });

    // 3. Check sign of A: if negative, Q0 = 0 and restore A = A + M. If positive, Q0 = 1
    if (isNegative) {
      // Restore A
      signedA = signedA + M;
      A = signedA & maskNPlus1;
      Q = Q & ~1; // Q0 = 0

      steps.push({
        stepIndex: cycle * 3,
        description: `Cycle ${cycle} [Step 3]: Sign is Negative → Q0 = 0 & RESTORE A ← A + M`,
        operation: 'RESTORE',
        accumulatorA: A,
        quotientQ: Q,
        divisorM: M,
        binA: toTwosComplementBin(A, bitWidth + 1),
        binQ: toTwosComplementBin(Q, bitWidth),
        q0Bit: 0,
        restored: true,
        explanation: `Since A was negative, set Q0 = 0 and restored accumulator: A = ${A} (${toTwosComplementBin(A, bitWidth + 1)}₂).`,
      });
    } else {
      // Keep A, set Q0 = 1
      Q = Q | 1;

      steps.push({
        stepIndex: cycle * 3,
        description: `Cycle ${cycle} [Step 3]: Sign is Positive → Q0 = 1 (No Restore needed)`,
        operation: 'SET_Q0',
        accumulatorA: A,
        quotientQ: Q,
        divisorM: M,
        binA: toTwosComplementBin(A, bitWidth + 1),
        binQ: toTwosComplementBin(Q, bitWidth),
        q0Bit: 1,
        restored: false,
        explanation: `Since A was non-negative, set Q0 = 1. No restoration required. A remains ${A}.`,
      });
    }
  }

  // Final Step
  steps.push({
    stepIndex: (bitWidth * 3) + 1,
    description: 'Division Complete: Quotient = Q, Remainder = A',
    operation: 'FINAL',
    accumulatorA: A,
    quotientQ: Q,
    divisorM: M,
    binA: toTwosComplementBin(A, bitWidth + 1),
    binQ: toTwosComplementBin(Q, bitWidth),
    q0Bit: Q & 1,
    restored: false,
    explanation: `Result: Quotient Q = ${Q}₁₀ (${toTwosComplementBin(Q, bitWidth)}₂), Remainder A = ${A}₁₀ (${toTwosComplementBin(A, bitWidth + 1)}₂). Check: ${M} × ${Q} + ${A} = ${M * Q + A} (equals original dividend ${D}).`,
  });

  const gateCountEst = bitWidth === 8 ? 580 : 1420;
  const energyPerCyclePJ = bitWidth === 8 ? 0.42 : 1.05;
  const energyPicoJoules = +(energyPerCyclePJ * bitWidth * 1.35).toFixed(2); // Higher due to potential restore additions

  return {
    dividend: D,
    divisor: M,
    quotient: Q,
    remainder: A,
    bitWidth,
    method: 'RESTORING',
    steps,
    totalCycles: bitWidth,
    gateCountEst,
    energyPicoJoules,
  };
}

/**
 * Simulates Non-Restoring Division Algorithm.
 * Avoids the extra restoration addition cycle, achieving lower switching activity.
 */
export function simulateNonRestoringDivision(
  dividend: number,
  divisor: number,
  bitWidth: BitWidth = 8
): DivisionResult {
  const maxVal = (1 << bitWidth) - 1;
  const D = Math.max(0, Math.min(maxVal, Math.abs(Math.trunc(dividend))));
  const M = Math.max(1, Math.min(maxVal, Math.abs(Math.trunc(divisor))));

  const steps: DivisionStep[] = [];
  const maskN = (1 << bitWidth) - 1;
  const maskNPlus1 = (1 << (bitWidth + 1)) - 1;

  let A = 0; // Accumulator
  let Q = D; // Dividend

  steps.push({
    stepIndex: 0,
    description: 'Initialization: Load Divisor M, Dividend Q; Clear Accumulator A to 0',
    operation: 'INITIAL',
    accumulatorA: A,
    quotientQ: Q,
    divisorM: M,
    binA: toTwosComplementBin(A, bitWidth + 1),
    binQ: toTwosComplementBin(Q, bitWidth),
    q0Bit: 0,
    restored: false,
    explanation: `Registers initialized: Dividend Q = ${D} (${toTwosComplementBin(Q, bitWidth)}₂), Divisor M = ${M} (${toTwosComplementBin(M, bitWidth)}₂), Remainder A = 0.`,
  });

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    // Check sign of A before shifting
    const prevSignA = (A >> bitWidth) & 1;

    // 1. Shift Left [A, Q]
    const msbQ = (Q >> (bitWidth - 1)) & 1;
    Q = (Q << 1) & maskN;
    A = ((A << 1) | msbQ) & maskNPlus1;

    steps.push({
      stepIndex: (cycle * 2) - 1,
      description: `Cycle ${cycle} [Step 1]: Shift Left [A, Q]`,
      operation: 'SHIFT_LEFT',
      accumulatorA: A,
      quotientQ: Q,
      divisorM: M,
      binA: toTwosComplementBin(A, bitWidth + 1),
      binQ: toTwosComplementBin(Q, bitWidth),
      q0Bit: 0,
      restored: false,
      explanation: `Shifted left [A, Q]. Previous sign of A was ${prevSignA === 0 ? 'Positive (will do A ← A - M)' : 'Negative (will do A ← A + M)'}.`,
    });

    // 2. Arithmetic operation based on previous sign of A
    let signedA = A;
    if (A >= (1 << bitWidth)) {
      signedA = A - (1 << (bitWidth + 1));
    }

    let op: 'SUB_M' | 'ADD_M' = 'SUB_M';
    if (prevSignA === 0) {
      // Previous A was positive -> subtract M
      signedA = signedA - M;
      op = 'SUB_M';
    } else {
      // Previous A was negative -> add M
      signedA = signedA + M;
      op = 'ADD_M';
    }
    A = signedA & maskNPlus1;
    const newSignA = (A >> bitWidth) & 1;

    if (newSignA === 0) {
      Q = Q | 1; // Q0 = 1
    } else {
      Q = Q & ~1; // Q0 = 0
    }

    steps.push({
      stepIndex: cycle * 2,
      description: `Cycle ${cycle} [Step 2]: ${op === 'SUB_M' ? 'A ← A - M' : 'A ← A + M'} → Set Q0 = ${newSignA === 0 ? '1' : '0'}`,
      operation: op,
      accumulatorA: signedA,
      quotientQ: Q,
      divisorM: M,
      binA: toTwosComplementBin(A, bitWidth + 1),
      binQ: toTwosComplementBin(Q, bitWidth),
      q0Bit: newSignA === 0 ? 1 : 0,
      restored: false,
      explanation: `${op === 'SUB_M' ? 'Subtracted M' : 'Added M'}: New A = ${signedA}. Sign is ${newSignA === 0 ? '0 (Positive) → Q0 = 1' : '1 (Negative) → Q0 = 0'}. No restoration cycle needed!`,
    });
  }

  // Final Correction: If remainder A is negative at the end, A = A + M
  let finalSignedA = A;
  if (A >= (1 << bitWidth)) {
    finalSignedA = A - (1 << (bitWidth + 1));
  }

  if (finalSignedA < 0) {
    finalSignedA = finalSignedA + M;
    A = finalSignedA & maskNPlus1;
    steps.push({
      stepIndex: (bitWidth * 2) + 1,
      description: 'Final Correction: Remainder is negative → Add M once: A ← A + M',
      operation: 'RESTORE',
      accumulatorA: A,
      quotientQ: Q,
      divisorM: M,
      binA: toTwosComplementBin(A, bitWidth + 1),
      binQ: toTwosComplementBin(Q, bitWidth),
      q0Bit: Q & 1,
      restored: true,
      explanation: `Final remainder was negative, so performed one single final correction addition A = A + M to obtain positive remainder ${A}.`,
    });
  }

  // Final Summary Step
  steps.push({
    stepIndex: steps.length,
    description: 'Non-Restoring Division Complete',
    operation: 'FINAL',
    accumulatorA: A,
    quotientQ: Q,
    divisorM: M,
    binA: toTwosComplementBin(A, bitWidth + 1),
    binQ: toTwosComplementBin(Q, bitWidth),
    q0Bit: Q & 1,
    restored: false,
    explanation: `Result: Quotient Q = ${Q}₁₀ (${toTwosComplementBin(Q, bitWidth)}₂), Remainder A = ${A}₁₀. Check: ${M} × ${Q} + ${A} = ${M * Q + A} (equals original dividend ${D}). Non-restoring saves clock cycles and reduces peak power.`,
  });

  const gateCountEst = bitWidth === 8 ? 640 : 1550; // Slightly more control logic for multiplexing Add/Sub
  const energyPerCyclePJ = bitWidth === 8 ? 0.38 : 0.92;
  const energyPicoJoules = +(energyPerCyclePJ * bitWidth * 1.05).toFixed(2); // Lower total energy than restoring

  return {
    dividend: D,
    divisor: M,
    quotient: Q,
    remainder: A,
    bitWidth,
    method: 'NON_RESTORING',
    steps,
    totalCycles: bitWidth,
    gateCountEst,
    energyPicoJoules,
  };
}

/**
 * Sensor Division Presets for IoT embedded nodes.
 */
export const SENSOR_DIVISION_PRESETS = [
  {
    id: 'adc-average-window',
    name: 'Moving Average Window Normalizer (ADC Sum ÷ 16)',
    dividend: 236, // Sum of raw 8-bit soil sensor samples
    divisor: 16,   // Power-of-two divisor
    bitWidth: 8 as BitWidth,
    description: 'Divides cumulative ADC sample window sum by sample count N=16 to obtain baseline soil moisture value.',
    physicalContext: 'Accumulated Window Sum = 236 ticks ÷ 16 samples = Quotient: 14 ticks, Remainder: 12 ticks',
  },
  {
    id: 'frequency-scaling',
    name: 'Vibration Resonant Frequency Decimation (248 ÷ 11)',
    dividend: 248, // Raw cycle period measurement
    divisor: 11,   // Non-power-of-two decimation factor
    bitWidth: 8 as BitWidth,
    description: 'Scales raw high-speed timer tick count to engineering units (Hz) for bridge modal frequency tracking.',
    physicalContext: 'Timer Period = 248 ticks ÷ 11 = 22 Hz fundamental mode with remainder 6',
  },
  {
    id: 'strain-gauge-ratio',
    name: 'Wheatstone Bridge Ratio (16-bit: 4820 ÷ 35)',
    dividend: 4820,
    divisor: 35,
    bitWidth: 16 as BitWidth,
    description: '16-bit high-resolution differential voltage division for micro-strain calculation in steel beam structural health monitoring.',
    physicalContext: 'Bridge Differential = 4820 µV ÷ 35 µV/με = 137 με (microstrain) with remainder 25',
  }
];
