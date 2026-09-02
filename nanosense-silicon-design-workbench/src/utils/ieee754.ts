import { FPUAddSubStep, FPUResult, IEEE754Float, RoundingMode } from '../types';

/**
 * Extracts IEEE-754 Single-Precision (32-bit) components from a JS number.
 */
export function parseIEEE754Float(val: number): IEEE754Float {
  const buffer = new ArrayBuffer(4);
  const float32 = new Float32Array(buffer);
  const uint32 = new Uint32Array(buffer);

  float32[0] = val;
  const bits = uint32[0];

  const sign = (bits >>> 31) & 1;
  const exponent = (bits >>> 23) & 0xff;
  const mantissa = bits & 0x7fffff;

  const binaryString = bits.toString(2).padStart(32, '0');
  const hexString = '0x' + bits.toString(16).toUpperCase().padStart(8, '0');

  const isZero = exponent === 0 && mantissa === 0;
  const isSubnormal = exponent === 0 && mantissa !== 0;
  const isInfinity = exponent === 255 && mantissa === 0;
  const isNaN = exponent === 255 && mantissa !== 0;
  const unbiasedExp = isZero ? 0 : (isSubnormal ? -126 : exponent - 127);

  return {
    rawFloat: float32[0],
    sign,
    exponent,
    unbiasedExp,
    mantissa,
    binaryString,
    hexString,
    isZero,
    isSubnormal,
    isInfinity,
    isNaN,
  };
}

/**
 * Formats a 24-bit significand (with hidden bit) into binary string.
 */
function formatMantissaWithHidden(mantissa: number, isSubnormal: boolean, isZero: boolean): string {
  if (isZero) return '0.' + '0'.repeat(23);
  const hiddenBit = isSubnormal ? '0' : '1';
  const fracBits = mantissa.toString(2).padStart(23, '0');
  return `${hiddenBit}.${fracBits}`;
}

/**
 * Simulates IEEE-754 Single-Precision Addition and Subtraction with cycle-accurate stage decomposition.
 */
