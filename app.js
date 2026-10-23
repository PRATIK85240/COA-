/**
 * CPU INSTRUCTION CYCLE: FETCH, DECODE, EXECUTE
 * Interactive Educational Simulator & State Machine
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIS (Zero external files needed) ---
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    }

    playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.08) {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio error silent fallback
      }
    }

    playFetch() {
      this.playTone(520, 'sine', 0.1, 0.06);
      setTimeout(() => this.playTone(680, 'sine', 0.12, 0.06), 90);
    }

    playDecode() {
      this.playTone(440, 'triangle', 0.14, 0.07);
      setTimeout(() => this.playTone(554.37, 'triangle', 0.14, 0.07), 100);
    }

    playExecute() {
      this.playTone(587.33, 'triangle', 0.1, 0.08);
      setTimeout(() => this.playTone(880, 'sine', 0.2, 0.09), 110);
    }

    playRepeat() {
      this.playTone(330, 'sine', 0.18, 0.06);
    }

    playQuizCorrect() {
      this.playTone(523.25, 'triangle', 0.1, 0.08);
      setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.08), 80);
      setTimeout(() => this.playTone(783.99, 'triangle', 0.22, 0.09), 160);
    }

    playQuizIncorrect() {
      this.playTone(260, 'sawtooth', 0.15, 0.06);
      setTimeout(() => this.playTone(200, 'sawtooth', 0.25, 0.06), 120);
    }
  }

  const sound = new SoundManager();

  // --- PRESET INSTRUCTIONS DATA ---
  const INSTRUCTION_PRESETS = {
    ADD_5_3: {
      op: 'ADD',
      symbol: '+',
      valA: 5,
      valB: 3,
      calcResult: 8,
      instructionString: 'ADD 5, 3',
      ramAddr: '0x01',
      nextAddr: '0x02',
      description: 'Add numbers 5 and 3 to produce 8'
    },
    ADD_12_7: {
      op: 'ADD',
      symbol: '+',
      valA: 12,
      valB: 7,
      calcResult: 19,
      instructionString: 'ADD 12, 7',
      ramAddr: '0x01',
      nextAddr: '0x02',
      description: 'Add numbers 12 and 7 to produce 19'
    },
    SUB_10_4: {
      op: 'SUB',
      symbol: '-',
      valA: 10,
      valB: 4,
      calcResult: 6,
      instructionString: 'SUB 10, 4',
      ramAddr: '0x01',
      nextAddr: '0x02',
      description: 'Subtract 4 from 10 to produce 6'
    },
    MUL_4_3: {
      op: 'MUL',
      symbol: '×',
      valA: 4,
      valB: 3,
      calcResult: 12,
      instructionString: 'MUL 4, 3',
      ramAddr: '0x01',
      nextAddr: '0x02',
      description: 'Multiply 4 by 3 to produce 12'
    }
  };

  // --- STAGES CONFIGURATION ---
  const STAGES = [
    {
      id: 'fetch',
      number: 1,
      badgeText: 'FETCH',
      stepCountText: 'Phase 1 of 4',
      headline: 'Stage 1: Fetching Instruction from RAM',
      desc: (inst) => `The CPU retrieves the next instruction from RAM. The <strong>Program Counter (PC)</strong> points to memory address <code class="code-hl">${inst.ramAddr}</code>. This address is placed in the <strong>MAR</strong> and sent over the <strong>Address Bus</strong>. RAM places the instruction <code class="code-hl">${inst.instructionString}</code> onto the <strong>Data Bus</strong>, loading it into the <strong>Instruction Register (IR)</strong>. The PC then automatically increments to <code class="code-hl">${inst.nextAddr}</code>.`,
      keyPoints: (inst) => [
        `✓ PC = ${inst.ramAddr}`,
        `✓ MAR → Address Bus → RAM [${inst.ramAddr}]`,
        `✓ RAM → Data Bus → MDR → IR [${inst.instructionString}]`,
        `✓ PC increments: ${inst.ramAddr} → ${inst.nextAddr}`
      ],
      sound: () => sound.playFetch()
    },
    {
      id: 'decode',
      number: 2,
      badgeText: 'DECODE',
      stepCountText: 'Phase 2 of 4',
      headline: 'Stage 2: Decoding the Opcode & Operands',
      desc: (inst) => `The <strong>Control Unit (CU)</strong> inspects the instruction <code class="code-hl">${inst.instructionString}</code> inside the <strong>Instruction Register (IR)</strong>. It breaks it down into the <strong>Opcode</strong> (<code>${inst.op}</code>) and the <strong>Operands</strong> (<code>${inst.valA}</code> and <code>${inst.valB}</code>). The Control Unit energizes internal control lines, prepares the ALU for an arithmetic ${inst.op} operation, and loads the operands into the input buffers.`,
      keyPoints: (inst) => [
        `✓ Opcode identified: ${inst.op} (Operation: ${inst.symbol})`,
        `✓ Operands extracted: ${inst.valA} and ${inst.valB}`,
        `✓ Control Unit signals ALU to prepare for ${inst.op}`,
        `✓ ALU inputs primed: A = ${inst.valA}, B = ${inst.valB}`
      ],
      sound: () => sound.playDecode()
    },
    {
      id: 'execute',
      number: 3,
      badgeText: 'EXECUTE',
      stepCountText: 'Phase 3 of 4',
      headline: 'Stage 3: Executing Operation in ALU & Storing Result',
      desc: (inst) => `The <strong>Arithmetic Logic Unit (ALU)</strong> performs the requested calculation: <code class="code-hl">${inst.valA} ${inst.symbol} ${inst.valB} = ${inst.calcResult}</code>. The resulting output value <code class="code-hl">${inst.calcResult}</code> is immediately placed into the <strong>Accumulator (ACC)</strong> register. Condition status flags (Zero, Carry, Negative) are updated. Optionally, this result can be stored back into RAM.`,
      keyPoints: (inst) => [
        `✓ ALU calculation: ${inst.valA} ${inst.symbol} ${inst.valB} = ${inst.calcResult}`,
        `✓ Result saved into ACC: ${inst.calcResult}`,
        `✓ Condition flags updated: Zero=0, Carry=0, Negative=0`,
        `✓ Write-back ready for RAM location 0x05`
      ],
      sound: () => sound.playExecute()
    },
    {
      id: 'repeat',
      number: 4,
      badgeText: 'REPEAT',
      stepCountText: 'Phase 4 of 4',
      headline: 'Stage 4: Cycle Complete & Repeat on Next Clock Pulse',
      desc: (inst) => `The instruction cycle is now complete! The CPU checks for any pending interrupts or halts. Because the <strong>Program Counter (PC)</strong> was updated to <code class="code-hl">${inst.nextAddr}</code> during the Fetch phase, the CPU is primed and ready to start the next <strong>Fetch</strong> stage seamlessly on the next system clock pulse.`,
      keyPoints: (inst) => [
        `✓ Instruction cycle completed successfully!`,
        `✓ Output preserved in ACC (${inst.calcResult})`,
        `✓ PC points to next address: ${inst.nextAddr}`,
        `✓ Next clock tick restarts loop at STAGE 1 (Fetch)`
      ],
      sound: () => sound.playRepeat()
    }
  ];

  // --- HARDWARE COMPONENT DETAILS FOR MODAL/GLOSSARY ---
  const COMPONENT_DETAILS = {
    PC: {
      title: 'Program Counter (PC)',
      badge: 'Special Purpose Register',
      role: 'Stores the memory address of the next instruction waiting to be fetched and executed.',
      analogy: 'Like a bookmark in a book that always marks the next page you need to read.',
      howItWorks: 'During the Fetch stage, the address in the PC is copied to the MAR. Once the instruction is fetched, the PC automatically increments (PC = PC + 1) to point to the subsequent instruction.',
      technical: 'Width matches memory address space (e.g., 32-bit or 64-bit). In branches or jumps, the PC is overwritten with the jump destination address.'
    },
    MAR: {
      title: 'Memory Address Register (MAR)',
      badge: 'Address Register',
      role: 'Holds the memory address currently being accessed in RAM (either for reading an instruction/data or writing a result).',
      analogy: 'Like the address label pasted on an envelope before dropping it into the mailbox.',
      howItWorks: 'The MAR connects directly to the Address Bus lines. Whatever number is in the MAR becomes the target row in RAM.',
      technical: 'Unidirectional connection to the Address Bus.'
    },
    MDR: {
      title: 'Memory Data Register (MDR / MBR)',
      badge: 'Data Buffer Register',
      role: 'Temporarily holds data or instructions read from RAM, or data waiting to be written into RAM.',
      analogy: 'Like the physical mailbox that holds mail arriving from or departing to the outside world.',
      howItWorks: 'Connects directly to the Data Bus. When RAM completes a read cycle, the bits land directly into the MDR.',
      technical: 'Bidirectional register (can both receive from and transmit to the Data Bus).'
    },
    IR: {
      title: 'Instruction Register (IR)',
      badge: 'Instruction Buffer',
      role: 'Holds the binary representation of the instruction that is actively being decoded and executed.',
      analogy: 'Like having the specific open recipe card propped up on your cookbook stand while cooking.',
      howItWorks: 'The instruction is copied here from the MDR during the Fetch stage. The Control Unit directly reads the IR during the Decode stage.',
      technical: 'Splits into Opcode bits (operation type) and Operand fields (registers or immediate data).'
    },
    CU: {
      title: 'Control Unit (CU)',
      badge: 'Central Coordinator',
      role: 'The supervisor and conductor of the CPU. Decodes instructions and generates timing and control signals.',
      analogy: 'Like the conductor of an orchestra who signals every instrument section when to play and how loud.',
      howItWorks: 'The CU contains an instruction decoder matrix (combinational logic or microcode ROM) that converts opcodes into electrical control pulses sent to the ALU, registers, and memory.',
      technical: 'Emits signals like MemRead, MemWrite, RegWrite, and ALUOp.'
    },
    ALU: {
      title: 'Arithmetic Logic Unit (ALU)',
      badge: 'Core Computational Unit',
      role: 'Performs all mathematical calculations (addition, subtraction, multiplication) and logical comparisons (AND, OR, NOT, XOR).',
      analogy: 'The high-speed digital calculator inside the CPU.',
      howItWorks: 'Takes two binary operands, applies logic gate circuits (such as full adders and multiplexers), and produces a binary result along with condition flags.',
      technical: 'Sets CPU status flags (Zero Flag Z, Carry Flag C, Negative Flag N, Overflow Flag V).'
    },
    ACC: {
      title: 'Accumulator (ACC)',
      badge: 'General Register',
      role: 'A high-speed working register that stores the immediate intermediate and final results of arithmetic and logic operations.',
      analogy: 'The mixing bowl right in front of the chef where combined ingredients sit before being served.',
      howItWorks: 'The output of the ALU flows directly into the ACC. In many architectures, the ACC is also used as one of the implicit input operands for the next math step.',
      technical: 'Part of the CPU register file with single-clock-cycle access latency.'
    },
    BUS: {
      title: 'System Buses (Address, Data, Control)',
      badge: 'Interconnection Highways',
      role: 'A set of parallel conducting electrical wires used to transfer signals between the CPU and memory/peripherals.',
      analogy: 'A multi-lane highway system connecting different cities together.',
      howItWorks: 'Address Bus carries addresses (CPU → RAM). Data Bus transfers instructions and data bytes bidirectionally (CPU ↔ RAM). Control Bus carries read/write timing signals.',
      technical: 'Address bus width dictates maximum addressable RAM (2^N bytes). Data bus width dictates word transfer size (32-bit, 64-bit).'
    },
    RAM: {
      title: 'Random Access Memory (RAM)',
      badge: 'Primary Storage',
      role: 'Volatile main memory holding active program code instructions and runtime data variables.',
      analogy: 'The big bookshelf or pantry containing all the books and ingredients the CPU can reach into quickly.',
      howItWorks: 'Organized as an indexed array of memory cells. When given an address and a READ signal, it outputs the stored byte onto the Data Bus.',
      technical: 'High speed compared to SSD/disk, but volatile (contents vanish when power is disconnected).'
    }
  };

  // --- QUIZ QUESTIONS DATA ---
  const QUIZ_QUESTIONS = [
    {
      question: 'Which CPU register holds the memory address of the NEXT instruction waiting to be executed?',
      options: [
        'Memory Data Register (MDR)',
        'Program Counter (PC)',
        'Instruction Register (IR)',
        'Accumulator (ACC)'
      ],
      correctIndex: 1,
      explanation: 'The Program Counter (PC) stores the memory address of the next instruction. It automatically increments during the Fetch phase so the CPU knows where to go next.'
    },
    {
      question: 'During the DECODE stage, what is the primary role of the Control Unit (CU)?',
      options: [
        'Perform arithmetic calculations like 5 + 3',
        'Store the instruction permanently on the hard drive',
        'Interpret the opcode to determine what operation is needed and prepare data pathways',
        'Send the final calculated answer to the monitor'
      ],
      correctIndex: 2,
      explanation: 'During Decode, the Control Unit interprets the Opcode inside the Instruction Register (IR) and coordinates the CPU components and control signals for the upcoming operation.'
    },
    {
      question: 'In the example instruction "ADD 5, 3", which CPU component actually performs the addition to compute 8?',
      options: [
        'Arithmetic Logic Unit (ALU)',
        'Program Counter (PC)',
        'Memory Address Register (MAR)',
        'Address Bus'
      ],
      correctIndex: 0,
      explanation: 'The Arithmetic Logic Unit (ALU) contains the digital logic circuits (like adders) that perform arithmetic operations (+, -, ×) and logical comparisons.'
    },
    {
      question: 'Which system bus carries the actual instruction (e.g. "ADD 5, 3") from RAM into the CPU?',
      options: [
        'Address Bus',
        'Data Bus',
        'Control Bus',
        'Power Bus'
      ],
      correctIndex: 1,
      explanation: 'The Data Bus is bidirectional and carries the actual data and instructions between RAM and the CPU. The Address Bus only carries memory addresses.'
    },
    {
      question: 'Immediately after the ALU computes 5 + 3 = 8 during the Execute stage, where is the result 8 typically stored?',
      options: [
        'Program Counter (PC)',
        'Instruction Register (IR)',
        'Accumulator (ACC) Register',
        'Address Bus'
      ],
      correctIndex: 2,
      explanation: 'The Accumulator (ACC) is the primary working register in the CPU that receives and stores the immediate result of an ALU operation.'
    }
  ];

  // --- APP STATE ---
  let currentStageIndex = 0;
  let currentInstructionKey = 'ADD_5_3';
  let activeInstruction = { ...INSTRUCTION_PRESETS.ADD_5_3 };
  let isPlaying = false;
  let playInterval = null;
  let playSpeed = 1500;

  // Quiz state
  let quizCurrentIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;
  let userAnswers = [];

  // --- DOM ELEMENT REFERENCES ---
  const flowNodes = {
    fetch: document.getElementById('node-fetch'),
    decode: document.getElementById('node-decode'),
    execute: document.getElementById('node-execute'),
    repeat: document.getElementById('node-repeat')
  };

  const modeBadge = document.getElementById('modeBadge');
  const stageBadge = document.getElementById('stageBadge');
  const stepCounter = document.getElementById('stepCounter');
  const stageHeadline = document.getElementById('stageHeadline');
  const stageDesc = document.getElementById('stageDesc');
  const stageKeyPoints = document.getElementById('stageKeyPoints');
  const explanationBanner = document.getElementById('explanationBanner');

  // Controls
  const presetSelect = document.getElementById('instructionPreset');
  const customInputsRow = document.getElementById('customInputs');
  const customOpSelect = document.getElementById('customOp');
  const customVal1Input = document.getElementById('customVal1');
  const customVal2Input = document.getElementById('customVal2');
  const applyCustomBtn = document.getElementById('applyCustomBtn');

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const resetBtn = document.getElementById('resetBtn');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const playText = document.getElementById('playText');
  const speedSelect = document.getElementById('speedSelect');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundState = document.getElementById('soundState');

  // Hardware visual elements
  const cuModule = document.getElementById('cuModule');
  const aluModule = document.getElementById('aluModule');
  const cuDecoderValue = document.getElementById('cuDecoderValue');
  const sigFetch = document.getElementById('sigFetch');
  const sigDecode = document.getElementById('sigDecode');
  const sigALU = document.getElementById('sigALU');
  const sigWrite = document.getElementById('sigWrite');

  const aluInA = document.getElementById('aluInA');
  const aluOpSymbol = document.getElementById('aluOpSymbol');
  const aluInB = document.getElementById('aluInB');
  const aluOutResult = document.getElementById('aluOutResult');

  // Registers
  const regPC = document.getElementById('regPC');
  const regMAR = document.getElementById('regMAR');
  const regMDR = document.getElementById('regMDR');
  const regIR = document.getElementById('regIR');
  const regACC = document.getElementById('regACC');

  const valPC = document.getElementById('valPC');
  const valMAR = document.getElementById('valMAR');
  const valMDR = document.getElementById('valMDR');
  const valIR = document.getElementById('valIR');
  const valACC = document.getElementById('valACC');

  // Buses
  const busAddress = document.getElementById('busAddress');
  const busData = document.getElementById('busData');
  const busControl = document.getElementById('busControl');
  const packetAddress = document.getElementById('packetAddress');
  const packetData = document.getElementById('packetData');
  const packetControl = document.getElementById('packetControl');

  // RAM rows
  const ramRow1 = document.getElementById('ramRow1');
  const ramRow1Inst = document.getElementById('ramRow1Inst');
  const ramRow1Desc = document.getElementById('ramRow1Desc');
  const ramRow4Data = document.getElementById('ramRow4Data');
  const ramRow5Result = document.getElementById('ramRow5Result');

  // Math summary
  const summaryInst = document.getElementById('summaryInst');
  const summaryOp = document.getElementById('summaryOp');
  const summaryCalc = document.getElementById('summaryCalc');
  const summaryResult = document.getElementById('summaryResult');

  // Modal
  const compModal = document.getElementById('compModal');
  const modalCompTitle = document.getElementById('modalCompTitle');
  const modalCompBody = document.getElementById('modalCompBody');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Quiz DOM
  const currentQuestionNum = document.getElementById('currentQuestionNum');
  const totalQuestionsNum = document.getElementById('totalQuestionsNum');
  const liveScore = document.getElementById('liveScore');
  const maxScore = document.getElementById('maxScore');
  const quizProgressFill = document.getElementById('quizProgressFill');
  const quizCard = document.getElementById('quizCard');
  const quizQuestion = document.getElementById('quizQuestion');
  const quizOptions = document.getElementById('quizOptions');
  const quizFeedback = document.getElementById('quizFeedback');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackExplanation = document.getElementById('feedbackExplanation');
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');
  const quizResultsCard = document.getElementById('quizResultsCard');
  const finalScoreDisplay = document.getElementById('finalScoreDisplay');
  const finalTotalDisplay = document.getElementById('finalTotalDisplay');
  const scorePercent = document.getElementById('scorePercent');
  const resultsRank = document.getElementById('resultsRank');
  const resultsSummaryList = document.getElementById('resultsSummaryList');
  const retakeQuizBtn = document.getElementById('retakeQuizBtn');

  // --- INITIALIZATION ---
  function init() {
    updateInstructionPreset();
    renderStage(0);
    initQuiz();
    bindEvents();
  }

  // --- INSTRUCTION UPDATES ---
  function updateInstructionPreset() {
    const val = presetSelect.value;
    if (val === 'CUSTOM') {
      customInputsRow.classList.remove('hidden');
    } else {
      customInputsRow.classList.add('hidden');
      if (INSTRUCTION_PRESETS[val]) {
        currentInstructionKey = val;
        activeInstruction = { ...INSTRUCTION_PRESETS[val] };
      }
    }
    updateRamAndSummary();
    renderStage(currentStageIndex);
  }

  function applyCustomInstruction() {
    const op = customOpSelect.value;
    const valA = parseInt(customVal1Input.value, 10) || 0;
    const valB = parseInt(customVal2Input.value, 10) || 0;
    let symbol = '+';
    let calcResult = valA + valB;

    if (op === 'SUB') {
      symbol = '-';
      calcResult = valA - valB;
    } else if (op === 'MUL') {
      symbol = '×';
      calcResult = valA * valB;
    }

    activeInstruction = {
      op: op,
      symbol: symbol,
      valA: valA,
      valB: valB,
      calcResult: calcResult,
      instructionString: `${op} ${valA}, ${valB}`,
      ramAddr: '0x01',
      nextAddr: '0x02',
      description: `Perform ${op} on ${valA} and ${valB}`
    };

    updateRamAndSummary();
    resetSimulation();
  }

  function updateRamAndSummary() {
    ramRow1Inst.textContent = activeInstruction.instructionString;
    ramRow1Desc.textContent = `← Current (${activeInstruction.instructionString})`;
    ramRow4Data.textContent = activeInstruction.valA;
    ramRow5Result.textContent = `[Empty]`;

    summaryInst.textContent = activeInstruction.instructionString;
    summaryOp.textContent = `Opcode: ${activeInstruction.op} (${activeInstruction.symbol})`;
    summaryCalc.textContent = `${activeInstruction.valA} ${activeInstruction.symbol} ${activeInstruction.valB}`;
    summaryResult.textContent = `?`;
  }

  // --- SIMULATION STAGE RENDERER ---
  function renderStage(index) {
    currentStageIndex = index;
    const stage = STAGES[index];

    // Play stage sound
    stage.sound();

    // Update Flow Nodes
    Object.keys(flowNodes).forEach((k) => {
      flowNodes[k].classList.remove('active');
    });
    if (flowNodes[stage.id]) {
      flowNodes[stage.id].classList.add('active');
    }

    // Update Banner & Explanations
    modeBadge.textContent = `Step ${stage.number} of 4`;
    stageBadge.textContent = stage.badgeText;
    stepCounter.textContent = stage.stepCountText;
    stageHeadline.textContent = stage.headline;
    stageDesc.innerHTML = stage.desc(activeInstruction);

    // Update Banner color themes
    explanationBanner.className = 'stage-explanation-banner';
    explanationBanner.classList.add(`stage-${stage.id}`);

    // Update Key Points
    stageKeyPoints.innerHTML = '';
    stage.keyPoints(activeInstruction).forEach((pt) => {
      const chip = document.createElement('span');
      chip.className = 'point-chip';
      chip.textContent = pt;
      stageKeyPoints.appendChild(chip);
    });

    // Update Navigation Button States
    prevBtn.disabled = index === 0;
    nextBtn.disabled = false;

    // Reset all hardware highlights
    clearHardwareHighlights();

    // Apply stage-specific hardware behaviors
    if (stage.id === 'fetch') {
      applyFetchHardware();
    } else if (stage.id === 'decode') {
      applyDecodeHardware();
    } else if (stage.id === 'execute') {
      applyExecuteHardware();
    } else if (stage.id === 'repeat') {
      applyRepeatHardware();
    }
  }

  function clearHardwareHighlights() {
    [cuModule, aluModule].forEach((m) => {
      m.classList.remove('active-module', 'active-module-decode', 'active-module-execute');
    });

    [regPC, regMAR, regMDR, regIR, regACC].forEach((r) => {
      r.classList.remove('highlight-reg', 'highlight-reg-green', 'highlight-reg-purple');
    });

    [busAddress, busData, busControl].forEach((b) => {
      b.classList.remove('bus-active', 'bus-active-amber', 'bus-active-green');
    });

    packetAddress.className = 'bus-packet';
    packetData.className = 'bus-packet';
    packetControl.className = 'bus-packet';

    ramRow1.classList.remove('active-ram-row');
  }

  // --- HARDWARE STAGE HANDLERS ---
  function applyFetchHardware() {
    // Registers
    valPC.textContent = activeInstruction.ramAddr;
    valMAR.textContent = activeInstruction.ramAddr;
    valMDR.textContent = activeInstruction.instructionString;
    valIR.textContent = activeInstruction.instructionString;
    valACC.textContent = '0';

    regPC.classList.add('highlight-reg');
    regMAR.classList.add('highlight-reg');
    regMDR.classList.add('highlight-reg');
    regIR.classList.add('highlight-reg');

    // Control Unit
    cuDecoderValue.textContent = `Fetching instruction from ${activeInstruction.ramAddr}...`;
    sigFetch.innerHTML = 'FETCH_SIG: <b class="val-on">1</b>';
    sigDecode.innerHTML = 'DECODE_SIG: <b class="val-off">0</b>';
    sigALU.innerHTML = 'ALU_OP: <b class="val-off">IDLE</b>';
    sigWrite.innerHTML = 'REG_WRITE: <b class="val-off">0</b>';

    // ALU
    aluInA.textContent = `A: -`;
    aluOpSymbol.textContent = activeInstruction.symbol;
    aluInB.textContent = `B: -`;
    aluOutResult.textContent = `?`;

    // Buses
    busAddress.classList.add('bus-active-amber');
    packetAddress.textContent = activeInstruction.ramAddr;
    packetAddress.classList.add('packet-traveling-right');

    busData.classList.add('bus-active');
    packetData.textContent = activeInstruction.instructionString;
    packetData.classList.add('packet-traveling-left');

    busControl.classList.add('bus-active');
    packetControl.textContent = 'READ_MEM';
    packetControl.classList.add('packet-traveling-right');

    // RAM
    ramRow1.classList.add('active-ram-row');
    ramRow5Result.textContent = '[Empty]';

    // Summary
    summaryResult.textContent = '?';
  }

  function applyDecodeHardware() {
    // Registers
    valPC.textContent = activeInstruction.nextAddr;
    valMAR.textContent = activeInstruction.ramAddr;
    valMDR.textContent = activeInstruction.instructionString;
    valIR.textContent = activeInstruction.instructionString;
    valACC.textContent = '0';

    regIR.classList.add('highlight-reg-purple');
    cuModule.classList.add('active-module-decode');

    // Control Unit
    cuDecoderValue.textContent = `Opcode: ${activeInstruction.op} | Operands: ${activeInstruction.valA}, ${activeInstruction.valB}`;
    sigFetch.innerHTML = 'FETCH_SIG: <b class="val-off">0</b>';
    sigDecode.innerHTML = 'DECODE_SIG: <b class="val-on">1</b>';
    sigALU.innerHTML = `ALU_OP: <b class="val-on">${activeInstruction.op}</b>`;
    sigWrite.innerHTML = 'REG_WRITE: <b class="val-off">0</b>';

    // ALU Inputs Primed
    aluInA.textContent = `A: ${activeInstruction.valA}`;
    aluOpSymbol.textContent = activeInstruction.symbol;
    aluInB.textContent = `B: ${activeInstruction.valB}`;
    aluOutResult.textContent = `?`;

    // Summary
    summaryResult.textContent = 'Decoded (Ready to calc)';
  }

  function applyExecuteHardware() {
    // Registers
    valPC.textContent = activeInstruction.nextAddr;
    valMAR.textContent = '0x05';
    valMDR.textContent = `${activeInstruction.calcResult}`;
    valIR.textContent = activeInstruction.instructionString;
    valACC.textContent = `${activeInstruction.calcResult}`;

    regACC.classList.add('highlight-reg-green');
    aluModule.classList.add('active-module-execute');

    // Control Unit
    cuDecoderValue.textContent = `Execution complete. Output: ${activeInstruction.calcResult}`;
    sigFetch.innerHTML = 'FETCH_SIG: <b class="val-off">0</b>';
    sigDecode.innerHTML = 'DECODE_SIG: <b class="val-off">0</b>';
    sigALU.innerHTML = `ALU_OP: <b class="val-on">EXEC_${activeInstruction.op}</b>`;
    sigWrite.innerHTML = 'REG_WRITE: <b class="val-on">1</b>';

    // ALU
    aluInA.textContent = `A: ${activeInstruction.valA}`;
    aluOpSymbol.textContent = activeInstruction.symbol;
    aluInB.textContent = `B: ${activeInstruction.valB}`;
    aluOutResult.textContent = `${activeInstruction.calcResult}`;

    // Bus for writeback
    busData.classList.add('bus-active-green');
    packetData.textContent = `RESULT: ${activeInstruction.calcResult}`;
    packetData.classList.add('packet-traveling-right');

    busControl.classList.add('bus-active-green');
    packetControl.textContent = 'WRITE_MEM';
    packetControl.classList.add('packet-traveling-right');

    // RAM Result
    ramRow5Result.textContent = `${activeInstruction.calcResult}`;

    // Summary
    summaryResult.textContent = `${activeInstruction.calcResult}`;
  }

  function applyRepeatHardware() {
    // Complete cycle state
    valPC.textContent = activeInstruction.nextAddr;
    valMAR.textContent = activeInstruction.nextAddr;
    valMDR.textContent = `LOAD 0x05`;
    valIR.textContent = activeInstruction.instructionString;
    valACC.textContent = `${activeInstruction.calcResult}`;

    regPC.classList.add('highlight-reg');

    cuDecoderValue.textContent = `Cycle finished. Next Instruction at ${activeInstruction.nextAddr}...`;
    sigFetch.innerHTML = 'FETCH_SIG: <b class="val-on">READY</b>';
    sigDecode.innerHTML = 'DECODE_SIG: <b class="val-off">0</b>';
    sigALU.innerHTML = 'ALU_OP: <b class="val-off">STANDBY</b>';
    sigWrite.innerHTML = 'REG_WRITE: <b class="val-off">0</b>';

    summaryResult.textContent = `${activeInstruction.calcResult} (Saved in ACC)`;
  }

  // --- PLAYBACK CONTROLS ---
  function nextStep() {
    if (currentStageIndex < STAGES.length - 1) {
      renderStage(currentStageIndex + 1);
    } else {
      // Loop back to fetch
      renderStage(0);
    }
  }

  function prevStep() {
    if (currentStageIndex > 0) {
      renderStage(currentStageIndex - 1);
    }
  }

  function resetSimulation() {
    pauseAutoPlay();
    renderStage(0);
  }

  function toggleAutoPlay() {
    if (isPlaying) {
      pauseAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    isPlaying = true;
    playIcon.innerHTML = '&#10074;&#10074;';
    playText.textContent = 'Pause';
    playBtn.classList.replace('btn-accent', 'btn-secondary');

    playInterval = setInterval(() => {
      nextStep();
    }, playSpeed);
  }

  function pauseAutoPlay() {
    isPlaying = false;
    playIcon.innerHTML = '&#9654;';
    playText.textContent = 'Auto Play';
    playBtn.classList.replace('btn-secondary', 'btn-accent');

    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }

  // --- COMPONENT MODAL HANDLER ---
  function showComponentModal(compKey) {
    const comp = COMPONENT_DETAILS[compKey];
    if (!comp) return;

    modalCompTitle.textContent = comp.title;
    modalCompBody.innerHTML = `
      <div style="margin-bottom: 0.75rem;">
        <span class="comp-badge">${comp.badge}</span>
      </div>
      <p style="font-size: 1rem; color: #f8fafc; margin-bottom: 1rem; font-weight: 600;">
        ${comp.role}
      </p>
      <div style="background: rgba(255, 255, 255, 0.05); padding: 0.85rem; border-left: 3px solid var(--color-fetch); border-radius: 6px; margin-bottom: 1rem;">
        <strong style="color: #38bdf8; display: block; font-size: 0.85rem; margin-bottom: 0.25rem;">Real-World Analogy:</strong>
        <span style="font-size: 0.9rem; color: #e2e8f0;">${comp.analogy}</span>
      </div>
      <div style="margin-bottom: 0.85rem;">
        <strong style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.25rem;">How it operates in the cycle:</strong>
        <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.5;">${comp.howItWorks}</p>
      </div>
      <div>
        <strong style="display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.25rem;">Technical Detail:</strong>
        <p style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.5;">${comp.technical}</p>
      </div>
    `;

    compModal.showModal();
  }

  // --- QUIZ LOGIC ---
  function initQuiz() {
    quizCurrentIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    userAnswers = [];
    totalQuestionsNum.textContent = QUIZ_QUESTIONS.length;
    maxScore.textContent = QUIZ_QUESTIONS.length;
    quizResultsCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    renderQuizQuestion(quizCurrentIndex);
  }

  function renderQuizQuestion(index) {
    quizAnswered = false;
    const q = QUIZ_QUESTIONS[index];

    currentQuestionNum.textContent = index + 1;
    liveScore.textContent = quizScore;

    // Progress bar
    const percent = Math.round(((index + 1) / QUIZ_QUESTIONS.length) * 100);
    quizProgressFill.style.width = `${percent}%`;

    quizQuestion.textContent = `${index + 1}. ${q.question}`;
    quizOptions.innerHTML = '';
    quizFeedback.classList.add('hidden');
    nextQuestionBtn.classList.add('hidden');

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.innerHTML = `
        <span class="option-letter">${letters[optIdx]}</span>
        <span class="option-text">${optText}</span>
      `;
      btn.addEventListener('click', () => handleQuizOptionClick(optIdx));
      quizOptions.appendChild(btn);
    });
  }

  function handleQuizOptionClick(selectedIndex) {
    if (quizAnswered) return;
    quizAnswered = true;

    const q = QUIZ_QUESTIONS[quizCurrentIndex];
    const isCorrect = selectedIndex === q.correctIndex;

    userAnswers.push({
      question: q.question,
      chosen: q.options[selectedIndex],
      correct: q.options[q.correctIndex],
      isCorrect: isCorrect
    });

    const optionButtons = quizOptions.querySelectorAll('.quiz-option-btn');
    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) {
        btn.classList.add('correct');
      } else if (idx === selectedIndex) {
        btn.classList.add('incorrect');
      }
    });

    // Feedback
    quizFeedback.classList.remove('hidden');
    if (isCorrect) {
      quizScore++;
      liveScore.textContent = quizScore;
      sound.playQuizCorrect();
      feedbackIcon.className = 'feedback-icon icon-correct';
      feedbackIcon.innerHTML = '&#10003;';
      feedbackTitle.textContent = 'Correct!';
      feedbackTitle.style.color = '#34d399';
    } else {
      sound.playQuizIncorrect();
      feedbackIcon.className = 'feedback-icon icon-incorrect';
      feedbackIcon.innerHTML = '&#10007;';
      feedbackTitle.textContent = 'Incorrect';
      feedbackTitle.style.color = '#f87171';
    }

    feedbackExplanation.textContent = q.explanation;

    // Show Next or View Results button
    nextQuestionBtn.classList.remove('hidden');
    if (quizCurrentIndex === QUIZ_QUESTIONS.length - 1) {
      nextQuestionBtn.textContent = 'View Final Results 🏆';
    } else {
      nextQuestionBtn.innerHTML = 'Next Question &rarr;';
    }
  }

  function handleNextQuestion() {
    if (quizCurrentIndex < QUIZ_QUESTIONS.length - 1) {
      quizCurrentIndex++;
      renderQuizQuestion(quizCurrentIndex);
    } else {
      showQuizResults();
    }
  }

  function showQuizResults() {
    quizCard.classList.add('hidden');
    quizResultsCard.classList.remove('hidden');

    finalScoreDisplay.textContent = quizScore;
    finalTotalDisplay.textContent = QUIZ_QUESTIONS.length;
    const percentage = Math.round((quizScore / QUIZ_QUESTIONS.length) * 100);
    scorePercent.textContent = `${percentage}%`;

    // Ranking and trophy
    let rank = 'Computer Architecture Master!';
    let trophy = '🏆';
    if (percentage === 100) {
      rank = 'Perfect Score: Certified CPU Architect!';
      trophy = '🏆';
    } else if (percentage >= 80) {
      rank = 'Excellent: Senior Hardware Engineer!';
      trophy = '🌟';
    } else if (percentage >= 60) {
      rank = 'Good Job: Rising Computer Scientist!';
      trophy = '🚀';
    } else {
      rank = 'Review Concepts & Try Again to Level Up!';
      trophy = '📚';
    }

    document.getElementById('resultsTrophy').textContent = trophy;
    resultsRank.textContent = rank;

    // Render review summary
    resultsSummaryList.innerHTML = '';
    userAnswers.forEach((ans, idx) => {
      const item = document.createElement('div');
      item.className = 'review-item';
      item.innerHTML = `
        <div class="review-q">${idx + 1}. ${ans.question}</div>
        <div style="font-size: 0.8rem; margin-top: 0.2rem;">
          <span style="color: ${ans.isCorrect ? '#34d399' : '#f87171'};">
            ${ans.isCorrect ? '✓ Correct' : '✗ Your answer: ' + ans.chosen}
          </span>
          ${!ans.isCorrect ? `<br><span class="review-a">Correct answer: ${ans.correct}</span>` : ''}
        </div>
      `;
      resultsSummaryList.appendChild(item);
    });
  }

  // --- EVENT LISTENERS ---
  function bindEvents() {
    // Flow Node direct clicks
    Object.keys(flowNodes).forEach((k, idx) => {
      flowNodes[k].addEventListener('click', () => {
        pauseAutoPlay();
        renderStage(idx);
      });
      flowNodes[k].addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          pauseAutoPlay();
          renderStage(idx);
        }
      });
    });

    // Control buttons
    nextBtn.addEventListener('click', () => {
      pauseAutoPlay();
      nextStep();
    });

    prevBtn.addEventListener('click', () => {
      pauseAutoPlay();
      prevStep();
    });

    resetBtn.addEventListener('click', () => {
      resetSimulation();
    });

    playBtn.addEventListener('click', () => {
      toggleAutoPlay();
    });

    speedSelect.addEventListener('change', (e) => {
      playSpeed = parseInt(e.target.value, 10);
      if (isPlaying) {
        pauseAutoPlay();
        startAutoPlay();
      }
    });

    // Instruction Preset selector
    presetSelect.addEventListener('change', updateInstructionPreset);
    applyCustomBtn.addEventListener('click', applyCustomInstruction);

    // Audio toggle
    soundToggleBtn.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      if (sound.enabled) {
        soundIcon.textContent = '🔊';
        soundState.textContent = 'ON';
        sound.playTone(600, 'sine', 0.1);
      } else {
        soundIcon.textContent = '🔇';
        soundState.textContent = 'OFF';
      }
    });

    // Component inspection triggers
    regPC.addEventListener('click', () => showComponentModal('PC'));
    regMAR.addEventListener('click', () => showComponentModal('MAR'));
    regMDR.addEventListener('click', () => showComponentModal('MDR'));
    regIR.addEventListener('click', () => showComponentModal('IR'));
    regACC.addEventListener('click', () => showComponentModal('ACC'));
    cuModule.addEventListener('click', () => showComponentModal('CU'));
    aluModule.addEventListener('click', () => showComponentModal('ALU'));
    busAddress.addEventListener('click', () => showComponentModal('BUS'));
    busData.addEventListener('click', () => showComponentModal('BUS'));
    busControl.addEventListener('click', () => showComponentModal('BUS'));
    document.getElementById('ramBox').addEventListener('click', () => showComponentModal('RAM'));

    // Component glossary cards
    const compCards = document.querySelectorAll('.component-card');
    compCards.forEach((card) => {
      card.addEventListener('click', () => {
        const title = card.querySelector('h4').textContent;
        if (title.includes('Program Counter')) showComponentModal('PC');
        else if (title.includes('Memory Address')) showComponentModal('MAR');
        else if (title.includes('Memory Data')) showComponentModal('MDR');
        else if (title.includes('Instruction Register')) showComponentModal('IR');
        else if (title.includes('Control Unit')) showComponentModal('CU');
        else if (title.includes('Arithmetic Logic')) showComponentModal('ALU');
        else if (title.includes('Accumulator')) showComponentModal('ACC');
        else if (title.includes('System Buses')) showComponentModal('BUS');
      });
    });

    // Modal close
    closeModalBtn.addEventListener('click', () => compModal.close());
    compModal.addEventListener('click', (e) => {
      if (e.target === compModal) compModal.close();
    });

    // Quiz buttons
    nextQuestionBtn.addEventListener('click', handleNextQuestion);
    retakeQuizBtn.addEventListener('click', initQuiz);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if focus is in input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        pauseAutoPlay();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pauseAutoPlay();
        prevStep();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetSimulation();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        toggleAutoPlay();
      } else if (e.key === 'm' || e.key === 'M') {
        soundToggleBtn.click();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
