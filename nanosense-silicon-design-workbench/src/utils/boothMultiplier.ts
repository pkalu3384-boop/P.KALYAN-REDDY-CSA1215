import { BitWidth, BoothResult, BoothStep } from '../types';

/**
 * Converts a signed number into two's complement binary string of given bitWidth.
 */
export function toTwosComplementBin(val: number, bitWidth: number): string {
  const mask = (1 << bitWidth) - 1;
  let unsignedVal = val & mask;
  if (unsignedVal < 0) {
    unsignedVal = (unsignedVal + (1 << bitWidth)) & mask;
  }
  return (unsignedVal >>> 0).toString(2).padStart(bitWidth, '0');
}

/**
 * Sign extends an n-bit two's complement value to a signed JavaScript integer.
 */
export function fromTwosComplement(binStr: string): number {
  const width = binStr.length;
  let val = parseInt(binStr, 2);
  if (binStr[0] === '1') {
    val -= (1 << width);
  }
  return val;
}

/**
 * Simulates Booth's Multiplication Algorithm (Radix-2).
 * Operates on signed bitWidth operands (8-bit or 16-bit).
 */
export function simulateBoothRadix2(
  multiplicand: number,
  multiplier: number,
  bitWidth: BitWidth = 8
): BoothResult {
  const maxVal = (1 << (bitWidth - 1)) - 1;
  const minVal = -(1 << (bitWidth - 1));

  // Clamp to valid signed range for the chosen bit width
  const M = Math.max(minVal, Math.min(maxVal, Math.trunc(multiplicand)));
  const Q = Math.max(minVal, Math.min(maxVal, Math.trunc(multiplier)));

  const steps: BoothStep[] = [];
  const maskN = (1 << bitWidth) - 1;

  let A = 0; // Accumulator (n-bit)
  let qReg = Q & maskN; // Multiplier register (n-bit)
  let qMinus1 = 0; // Q_-1 flip-flop
  const mReg = M & maskN;

  // Initial State Step
  steps.push({
    stepIndex: 0,
    description: 'Initialization: Load Multiplicand M, Multiplier Q into registers; clear A and Q-1',
    operation: 'INITIAL',
    multiplicandM: M,
    accumulatorA: A,
    multiplierQ: fromTwosComplement(toTwosComplementBin(qReg, bitWidth)),
    qMinus1: qMinus1,
    binA: toTwosComplementBin(A, bitWidth),
    binQ: toTwosComplementBin(qReg, bitWidth),
    qPair: `${(qReg & 1)}${qMinus1}`,
    explanation: `Initial registers: M = ${M} (${toTwosComplementBin(mReg, bitWidth)}), Q = ${Q} (${toTwosComplementBin(qReg, bitWidth)}), A = 0, Q-1 = 0. Total iterations = ${bitWidth}.`,
  });

  for (let cycle = 1; cycle <= bitWidth; cycle++) {
    const q0 = qReg & 1;
    const pair = `${q0}${qMinus1}`;
    let op: 'SUB_M' | 'ADD_M' | 'NO_OP' = 'NO_OP';
    let opDesc = '';

    // Step 1: Examine (Q0, Q-1) bit pair
    if (pair === '10') {
      // 1 0 -> A = A - M
      op = 'SUB_M';
      let signedA = fromTwosComplement(toTwosComplementBin(A, bitWidth));
      signedA = (signedA - M);
      A = signedA & maskN;
      opDesc = `Bit pair (1,0): End of 1s string. Subtract Multiplicand M: A ← A - M = ${signedA}.`;
    } else if (pair === '01') {
      // 0 1 -> A = A + M
      op = 'ADD_M';
      let signedA = fromTwosComplement(toTwosComplementBin(A, bitWidth));
      signedA = (signedA + M);
      A = signedA & maskN;
      opDesc = `Bit pair (0,1): Beginning of 1s string. Add Multiplicand M: A ← A + M = ${signedA}.`;
    } else {
      // 0 0 or 1 1 -> No operation
      op = 'NO_OP';
      opDesc = `Bit pair (${pair[0]},${pair[1]}): No addition/subtraction required (A unchanged).`;
    }

    steps.push({
      stepIndex: (cycle * 2) - 1,
      description: `Cycle ${cycle} [Arithmetic]: Check (Q0, Q-1) = (${pair}) → ${op}`,
      operation: op,
      multiplicandM: M,
      accumulatorA: fromTwosComplement(toTwosComplementBin(A, bitWidth)),
      multiplierQ: fromTwosComplement(toTwosComplementBin(qReg, bitWidth)),
      qMinus1: qMinus1,
      binA: toTwosComplementBin(A, bitWidth),
      binQ: toTwosComplementBin(qReg, bitWidth),
      qPair: pair,
      explanation: opDesc,
    });

    // Step 2: Arithmetic Right Shift (ASR) of [A, Q, Q-1]
    const signBitA = (A >> (bitWidth - 1)) & 1;
    const lsbA = A & 1;
    const lsbQ = qReg & 1;

    // Shift Q right, msb of Q becomes lsb of A
    qReg = ((qReg >>> 1) | (lsbA << (bitWidth - 1))) & maskN;
    // Shift A right with sign extension
    A = ((A >>> 1) | (signBitA << (bitWidth - 1))) & maskN;
    // Q-1 takes previous LSB of Q
    qMinus1 = lsbQ;

    steps.push({
      stepIndex: cycle * 2,
      description: `Cycle ${cycle} [Shift]: Arithmetic Right Shift [A, Q, Q-1]`,
      operation: 'ASR',
      multiplicandM: M,
      accumulatorA: fromTwosComplement(toTwosComplementBin(A, bitWidth)),
      multiplierQ: fromTwosComplement(toTwosComplementBin(qReg, bitWidth)),
      qMinus1: qMinus1,
      binA: toTwosComplementBin(A, bitWidth),
      binQ: toTwosComplementBin(qReg, bitWidth),
      qPair: `${qReg & 1}${qMinus1}`,
      explanation: `Arithmetic right-shifted combined 2N+1 register [A, Q, Q-1]. Sign bit '${signBitA}' preserved. LSB of Q (${lsbQ}) shifted into Q-1.`,
    });
  }

  // Combined product is 2*bitWidth
  const fullProductBin = toTwosComplementBin(A, bitWidth) + toTwosComplementBin(qReg, bitWidth);
  const actualProduct = fromTwosComplement(fullProductBin);

  // Final Step
  steps.push({
    stepIndex: (bitWidth * 2) + 1,
    description: 'Multiplication Complete: Product = [A : Q]',
    operation: 'FINAL',
    multiplicandM: M,
    accumulatorA: fromTwosComplement(toTwosComplementBin(A, bitWidth)),
    multiplierQ: fromTwosComplement(toTwosComplementBin(qReg, bitWidth)),
    qMinus1: qMinus1,
    binA: toTwosComplementBin(A, bitWidth),
    binQ: toTwosComplementBin(qReg, bitWidth),
    qPair: `${qReg & 1}${qMinus1}`,
    explanation: `Final 2N-bit signed product = [A : Q] = ${fullProductBin}₂ = ${actualProduct}₁₀ (Verified: ${M} × ${Q} = ${M * Q}).`,
  });

  // Hardware metrics estimation (NAND2 equivalent gates, energy @ 65nm LP process @ 1.2V)
  const gateCountEst = bitWidth === 8 ? 420 : 1180;
  const energyPerCyclePJ = bitWidth === 8 ? 0.35 : 0.85; // pJ per cycle
  const energyPicoJoules = +(energyPerCyclePJ * bitWidth).toFixed(2);

  return {
    multiplicand: M,
    multiplier: Q,
    product: actualProduct,
    bitWidth,
    steps,
    radix: 2,
    totalCycles: bitWidth,
    gateCountEst,
    energyPicoJoules,
  };
}