export function simulateFPUAddSub(
  numA: number,
  numB: number,
  operation: 'ADD' | 'SUB' = 'ADD',
  roundingMode: RoundingMode = 'NEAREST_EVEN'
): FPUResult {
  const opA = parseIEEE754Float(numA);
  const opB = parseIEEE754Float(numB);

  const steps: FPUAddSubStep[] = [];
  const flags = {
    overflow: false,
    underflow: false,
    inexact: false,
    invalid: false,
    zero: false,
    subnormal: false,
  };

  // Stage 1: Unpack Operands & Special Cases
  const effectiveSignB = operation === 'SUB' ? 1 - opB.sign : opB.sign;

  steps.push({
    stage: 'Stage 1: Operand Unpack & Pre-check',
    title: 'Unpack IEEE-754 32-bit Encodings',
    description: `Parsed Operands:
• Operand A: ${opA.rawFloat} | Sign=${opA.sign}, Exp=${opA.exponent} (2^${opA.unbiasedExp}), Frac=${opA.mantissa.toString(16).toUpperCase()} (${opA.isSubnormal ? 'Subnormal' : opA.isZero ? 'Zero' : 'Normalized'})
• Operand B: ${opB.rawFloat} | Sign=${opB.sign}, Exp=${opB.exponent} (2^${opB.unbiasedExp}), Frac=${opB.mantissa.toString(16).toUpperCase()} (${opB.isSubnormal ? 'Subnormal' : opB.isZero ? 'Zero' : 'Normalized'})
• Effective Operation: ${opA.sign === effectiveSignB ? 'Addition (same sign magnitude)' : 'Subtraction (opposite sign magnitude)'}`,
    regState: {
      expA: opA.exponent,
      expB: opB.exponent,
      expDiff: 0,
      mantissaA: formatMantissaWithHidden(opA.mantissa, opA.isSubnormal, opA.isZero),
      mantissaB: formatMantissaWithHidden(opB.mantissa, opB.isSubnormal, opB.isZero),
    },
  });

  // Handle NaN / Infinity edge cases
  if (opA.isNaN || opB.isNaN) {
    flags.invalid = true;
    const nanRes = parseIEEE754Float(NaN);
    steps.push({
      stage: 'Special Value Handling',
      title: 'NaN Encountered',
      description: 'Quiet NaN propagation according to IEEE-754 §6.2 rule.',
      regState: {
        expA: 255,
        expB: 255,
        expDiff: 0,
        mantissaA: 'NaN',
        mantissaB: 'NaN',
      },
    });
    return {
      operandA: opA,
      operandB: opB,
      operation,
      roundingMode,
      result: nanRes,
      steps,
      flags,
      latencyCycles: 3,
      gateCountEst: 3450,
    };
  }

  if (opA.isInfinity || opB.isInfinity) {
    if (opA.isInfinity && opB.isInfinity && opA.sign !== effectiveSignB) {
      flags.invalid = true;
      const nanRes = parseIEEE754Float(NaN);
      steps.push({
        stage: 'Special Value Handling',
        title: 'Infinity - Infinity Invalid Operation',
        description: 'Generating Quiet NaN due to indeterminate magnitude subtraction (Inf - Inf).',
        regState: { expA: 255, expB: 255, expDiff: 0, mantissaA: 'Inf', mantissaB: 'Inf' },
      });
      return { operandA: opA, operandB: opB, operation, roundingMode, result: nanRes, steps, flags, latencyCycles: 3, gateCountEst: 3450 };
    }
    const infSign = opA.isInfinity ? opA.sign : effectiveSignB;
    const infRes = parseIEEE754Float(infSign === 0 ? Infinity : -Infinity);
    flags.overflow = true;
    steps.push({
      stage: 'Special Value Handling',
      title: 'Infinity Result Generated',
      description: `Result saturated to ${infSign === 0 ? '+Infinity' : '-Infinity'}.`,
      regState: { expA: 255, expB: 255, expDiff: 0, mantissaA: 'Inf', mantissaB: 'Inf' },
    });
    return { operandA: opA, operandB: opB, operation, roundingMode, result: infRes, steps, flags, latencyCycles: 3, gateCountEst: 3450 };
  }

  // Determine larger and smaller operands
  let largerOp = opA;
  let smallerOp = opB;
  let largerEffectiveSign = opA.sign;
  let smallerEffectiveSign = effectiveSignB;
  let swapped = false;

  // Compare magnitude
  const magA = Math.abs(opA.rawFloat);
  const magB = Math.abs(opB.rawFloat);

  if (magB > magA) {
    largerOp = opB;
    smallerOp = opA;
    largerEffectiveSign = effectiveSignB;
    smallerEffectiveSign = opA.sign;
    swapped = true;
  }

  const expA = largerOp.exponent === 0 ? 1 : largerOp.exponent;
  const expB = smallerOp.exponent === 0 ? 1 : smallerOp.exponent;
  const expDiff = expA - expB;

  // Extract 24-bit significand as integer (bit 23 = hidden bit)
  let sigLarger = (largerOp.isZero ? 0 : (largerOp.isSubnormal ? 0 : 1) * (1 << 23)) | largerOp.mantissa;
  let sigSmaller = (smallerOp.isZero ? 0 : (smallerOp.isSubnormal ? 0 : 1) * (1 << 23)) | smallerOp.mantissa;

  // Stage 2: Exponent Alignment & Guard/Round/Sticky Bits Calculation
  let shiftedSigSmaller = sigSmaller;
  let guardBit = 0;
  let roundBit = 0;
  let stickyBit = 0;

  if (expDiff > 0) {
    if (expDiff <= 25) {
      // Extract G, R, S
      guardBit = expDiff >= 1 ? (sigSmaller >> (expDiff - 1)) & 1 : 0;
      roundBit = expDiff >= 2 ? (sigSmaller >> (expDiff - 2)) & 1 : 0;
      if (expDiff >= 3) {
        const stickyMask = (1 << (expDiff - 2)) - 1;
        stickyBit = (sigSmaller & stickyMask) !== 0 ? 1 : 0;
      }
      shiftedSigSmaller = sigSmaller >> expDiff;
    } else {
      // Entirely shifted out
      guardBit = 0;
      roundBit = 0;
      stickyBit = sigSmaller !== 0 ? 1 : 0;
      shiftedSigSmaller = 0;
    }
  }

  steps.push({
    stage: 'Stage 2: Exponent Alignment',
    title: `Align Significands (Δexp = ${expDiff} bits)`,
    description: `Exponent difference Δe = ${expA} - ${expB} = ${expDiff}.
Right-shifted smaller mantissa by ${expDiff} bit positions.
Extracted rounding bits: Guard (G)=${guardBit}, Round (R)=${roundBit}, Sticky (S)=${stickyBit}.
Aligned Base Exponent: ${expA} (2^${expA - 127}).`,
    regState: {
      expA: expA,
      expB: expB,
      expDiff: expDiff,
      mantissaA: sigLarger.toString(2).padStart(24, '0'),
      mantissaB: sigSmaller.toString(2).padStart(24, '0'),
      alignedMantissaB: shiftedSigSmaller.toString(2).padStart(24, '0'),
      guardBit,
      roundBit,
      stickyBit,
    },
  });

  // Stage 3: Significand Addition / Subtraction
  const isAdd = largerEffectiveSign === smallerEffectiveSign;
  let resultSign = largerEffectiveSign;
  let rawSum = 0;
  let carryOut = 0;

  if (isAdd) {
    rawSum = sigLarger + shiftedSigSmaller;
    if (rawSum >= (1 << 24)) {
      carryOut = 1;
    }
  } else {
    // Subtraction: larger - smaller
    // Include guard bit in subtraction precision
    let fullLarger = (sigLarger << 3);
    let fullSmaller = (shiftedSigSmaller << 3) | (guardBit << 2) | (roundBit << 1) | stickyBit;
    let fullDiff = fullLarger - fullSmaller;
    if (fullDiff < 0) {
      fullDiff = -fullDiff;
      resultSign = 1 - resultSign;
    }
    rawSum = fullDiff >> 3;
    guardBit = (fullDiff >> 2) & 1;
    roundBit = (fullDiff >> 1) & 1;
    stickyBit = (fullDiff & 1) | stickyBit;
  }

  steps.push({
    stage: 'Stage 3: Significand ALU Operation',
    title: `${isAdd ? 'Addition' : 'Subtraction'} of 24-bit Significands`,
    description: `Significand calculation (${isAdd ? 'ADD' : 'SUB'}):
Raw Result = ${rawSum.toString(2).padStart(25, '0')}₂ (Dec: ${rawSum}).
Result Sign: ${resultSign === 0 ? 'Positive (+)' : 'Negative (-)'}.`,
    regState: {
      expA: expA,
      expB: expB,
      expDiff,
      mantissaA: sigLarger.toString(2).padStart(24, '0'),
      mantissaB: shiftedSigSmaller.toString(2).padStart(24, '0'),
      rawSum: rawSum.toString(2).padStart(25, '0'),
      guardBit,
      roundBit,
      stickyBit,
    },
  });

  // Stage 4: Normalization
  let normalizedExp = expA;
  let normalizedSig = rawSum;

  if (rawSum === 0) {
    normalizedExp = 0;
    flags.zero = true;
  } else if (carryOut === 1 || normalizedSig >= (1 << 24)) {
    // Overflow in mantissa addition -> Shift right by 1, increment exponent
    stickyBit = stickyBit | roundBit;
    roundBit = guardBit;
    guardBit = normalizedSig & 1;
    normalizedSig = normalizedSig >> 1;
    normalizedExp += 1;
  } else {
    // Normalization left shift to bring MSB to bit 23
    while (normalizedSig > 0 && !(normalizedSig & (1 << 23)) && normalizedExp > 1) {
      normalizedSig = (normalizedSig << 1) | guardBit;
      guardBit = roundBit;
      roundBit = stickyBit;
      // sticky stays sticky
      normalizedExp -= 1;
    }
  }

  steps.push({
    stage: 'Stage 4: Post-ALU Normalization',
    title: 'Leading-Zero Detection & Normalization Shifter',
    description: `Normalized 24-bit significand: ${normalizedSig.toString(2).padStart(24, '0')}₂.
Adjusted Biased Exponent: ${normalizedExp} (2^${normalizedExp === 0 ? -126 : normalizedExp - 127}).`,
    regState: {
      expA: expA,
      expB: expB,
      expDiff,
      mantissaA: sigLarger.toString(2).padStart(24, '0'),
      mantissaB: shiftedSigSmaller.toString(2).padStart(24, '0'),
      normalizedMantissa: normalizedSig.toString(2).padStart(24, '0'),
      finalExponent: normalizedExp,
      guardBit,
      roundBit,
      stickyBit,
    },
  });

  // Stage 5: Rounding
  let roundUp = false;
  const lsb = normalizedSig & 1;

  if (guardBit === 1) {
    if (roundingMode === 'NEAREST_EVEN') {
      // Round to nearest, ties to even
      roundUp = roundBit === 1 || stickyBit === 1 || lsb === 1;
    } else if (roundingMode === 'TOWARD_POS_INF') {
      roundUp = resultSign === 0 && (guardBit === 1 || roundBit === 1 || stickyBit === 1);
    } else if (roundingMode === 'TOWARD_NEG_INF') {
      roundUp = resultSign === 1 && (guardBit === 1 || roundBit === 1 || stickyBit === 1);
    } else if (roundingMode === 'TOWARD_ZERO') {
      roundUp = false;
    }
  }

  if (guardBit || roundBit || stickyBit) {
    flags.inexact = true;
  }

  let finalSig = normalizedSig;
  let finalExp = normalizedExp;

  if (roundUp) {
    finalSig += 1;
    if (finalSig >= (1 << 24)) {
      finalSig = finalSig >> 1;
      finalExp += 1;
    }
  }

  // Check for Overflow / Underflow
  if (finalExp >= 255) {
    flags.overflow = true;
    finalExp = 255;
    finalSig = 0; // Infinity
  } else if (finalExp <= 0) {
    flags.underflow = true;
    flags.subnormal = true;
    finalExp = 0;
  }

  // Final 23-bit fraction
  const finalFrac = finalSig & 0x7fffff;

  // Reassemble IEEE-754 32-bit word
  const finalBits = ((resultSign & 1) << 31) | ((finalExp & 0xff) << 23) | (finalFrac & 0x7fffff);
  const buf = new ArrayBuffer(4);
  const u32 = new Uint32Array(buf);
  const f32 = new Float32Array(buf);
  u32[0] = finalBits;
  const computedFloatVal = f32[0];

  const finalResultObj = parseIEEE754Float(computedFloatVal);
  if (computedFloatVal === 0) flags.zero = true;

  steps.push({
    stage: 'Stage 5: Rounding & Exception Check',
    title: `Rounding (${roundingMode}) & Flag Generation`,
    description: `Rounding Decision: ${roundUp ? 'Increment Mantissa by 1' : 'Truncate / No Increment'}.
Final Pack: Sign=${resultSign}, Exponent=${finalExp} (${toBinary(finalExp, 8)}), Fraction=${toBinary(finalFrac, 23)}.
IEEE-754 Hex: ${finalResultObj.hexString} (${finalResultObj.rawFloat}).
Active Exception Flags: ${Object.entries(flags).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(', ') || 'None (Normal)'}.`,
    regState: {
      expA: expA,
      expB: expB,
      expDiff,
      mantissaA: sigLarger.toString(2).padStart(24, '0'),
      mantissaB: shiftedSigSmaller.toString(2).padStart(24, '0'),
      finalExponent: finalExp,
      finalMantissa: toBinary(finalFrac, 23),
    },
  });

  return {
    operandA: opA,
    operandB: opB,
    operation,
    roundingMode,
    result: finalResultObj,
    steps,
    flags,
    latencyCycles: 3, // Typical 3-stage pipelined FPU adder
    gateCountEst: 4280, // Single-precision FPU Add/Sub NAND2 equivalent gates
  };
}

