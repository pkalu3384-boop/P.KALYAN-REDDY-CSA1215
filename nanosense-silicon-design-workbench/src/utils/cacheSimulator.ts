import {
  CacheConfig,
  CacheLineState,
  CacheSetState,
  CacheSimulationStats,
  MemoryAccessTrace,
} from '../types';

/**
 * Creates initial cache state given configuration.
 */
export function initializeCache(config: CacheConfig): CacheSetState[] {
  const numSets = config.cacheSizeBytes / (config.lineSizeBytes * config.associativity);
  const sets: CacheSetState[] = [];

  for (let s = 0; s < numSets; s++) {
    const lines: CacheLineState[] = [];
    for (let w = 0; w < config.associativity; w++) {
      lines.push({
        valid: false,
        dirty: false,
        tag: 0,
        lruCounter: 0,
        dataBlock: new Array(config.lineSizeBytes).fill(0),
      });
    }
    sets.push({ lines });
  }

  return sets;
}

/**
 * Decomposes a 32-bit physical address into Tag, Set Index, and Block Offset.
 */
export function decodeAddress(address: number, config: CacheConfig) {
  const offsetBits = Math.log2(config.lineSizeBytes);
  const numSets = config.cacheSizeBytes / (config.lineSizeBytes * config.associativity);
  const indexBits = Math.log2(numSets);
  const tagBits = 32 - offsetBits - indexBits;

  const offsetMask = (1 << offsetBits) - 1;
  const indexMask = (1 << indexBits) - 1;

  const offset = address & offsetMask;
  const index = (address >>> offsetBits) & indexMask;
  const tag = address >>> (offsetBits + indexBits);

  return {
    offset,
    index,
    tag,
    offsetBits,
    indexBits,
    tagBits,
    numSets,
  };
}

/**
 * Generates typical IoT Sliding-Window Sensor Buffer Memory Access Traces.
 */
export function generateSensorBufferTrace(
  patternType: 'CIRCULAR_STREAM' | 'SLIDING_WINDOW_FIR' | 'INTERLEAVED_FFT' = 'SLIDING_WINDOW_FIR'
): { address: number; operation: 'READ' | 'WRITE'; source: string }[] {
  const trace: { address: number; operation: 'READ' | 'WRITE'; source: string }[] = [];
  const BUFFER_BASE = 0x20000000; // SRAM Circular Buffer Base
  const CALIB_BASE = 0x20000400;  // Calibration Table Base (Conflict probe)
  const OUTPUT_BASE = 0x20000800; // Processed Output FIFO

  if (patternType === 'CIRCULAR_STREAM') {
    // 64 sequential writes of incoming ADC samples to circular ring buffer, followed by reading
    for (let i = 0; i < 64; i++) {
      const addr = BUFFER_BASE + (i * 2); // 16-bit samples
      trace.push({ address: addr, operation: 'WRITE', source: `ADC_DMA_Write[Sample_${i}]` });
    }
    for (let i = 0; i < 64; i++) {
      const addr = BUFFER_BASE + (i * 2);
      trace.push({ address: addr, operation: 'READ', source: `Core_DSP_Read[Sample_${i}]` });
    }
  } else if (patternType === 'SLIDING_WINDOW_FIR') {
    // 8-tap FIR filter sliding over 32 sensor samples, interleaved with 8-coefficient calibration access
    const windowSize = 24;
    const filterTaps = 6;

    for (let w = 0; w < windowSize; w++) {
      // For each window position, read filterTaps samples and corresponding calibration coefficients
      for (let k = 0; k < filterTaps; k++) {
        const sampleAddr = BUFFER_BASE + (((w + k) % 32) * 2);
        const coeffAddr = CALIB_BASE + (k * 2);

        trace.push({ address: sampleAddr, operation: 'READ', source: `FIR_Sample[w=${w},k=${k}]` });
        trace.push({ address: coeffAddr, operation: 'READ', source: `FIR_Coeff[k=${k}]` });
      }
      // Store filtered output
      trace.push({ address: OUTPUT_BASE + (w * 4), operation: 'WRITE', source: `FIR_Out[w=${w}]` });
    }
  } else {
    // Interleaved FFT butterfly access pattern across 64 samples
    for (let stage = 0; stage < 3; stage++) {
      const stride = 1 << stage;
      for (let i = 0; i < 32; i += stride * 2) {
        for (let j = 0; j < stride; j++) {
          const addr1 = BUFFER_BASE + ((i + j) * 4);
          const addr2 = BUFFER_BASE + ((i + j + stride) * 4);
          const twiddleAddr = CALIB_BASE + (j * 4);

          trace.push({ address: addr1, operation: 'READ', source: `FFT_Elem_A[${i + j}]` });
          trace.push({ address: addr2, operation: 'READ', source: `FFT_Elem_B[${i + j + stride}]` });
          trace.push({ address: twiddleAddr, operation: 'READ', source: `Twiddle_W[${j}]` });
          trace.push({ address: addr1, operation: 'WRITE', source: `FFT_Store_A[${i + j}]` });
          trace.push({ address: addr2, operation: 'WRITE', source: `FFT_Store_B[${i + j + stride}]` });
        }
      }
    }
  }

  return trace;
}