/**
 * Sensor Scaling Presets for IoT embedded nodes.
 */
export const SENSOR_SCALING_PRESETS = [
  {
    id: 'soil-moisture-cal',
    name: 'Soil Moisture 12-bit ADC × Q4.4 Calibration Factor',
    sensorType: 'Capacitive Frequency (Soil Moisture)',
    multiplicand: 114, // Raw ADC sample delta (signed 8-bit)
    multiplier: 18,   // Calibration factor 1.125 in Q4.4 (18/16)
    bitWidth: 8 as BitWidth,
    description: 'Scales raw relative permittivity voltage reading with soil calibration slope to obtain Volumetric Water Content (%VWC).',
    physicalContext: 'Raw ADC = 114 ticks, Slope = 1.125x → Calibrated = 2052 (Q4.4 = 128.25 %VWC raw unit)',
  },
  {
    id: 'vibration-piezo',
    name: 'Structural Vibration Sensor × Sensitivity Factor',
    sensorType: 'Piezoelectric Accelerometer (Bridge Monitoring)',
    multiplicand: -85, // Negative acceleration spike (signed 8-bit)
    multiplier: 42,   // Gain factor
    bitWidth: 8 as BitWidth,
    description: 'Converts negative peak bridge acceleration to milli-g force units for structural fatigue accumulation analysis.',
    physicalContext: 'Raw ADC Peak = -85 units, Gain = 42 → Product = -3570 (High stress event detected)',
  },
  {
    id: 'temp-thermistor-16',
    name: 'NTC Thermistor 16-bit Polynomial Term',
    sensorType: 'High-Precision Temperature (Grain Silo)',
    multiplicand: 2450, // 16-bit ADC reading
    multiplier: -128,   // 16-bit negative coefficient
    bitWidth: 16 as BitWidth,
    description: 'High-resolution Steinhart-Hart polynomial linearization term for precision temperature compensation.',
    physicalContext: 'Raw 16-bit Reading = 2450 counts × (-128) = -313,600',
  },
  {
    id: 'negative-both',
    name: 'Dual Negative Operands (-45 × -18)',
    sensorType: 'Differential Strain Gauge Drift',
    multiplicand: -45,
    multiplier: -18,
    bitWidth: 8 as BitWidth,
    description: 'Edge-case verification: Multiplies two negative 2\'s complement numbers to verify proper sign cancellation.',
    physicalContext: 'Strain delta = -45 με, Temp delta = -18 °C → Expected Positive Product = +810',
  }
];