function toBinary(n: number, width: number): string {
  return (n >>> 0).toString(2).padStart(width, '0');
}

/**
 * Real Sensor-Fusion Floating-Point Calculation Presets.
 */
export const SENSOR_FPU_PRESETS = [
  {
    id: 'gravity-bias-removal',
    name: 'Accelerometer Z-Axis Baseline Subtraction',
    sensorDomain: 'Structural Health (Bridge Vibration)',
    operandA: 1.0245,   // Raw measured acceleration with gravity (g)
    operandB: 0.980665, // Standard baseline gravity 1.0g calibration
    operation: 'SUB' as const,
    description: 'Subtracts static 1.0g Earth gravity vector from raw piezoelectric accelerometer reading to isolate dynamic bridge vibration harmonics.',
    contextFormula: 'a_dynamic = a_raw (1.0245 g) - g_ref (0.980665 g) = +0.043835 g',
  },
  {
    id: 'kalman-innovation',
    name: 'Soil Moisture Kalman Filter Innovation Update',
    sensorDomain: 'Smart Agriculture (Volumetric Water Content)',
    operandA: 42.650, // Measurement z_k (%)
    operandB: 41.225, // Predicted state H * x̂_k (%)
    operation: 'SUB' as const,
    description: 'Calculates the Kalman innovation residual (y_k = z_k - H*x_prior) for optimal recursive soil moisture estimation.',
    contextFormula: 'y_k = 42.650% - 41.225% = +1.425% residual innovation',
  },
  {
    id: 'subnormal-underflow',
    name: 'Subnormal / Underflow Edge-Case Demonstration',
    sensorDomain: 'Precision Capacitive Strain Gauge',
    operandA: 1.401298464324817e-44, // Subnormal float minimum
    operandB: 2.802596928649634e-45, // Smaller subnormal
    operation: 'SUB' as const,
    description: 'Verifies gradual underflow and subnormal representation when sensor noise drops below normalized IEEE-754 range (exp = 0).',
    contextFormula: 'Underflow test: 1.401e-44 - 2.802e-45 -> Subnormal significand handling',
  },
  {
    id: 'overflow-infinity',
    name: 'Dynamic Stress Exponent Overflow (Saturation to +Inf)',
    sensorDomain: 'Severe Structural Impact Event',
    operandA: 2.5e38,
    operandB: 2.5e38,
    operation: 'ADD' as const,
    description: 'Demonstrates exponent overflow (E > 254) when combining huge shockwave integrals, triggering the OVERFLOW exception flag and saturating to +Infinity.',
    contextFormula: '2.5e38 + 2.5e38 = 5.0e38 (Exceeds max float 3.4028e38) → +Infinity',
  },
  {
    id: 'catastrophic-cancellation',
    name: 'Near-Equal Subtraction (Loss of Significance)',
    sensorDomain: 'Differential Wheatstone Bridge Balance',
    operandA: 1.0000001192092896,
    operandB: 1.0000000000000000,
    operation: 'SUB' as const,
    description: 'Demonstrates catastrophic cancellation during differential sensor nulling, showing how normalization shifts leading zeros and tests Guard/Round/Sticky bits.',
    contextFormula: '1.000000119 - 1.000000000 = 1.192e-7 (Normalizes 23 leading zeros)',
  }
];
