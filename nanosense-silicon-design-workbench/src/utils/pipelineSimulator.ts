import {
  HazardEvent,
  HazardMitigationMode,
  Instruction,
  PipelineCell,
  PipelineSimulationResult,
  PipelineStageName,
} from '../types';

/**
 * Standard Sensor Fusion Assembly Program for IoT Microcontroller.
 * Samples ADC, scales by calibration coefficient, accumulates rolling window,
 * checks shock/anomaly threshold, and writes result to SRAM buffer.
 */
export const DEFAULT_SENSOR_FUSION_PROGRAM: Instruction[] = [
  {
    id: 1,
    pc: 0x0000,
    asm: 'LW    R1, 0(R4)',
    opcode: 'LW',
    rd: 'R1',
    rs: 'R4',
    imm: 0,
    comment: 'Load raw ADC vibration sample from peripheral FIFO [R4] into R1',
  },
  {
    id: 2,
    pc: 0x0004,
    asm: 'MUL   R2, R1, R5',
    opcode: 'MUL',
    rd: 'R2',
    rs: 'R1',
    rt: 'R5',
    comment: 'Scale raw reading R1 with calibration gain R5 into R2 (RAW Hazard on R1!)',
  },
  {
    id: 3,
    pc: 0x0008,
    asm: 'ADD   R3, R3, R2',
    opcode: 'ADD',
    rd: 'R3',
    rs: 'R3',
    rt: 'R2',
    comment: 'Accumulate into sliding window energy sum R3 (RAW Hazard on R2!)',
  },
  {
    id: 4,
    pc: 0x000C,
    asm: 'LW    R6, 4(R4)',
    opcode: 'LW',
    rd: 'R6',
    rs: 'R4',
    imm: 4,
    comment: 'Load structural safety threshold limit into R6',
  },
  {
    id: 5,
    pc: 0x0010,
    asm: 'SUB   R7, R2, R6',
    opcode: 'SUB',
    rd: 'R7',
    rs: 'R2',
    rt: 'R6',
    comment: 'Compute threshold delta R7 = R2 - R6 (RAW Hazard on R6!)',
  },
  {
    id: 6,
    pc: 0x0014,
    asm: 'BEQ   R7, R0, 0x0020',
    opcode: 'BEQ',
    rs: 'R7',
    rt: 'R0',
    imm: 8,
    comment: 'Branch if delta == 0 (no shock detected) (Control Branch Hazard on R7!)',
  },
  {
    id: 7,
    pc: 0x0018,
    asm: 'SW    R2, 8(R4)',
    opcode: 'SW',
    rs: 'R2',
    rt: 'R4',
    imm: 8,
    comment: 'Store critical anomaly sample to Flash alert ring buffer',
  },
  {
    id: 8,
    pc: 0x001C,
    asm: 'ADDI  R4, R4, 12',
    opcode: 'ADDI',
    rd: 'R4',
    rs: 'R4',
    imm: 12,
    comment: 'Advance DMA circular buffer pointer to next sample slot',
  },
];

/**
 * Reordered Sensor Fusion Assembly Program (Compiler Scheduling).
 * Interleaves independent instructions to eliminate load-use bubbles and branch delay penalty.
 */
export const REORDERED_SENSOR_FUSION_PROGRAM: Instruction[] = [
  {
    id: 1,
    pc: 0x0000,
    asm: 'LW    R1, 0(R4)',
    opcode: 'LW',
    rd: 'R1',
    rs: 'R4',
    imm: 0,
    comment: 'Load raw ADC sample into R1',
  },
  {
    id: 4,
    pc: 0x0004,
    asm: 'LW    R6, 4(R4)',
    opcode: 'LW',
    rd: 'R6',
    rs: 'R4',
    imm: 4,
    comment: '[SCHEDULED] Load threshold R6 early to hide R1 load latency!',
  },
  {
    id: 2,
    pc: 0x0008,
    asm: 'MUL   R2, R1, R5',
    opcode: 'MUL',
    rd: 'R2',
    rs: 'R1',
    rt: 'R5',
    comment: 'Multiply R1 × R5 (R1 is now ready from MEM stage without stall)',
  },
  {
    id: 8,
    pc: 0x000C,
    asm: 'ADDI  R4, R4, 12',
    opcode: 'ADDI',
    rd: 'R4',
    rs: 'R4',
    imm: 12,
    comment: '[SCHEDULED] Advance buffer pointer R4 early (independent instruction)',
  },
  {
    id: 3,
    pc: 0x0010,
    asm: 'ADD   R3, R3, R2',
    opcode: 'ADD',
    rd: 'R3',
    rs: 'R3',
    rt: 'R2',
    comment: 'Accumulate sliding window sum R3',
  },
  {
    id: 5,
    pc: 0x0014,
    asm: 'SUB   R7, R2, R6',
    opcode: 'SUB',
    rd: 'R7',
    rs: 'R2',
    rt: 'R6',
    comment: 'Compute threshold delta R7 = R2 - R6 (R6 ready, R2 forwarded)',
  },
  {
    id: 6,
    pc: 0x0018,
    asm: 'BEQ   R7, R0, 0x0024',
    opcode: 'BEQ',
    rs: 'R7',
    rt: 'R0',
    imm: 8,
    comment: 'Branch condition evaluation',
  },
  {
    id: 7,
    pc: 0x001C,
    asm: 'SW    R2, -4(R4)',
    opcode: 'SW',
    rs: 'R2',
    rt: 'R4',
    imm: -4,
    comment: 'Branch delay slot: Store sample (Executed cleanly in delay slot)',
  },
];