/**
 * Runs a complete cache trace simulation.
 */
export function simulateCacheTrace(
  config: CacheConfig,
  traceEvents: { address: number; operation: 'READ' | 'WRITE'; source: string }[]
): {
  cacheState: CacheSetState[];
  detailedTraces: MemoryAccessTrace[];
  stats: CacheSimulationStats;
} {
  const sets = initializeCache(config);
  const detailedTraces: MemoryAccessTrace[] = [];

  let hits = 0;
  let misses = 0;
  let compulsoryMisses = 0;
  let conflictMisses = 0;
  let capacityMisses = 0;

  const seenBlocks = new Set<number>();
  let lruGlobalTimer = 0;

  for (const event of traceEvents) {
    lruGlobalTimer++;
    const { address, operation, source } = event;
    const { offset, index, tag, offsetBits } = decodeAddress(address, config);
    const blockAddress = address >>> offsetBits;

    const set = sets[index];
    let isHit = false;
    let hitWay = -1;

    // Check all ways in the set for matching valid tag
    for (let w = 0; w < set.lines.length; w++) {
      const line = set.lines[w];
      if (line.valid && line.tag === tag) {
        isHit = true;
        hitWay = w;
        line.lruCounter = lruGlobalTimer;
        if (operation === 'WRITE') {
          if (config.writePolicy === 'WRITE_BACK') {
            line.dirty = true;
          }
        }
        line.lastAddressAccessed = address;
        break;
      }
    }

    let missType: 'COMPULSORY' | 'CONFLICT' | 'CAPACITY' | undefined;
    let evictedWay: number | undefined;
    let dirtyEvicted = false;

    if (isHit) {
      hits++;
    } else {
      misses++;

      // Classify Miss Type
      if (!seenBlocks.has(blockAddress)) {
        missType = 'COMPULSORY';
        compulsoryMisses++;
        seenBlocks.add(blockAddress);
      } else {
        // Was it capacity or conflict?
        // If total unique blocks cached exceeds total cache capacity -> Capacity miss, else Conflict
        const totalLinesInCache = config.cacheSizeBytes / config.lineSizeBytes;
        if (seenBlocks.size > totalLinesInCache) {
          missType = 'CAPACITY';
          capacityMisses++;
        } else {
          missType = 'CONFLICT';
          conflictMisses++;
        }
      }

      // Find replacement victim way
      let targetWay = -1;

      // 1. Check for invalid line first
      for (let w = 0; w < set.lines.length; w++) {
        if (!set.lines[w].valid) {
          targetWay = w;
          break;
        }
      }

      // 2. If all lines valid, apply replacement policy
      if (targetWay === -1) {
        if (config.replacementPolicy === 'LRU') {
          let oldestTime = Infinity;
          for (let w = 0; w < set.lines.length; w++) {
            if (set.lines[w].lruCounter < oldestTime) {
              oldestTime = set.lines[w].lruCounter;
              targetWay = w;
            }
          }
        } else if (config.replacementPolicy === 'FIFO') {
          targetWay = 0; // Simple FIFO queue
        } else {
          // Random
          targetWay = Math.floor(Math.random() * set.lines.length);
        }

        evictedWay = targetWay;
        if (set.lines[targetWay].dirty && config.writePolicy === 'WRITE_BACK') {
          dirtyEvicted = true;
        }
      }

      // Install new line into targetWay
      const victim = set.lines[targetWay];
      victim.valid = true;
      victim.tag = tag;
      victim.lruCounter = lruGlobalTimer;
      victim.dirty = operation === 'WRITE' && config.writePolicy === 'WRITE_BACK';
      victim.lastAddressAccessed = address;
    }

    detailedTraces.push({
      address,
      operation,
      source,
      tag,
      index,
      offset,
      isHit,
      missType,
      evictedWay,
      dirtyEvicted,
    });
  }

  const totalAccesses = traceEvents.length;
  const hitRate = totalAccesses > 0 ? +(hits / totalAccesses).toFixed(4) : 0;
  const missRate = totalAccesses > 0 ? +(misses / totalAccesses).toFixed(4) : 0;

  // AMAT = Hit Time + (Miss Rate * Miss Penalty)
  const amatCycles = +(config.hitLatencyCycles + (missRate * config.missPenaltyCycles)).toFixed(2);

  // Energy: Hits * E_hit + Misses * E_miss (in nanoJoules)
  const totalEnergyNanoJoules = +(
    (hits * config.energyPerHitPicoJoules + misses * config.energyPerMissPicoJoules) / 1000
  ).toFixed(3);

  // Battery life calculation on CR2032 (220 mAh @ 3V = 660 mWh = 2.376e6 Joules)
  // Assuming 1000 sensor buffer processing runs per day
  const dailyEnergyJoules = (totalEnergyNanoJoules * 1e-9) * 1000;
  const totalBatteryJoules = 0.22 * 3.0 * 3600 * 0.85; // 85% usable battery efficiency
  const batteryDaysCR2032 = dailyEnergyJoules > 0 ? Math.round(totalBatteryJoules / dailyEnergyJoules) : 9999;

  return {
    cacheState: sets,
    detailedTraces,
    stats: {
      totalAccesses,
      hits,
      misses,
      hitRate,
      missRate,
      compulsoryMisses,
      conflictMisses,
      capacityMisses,
      amatCycles,
      totalEnergyNanoJoules,
      batteryDaysCR2032,
    },
  };
}

/**
 * Standard Default Configurations for Side-by-Side Comparison.
 */
export const DEFAULT_DIRECT_MAPPED_CONFIG: CacheConfig = {
  cacheSizeBytes: 256,
  lineSizeBytes: 16,
  associativity: 1, // Direct-Mapped
  replacementPolicy: 'LRU',
  writePolicy: 'WRITE_BACK',
  hitLatencyCycles: 1,
  missPenaltyCycles: 24,
  energyPerHitPicoJoules: 1.2,
  energyPerMissPicoJoules: 35.0,
};

export const DEFAULT_2WAY_CONFIG: CacheConfig = {
  cacheSizeBytes: 256,
  lineSizeBytes: 16,
  associativity: 2, // 2-Way Set-Associative
  replacementPolicy: 'LRU',
  writePolicy: 'WRITE_BACK',
  hitLatencyCycles: 1.1, // Slight mux delay in critical path
  missPenaltyCycles: 24,
  energyPerHitPicoJoules: 1.6, // Tag comparator & way mux energy
  energyPerMissPicoJoules: 35.0,
};