/**
 * Simulates a 5-stage classic RISC pipeline (IF, ID, EX, MEM, WB).
 */
export function simulatePipeline(
  programInput: Instruction[] = DEFAULT_SENSOR_FUSION_PROGRAM,
  mode: HazardMitigationMode = 'FULL_FORWARDING'
): PipelineSimulationResult {
  const program = mode === 'FORWARDING_AND_REORDERING'
    ? REORDERED_SENSOR_FUSION_PROGRAM
    : programInput;

  const hazards: HazardEvent[] = [];
  const numInstr = program.length;
  const maxCycles = 30;

  // Grid [instructionIndex][cycleIndex]
  const grid: (PipelineCell | null)[][] = Array.from({ length: numInstr }, () =>
    Array(maxCycles).fill(null)
  );

  const cycleLogs: PipelineSimulationResult['cycleLogs'] = [];

  let currentCycle = 1;
  let stallCount = 0;
  let flushCount = 0;

  // Track progress of each instruction: { instrIdx, currentStageIndex, fetchCycle }
  // Stage sequence: 0: IF, 1: ID, 2: EX, 3: MEM, 4: WB
  const stages: PipelineStageName[] = ['IF', 'ID', 'EX', 'MEM', 'WB'];

  interface ActiveInstr {
    instrIdx: number;
    stageIdx: number; // 0 to 4
    stalledCycles: number;
  }

  const inFlight: ActiveInstr[] = [];
  let nextFetchIdx = 0;

  while (currentCycle < maxCycles) {
    const activeLog: Record<PipelineStageName, string> = {
      IF: '-',
      ID: '-',
      EX: '-',
      MEM: '-',
      WB: '-',
    };
    const forwardEventsThisCycle: string[] = [];
    const hazardsThisCycle: string[] = [];

    // Advance instructions from WB down to IF (reverse order to avoid race conditions)
    // Check WB stage retirements
    for (let i = inFlight.length - 1; i >= 0; i--) {
      const item = inFlight[i];
      if (item.stageIdx === 4) {
        // WB completed
        inFlight.splice(i, 1);
      }
    }

    // Check hazards and determine stalls
    let stallPipeline = false;
    let stallReason = '';

    // Identify instruction in ID stage
    const idInstrItem = inFlight.find((item) => item.stageIdx === 1);
    const exInstrItem = inFlight.find((item) => item.stageIdx === 2);
    const memInstrItem = inFlight.find((item) => item.stageIdx === 3);
    const wbInstrItem = inFlight.find((item) => item.stageIdx === 4);

    if (idInstrItem) {
      const idInstr = program[idInstrItem.instrIdx];
      const readRegs = [idInstr.rs, idInstr.rt].filter(Boolean) as string[];

      // Check against EX stage
      if (exInstrItem) {
        const exInstr = program[exInstrItem.instrIdx];
        const exDest = exInstr.rd || (exInstr.opcode === 'LW' ? exInstr.rd : undefined);

        if (exDest && readRegs.includes(exDest) && exDest !== 'R0') {
          if (mode === 'NO_FORWARDING') {
            // Must stall until WB stage completes (2 stalls)
            stallPipeline = true;
            stallReason = `RAW Hazard: '${idInstr.asm}' needs ${exDest}, currently in EX stage ('${exInstr.asm}'). Stalling without forwarding.`;
            hazards.push({
              cycle: currentCycle,
              instructionId: idInstr.id,
              type: 'DATA_RAW',
              description: stallReason,
              mitigation: 'Hardware Stall (Pipeline Bubble)',
              stalledCycles: 1,
            });
            hazardsThisCycle.push(stallReason);
          } else {
            // Forwarding mode
            if (exInstr.opcode === 'LW') {
              // Load-Use Hazard: Cannot forward from EX because data is not read until MEM!
              stallPipeline = true;
              stallReason = `Load-Use Data Hazard: '${idInstr.asm}' depends on '${exInstr.asm}' (${exDest}). Data not available until MEM stage. Required 1-cycle stall.`;
              hazards.push({
                cycle: currentCycle,
                instructionId: idInstr.id,
                type: 'LOAD_USE',
                description: stallReason,
                mitigation: '1-Cycle Load-Use Bubble + EX Forwarding',
                stalledCycles: 1,
              });
              hazardsThisCycle.push(stallReason);
            } else {
              // Can forward from EX directly to EX next cycle!
              forwardEventsThisCycle.push(`Forwarding: [EX → ID/EX] Register ${exDest} from '${exInstr.asm}' to '${idInstr.asm}'`);
            }
          }
        }
      }

      // Check against MEM stage
      if (!stallPipeline && memInstrItem) {
        const memInstr = program[memInstrItem.instrIdx];
        const memDest = memInstr.rd;

        if (memDest && readRegs.includes(memDest) && memDest !== 'R0') {
          if (mode === 'NO_FORWARDING') {
            stallPipeline = true;
            stallReason = `RAW Hazard: '${idInstr.asm}' needs ${memDest} from MEM stage ('${memInstr.asm}'). Stalling.`;
            hazards.push({
              cycle: currentCycle,
              instructionId: idInstr.id,
              type: 'DATA_RAW',
              description: stallReason,
              mitigation: 'Hardware Stall',
              stalledCycles: 1,
            });
            hazardsThisCycle.push(stallReason);
          } else {
            forwardEventsThisCycle.push(`Forwarding: [MEM → EX] Register ${memDest} from '${memInstr.asm}' to '${idInstr.asm}'`);
          }
        }
      }

      // Check Control Hazard for Branch (BEQ)
      if (idInstr.opcode === 'BEQ' || idInstr.opcode === 'BNE') {
        if (mode === 'NO_FORWARDING') {
          // Branch resolved in MEM stage -> 3-cycle penalty
          hazardsThisCycle.push(`Control Hazard: Branch instruction '${idInstr.asm}' resolved in MEM stage (Branch Penalty).`);
        } else {
          hazardsThisCycle.push(`Control Hazard: Branch resolved in ID/EX with Static Predict-Not-Taken logic.`);
        }
      }
    }

    // Advance stages for instructions
    for (const item of inFlight) {
      const stageName = stages[item.stageIdx];
      const instr = program[item.instrIdx];

      if (stallPipeline && (item.stageIdx === 0 || item.stageIdx === 1)) {
        // Stalled in IF or ID
        grid[item.instrIdx][currentCycle - 1] = {
          instructionId: instr.id,
          stage: item.stageIdx === 1 ? 'ID' : 'IF',
        };
        activeLog[stageName] = `${instr.asm} [STALL]`;
      } else {
        grid[item.instrIdx][currentCycle - 1] = {
          instructionId: instr.id,
          stage: stageName,
          isForwarded: forwardEventsThisCycle.length > 0,
        };
        activeLog[stageName] = instr.asm;
        item.stageIdx += 1;
      }
    }

    if (stallPipeline) {
      stallCount++;
    } else {
      // Can fetch next instruction
      if (nextFetchIdx < program.length) {
        inFlight.push({
          instrIdx: nextFetchIdx,
          stageIdx: 0, // IF
          stalledCycles: 0,
        });
        nextFetchIdx++;
      }
    }

    cycleLogs.push({
      cycle: currentCycle,
      activeStages: activeLog,
      forwardingEvents: forwardEventsThisCycle,
      hazardsDetected: hazardsThisCycle,
    });

    currentCycle++;

    // Termination condition: all instructions reached WB and retired
    if (nextFetchIdx >= program.length && inFlight.length === 0) {
      break;
    }
  }

  const totalCycles = currentCycle - 1;
  const instructionCount = program.length;
  const cpi = +(totalCycles / instructionCount).toFixed(2);
  const ipc = +(instructionCount / totalCycles).toFixed(2);

  return {
    program,
    mitigationMode: mode,
    totalCycles,
    instructionCount,
    cpi,
    ipc,
    stallCycles: stallCount,
    flushCycles: flushCount,
    hazards,
    grid,
    cycleLogs,
  };
}
