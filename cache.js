/**
 * CACHE MEMORY MAPPING VISUALIZER
 * Simple, interactive logic for Direct, Associative, and Set-Associative mapping.
 */

(function () {
  'use strict';

  // Constants & State
  const TOTAL_MEMORY_BLOCKS = 16;
  const TOTAL_CACHE_LINES = 4;

  let currentMode = 'direct'; // 'direct', 'associative', 'set-associative'
  let accessTimestamp = 0;

  // Cache Lines Storage
  // Each line: { id, valid: 0|1, tag: null, block: null, lastUsed: 0, status: 'empty' }
  let cacheLines = [];

  // Hit / Miss Stats
  let stats = {
    hits: 0,
    misses: 0
  };

  // 3-Question Quiz Data
  const QUIZ_QUESTIONS = [
    {
      q: 'In Direct Mapping with 4 cache lines, which cache line will Memory Block 9 map to?',
      options: [
        'Line 0',
        'Line 1 (because 9 mod 4 = 1)',
        'Line 2',
        'Line 3'
      ],
      correct: 1,
      explanation: 'In Direct Mapping, the line number is calculated as Block Number % Total Cache Lines. Here, 9 % 4 = 1 (remainder 1), so Block 9 must go into Line 1.'
    },
    {
      q: 'Which cache mapping technique allows a memory block to be placed in ANY free cache line without restriction?',
      options: [
        'Direct Mapping',
        'Fully Associative Mapping',
        '2-Way Set-Associative Mapping',
        'None of the above'
      ],
      correct: 1,
      explanation: 'Fully Associative Mapping has no fixed line restriction. A memory block can be stored in any cache line that happens to be empty, which completely eliminates conflict misses.'
    },
    {
      q: 'Why do almost all modern computer processors (Intel, AMD, Apple) use Set-Associative mapping for their main caches?',
      options: [
        'Because it is the slowest possible method',
        'Because it only works with 2 lines',
        'It strikes the best balance: drastically reduces conflict misses while keeping search hardware fast and affordable',
        'It completely avoids using RAM'
      ],
      correct: 2,
      explanation: 'Set-Associative mapping combines the best of both worlds: by dividing the cache into small sets (e.g. 2-way, 4-way, or 8-way), it avoids Direct Mapping thrashing conflicts while avoiding the extreme hardware cost of Fully Associative search.'
    }
  ];

  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  // DOM Elements
  const tabDirect = document.getElementById('tabDirect');
  const tabAssociative = document.getElementById('tabAssociative');
  const tabSetAssoc = document.getElementById('tabSetAssoc');

  const ruleBadge = document.getElementById('ruleBadge');
  const ruleSub = document.getElementById('ruleSub');
  const ruleEquation = document.getElementById('ruleEquation');
  const ruleMathPreview = document.getElementById('ruleMathPreview');

  const blockInput = document.getElementById('blockInput');
  const accessBtn = document.getElementById('accessBtn');
  const resetCacheBtn = document.getElementById('resetCacheBtn');

  const statusBanner = document.getElementById('statusBanner');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusMsg = document.getElementById('statusMsg');

  const hitCount = document.getElementById('hitCount');
  const missCount = document.getElementById('missCount');
  const hitRate = document.getElementById('hitRate');

  const memoryBlocksGrid = document.getElementById('memoryBlocksGrid');
  const cacheLinesWrapper = document.getElementById('cacheLinesWrapper');
  const cacheSub = document.getElementById('cacheSub');

  const valTagBits = document.getElementById('valTagBits');
  const labelIndexBits = document.getElementById('labelIndexBits');
  const valIndexBits = document.getElementById('valIndexBits');
  const arrowExplanation = document.getElementById('arrowExplanation');
  const miniExplanation = document.getElementById('miniExplanation');

  // Quiz DOM Elements
  const quizProgText = document.getElementById('quizProgText');
  const quizScoreVal = document.getElementById('quizScoreVal');
  const quizQuestionBox = document.getElementById('quizQuestionBox');
  const quizQuestionTitle = document.getElementById('quizQuestionTitle');
  const quizChoices = document.getElementById('quizChoices');
  const quizExplanation = document.getElementById('quizExplanation');
  const quizExplanationTitle = document.getElementById('quizExplanationTitle');
  const quizExplanationText = document.getElementById('quizExplanationText');
  const nextQuizBtn = document.getElementById('nextQuizBtn');
  const quizResultBox = document.getElementById('quizResultBox');
  const quizFinalScore = document.getElementById('quizFinalScore');
  const restartQuizBtn = document.getElementById('restartQuizBtn');

  // Helper: Convert number to 4-bit binary string
  function toBinary(num, bits = 4) {
    return num.toString(2).padStart(bits, '0');
  }

  // Initialize Cache
  function initCache() {
    cacheLines = [];
    for (let i = 0; i < TOTAL_CACHE_LINES; i++) {
      cacheLines.push({
        id: i,
        valid: 0,
        tag: null,
        block: null,
        lastUsed: 0,
        status: 'empty'
      });
    }
  }

  // Reset Stats & Cache
  function resetAll() {
    initCache();
    stats.hits = 0;
    stats.misses = 0;
    accessTimestamp = 0;
    updateStatsDisplay();
    renderMemoryBlocks();
    renderCacheView();
    resetBanner();
  }

  function resetBanner() {
    statusBanner.className = 'status-banner';
    statusIcon.textContent = 'ℹ️';
    statusTitle.textContent = 'Ready for Access';
    statusMsg.textContent = 'Click any memory block below (or type a number 0–15) to see how it maps into cache.';
    valTagBits.textContent = '--';
    valIndexBits.textContent = '--';
    arrowExplanation.textContent = 'Select a block';
  }

  function updateStatsDisplay() {
    hitCount.textContent = stats.hits;
    missCount.textContent = stats.misses;
    const total = stats.hits + stats.misses;
    const rate = total > 0 ? Math.round((stats.hits / total) * 100) : 0;
    hitRate.textContent = `${rate}%`;
  }

  // Render Memory Blocks Grid (0 to 15)
  function renderMemoryBlocks() {
    memoryBlocksGrid.innerHTML = '';
    for (let i = 0; i < TOTAL_MEMORY_BLOCKS; i++) {
      const btn = document.createElement('button');
      btn.className = 'mem-block-btn';
      btn.id = `memBlockBtn-${i}`;
      btn.dataset.block = i;

      let targetText = '';
      if (currentMode === 'direct') {
        targetText = `→ Line ${i % 4}`;
      } else if (currentMode === 'set-associative') {
        targetText = `→ Set ${i % 2}`;
      } else {
        targetText = `→ Any Line`;
      }

      btn.innerHTML = `
        <span class="mem-block-num">Block ${i}</span>
        <span class="mem-block-bin">${toBinary(i, 4)}</span>
        <span class="mem-block-target">${targetText}</span>
      `;

      btn.addEventListener('click', () => {
        accessBlock(i);
      });

      memoryBlocksGrid.appendChild(btn);
    }
  }

  // Render Cache View
  function renderCacheView() {
    cacheLinesWrapper.innerHTML = '';

    if (currentMode === 'set-associative') {
      cacheSub.textContent = '2 Sets × 2 Ways (Set 0: Lines 0 & 1, Set 1: Lines 2 & 3)';

      // Group into 2 Sets
      for (let setIdx = 0; setIdx < 2; setIdx++) {
        const setDiv = document.createElement('div');
        setDiv.className = 'cache-set-group';
        setDiv.id = `cacheSetGroup-${setIdx}`;
        setDiv.innerHTML = `<span class="set-group-title">SET ${setIdx} (Blocks with Block % 2 == ${setIdx})</span>`;

        const lineIndices = setIdx === 0 ? [0, 1] : [2, 3];
        lineIndices.forEach((lineIdx) => {
          const lineCard = createLineCardElement(lineIdx, `Set ${setIdx}, Way ${lineIdx % 2}`);
          setDiv.appendChild(lineCard);
        });

        cacheLinesWrapper.appendChild(setDiv);
      }
    } else {
      cacheSub.textContent = currentMode === 'direct' ? '4 Lines (Line = Block % 4)' : '4 Lines (Any empty line used)';
      for (let i = 0; i < TOTAL_CACHE_LINES; i++) {
        const lineCard = createLineCardElement(i, currentMode === 'direct' ? `Holds: ${i}, ${i+4}, ${i+8}, ${i+12}` : 'Holds any block');
        cacheLinesWrapper.appendChild(lineCard);
      }
    }
  }

  function createLineCardElement(lineIdx, subtitle) {
    const item = cacheLines[lineIdx];
    const card = document.createElement('div');
    card.className = 'cache-line-card';
    card.id = `cacheLineCard-${lineIdx}`;

    const validClass = item.valid === 1 ? 'valid-1' : 'valid-0';
    const tagDisplay = item.tag !== null ? item.tag : '--';
    const blockDisplay = item.block !== null ? `Block ${item.block}` : '[Empty]';

    let statusText = 'Empty';
    let statusClass = 'status-empty';
    if (item.status === 'hit') {
      statusText = '✓ HIT';
      statusClass = 'status-hit';
    } else if (item.status === 'loaded') {
      statusText = 'Loaded (MISS)';
      statusClass = 'status-loaded';
    } else if (item.status === 'evicted') {
      statusText = 'Replaced Old';
      statusClass = 'status-evicted';
    }

    card.innerHTML = `
      <div class="cache-line-id">
        <strong class="line-label">Line ${lineIdx}</strong>
        <span class="line-allowed">${subtitle}</span>
      </div>
      <div class="cache-line-data">
        <span class="badge-valid ${validClass}">V: ${item.valid}</span>
        <span class="tag-label">Tag: <b>${tagDisplay}</b></span>
        <span class="stored-block-pill">${blockDisplay}</span>
      </div>
      <span class="line-status-chip ${statusClass}">${statusText}</span>
    `;

    return card;
  }

  // --- ACCESS BLOCK CORE LOGIC ---
  function accessBlock(blockNum) {
    if (blockNum < 0 || blockNum >= TOTAL_MEMORY_BLOCKS || isNaN(blockNum)) {
      alert('Please enter a valid memory block between 0 and 15.');
      return;
    }

    accessTimestamp++;
    blockInput.value = blockNum;

    // Highlight active memory button
    document.querySelectorAll('.mem-block-btn').forEach((b) => b.classList.remove('active-source'));
    const sourceBtn = document.getElementById(`memBlockBtn-${blockNum}`);
    if (sourceBtn) sourceBtn.classList.add('active-source');

    const bin4 = toBinary(blockNum, 4);

    if (currentMode === 'direct') {
      accessDirect(blockNum, bin4);
    } else if (currentMode === 'associative') {
      accessAssociative(blockNum, bin4);
    } else if (currentMode === 'set-associative') {
      accessSetAssociative(blockNum, bin4);
    }

    updateStatsDisplay();
  }

  // 1. Direct Mapping Access
  function accessDirect(blockNum, bin4) {
    const targetLine = blockNum % TOTAL_CACHE_LINES; // 0, 1, 2, or 3
    const tagBits = bin4.slice(0, 2); // First 2 bits (bits 3..2)
    const lineBits = bin4.slice(2, 4); // Last 2 bits (bits 1..0)

    valTagBits.textContent = tagBits;
    labelIndexBits.textContent = 'Line Index (2 bits)';
    valIndexBits.textContent = lineBits;
    arrowExplanation.textContent = `Block ${blockNum} % 4 = Line ${targetLine}`;

    const line = cacheLines[targetLine];
    const isHit = line.valid === 1 && line.block === blockNum;

    // Reset status flags
    cacheLines.forEach((l) => (l.status = l.valid === 1 ? 'loaded' : 'empty'));

    if (isHit) {
      stats.hits++;
      line.status = 'hit';
      line.lastUsed = accessTimestamp;

      renderCacheView();
      highlightLine(targetLine, true);

      statusBanner.className = 'status-banner banner-hit';
      statusIcon.textContent = '🟢';
      statusTitle.textContent = `CACHE HIT! (Block ${blockNum} found in Line ${targetLine})`;
      statusMsg.textContent = `Tag matches (${tagBits}). CPU retrieves Block ${blockNum} instantly from Line ${targetLine} with zero RAM wait!`;
    } else {
      stats.misses++;
      const wasEvicted = line.valid === 1;
      const oldBlock = line.block;

      line.valid = 1;
      line.tag = tagBits;
      line.block = blockNum;
      line.lastUsed = accessTimestamp;
      line.status = wasEvicted ? 'evicted' : 'loaded';

      renderCacheView();
      highlightLine(targetLine, false);

      statusBanner.className = 'status-banner banner-miss';
      statusIcon.textContent = '🔵';
      statusTitle.textContent = `CACHE MISS! (Loaded Block ${blockNum} into Line ${targetLine})`;

      if (wasEvicted) {
        statusMsg.textContent = `Conflict Miss! Old Block ${oldBlock} was evicted from Line ${targetLine} to make room for Block ${blockNum}.`;
      } else {
        statusMsg.textContent = `Line ${targetLine} was empty. Fetched Block ${blockNum} from RAM and loaded it into Cache Line ${targetLine}.`;
      }
    }
  }

  // 2. Fully Associative Mapping Access
  function accessAssociative(blockNum, bin4) {
    const tagBits = bin4; // All 4 bits are tag!
    valTagBits.textContent = tagBits;
    labelIndexBits.textContent = 'Index (None)';
    valIndexBits.textContent = 'None';
    arrowExplanation.textContent = `Block ${blockNum} can go into ANY line`;

    // Check all lines for hit
    let hitLineIndex = -1;
    for (let i = 0; i < TOTAL_CACHE_LINES; i++) {
      if (cacheLines[i].valid === 1 && cacheLines[i].block === blockNum) {
        hitLineIndex = i;
        break;
      }
    }

    cacheLines.forEach((l) => (l.status = l.valid === 1 ? 'loaded' : 'empty'));

    if (hitLineIndex !== -1) {
      // Hit!
      stats.hits++;
      const line = cacheLines[hitLineIndex];
      line.status = 'hit';
      line.lastUsed = accessTimestamp;

      renderCacheView();
      highlightLine(hitLineIndex, true);

      statusBanner.className = 'status-banner banner-hit';
      statusIcon.textContent = '🟢';
      statusTitle.textContent = `CACHE HIT! (Block ${blockNum} found in Line ${hitLineIndex})`;
      statusMsg.textContent = `Parallel search found tag ${tagBits} in Line ${hitLineIndex}. Fast retrieval!`;
    } else {
      // Miss! Find empty line or LRU line
      stats.misses++;
      let targetLine = -1;

      // 1. First look for an empty line
      for (let i = 0; i < TOTAL_CACHE_LINES; i++) {
        if (cacheLines[i].valid === 0) {
          targetLine = i;
          break;
        }
      }

      // 2. If all lines full, find LRU line (minimum lastUsed timestamp)
      let wasEvicted = false;
      let evictedBlock = null;
      if (targetLine === -1) {
        wasEvicted = true;
        let oldestTime = Infinity;
        for (let i = 0; i < TOTAL_CACHE_LINES; i++) {
          if (cacheLines[i].lastUsed < oldestTime) {
            oldestTime = cacheLines[i].lastUsed;
            targetLine = i;
          }
        }
        evictedBlock = cacheLines[targetLine].block;
      }

      const line = cacheLines[targetLine];
      line.valid = 1;
      line.tag = tagBits;
      line.block = blockNum;
      line.lastUsed = accessTimestamp;
      line.status = wasEvicted ? 'evicted' : 'loaded';

      renderCacheView();
      highlightLine(targetLine, false);

      statusBanner.className = 'status-banner banner-miss';
      statusIcon.textContent = '🔵';
      statusTitle.textContent = `CACHE MISS! (Loaded Block ${blockNum} into Line ${targetLine})`;

      if (wasEvicted) {
        statusMsg.textContent = `Cache was completely full. Least Recently Used (LRU) Block ${evictedBlock} in Line ${targetLine} was replaced.`;
      } else {
        statusMsg.textContent = `Placed Block ${blockNum} into empty Line ${targetLine}. Zero conflict restrictions!`;
      }
    }
  }

  // 3. 2-Way Set-Associative Access
  function accessSetAssociative(blockNum, bin4) {
    const targetSet = blockNum % 2; // 0 or 1
    const tagBits = bin4.slice(0, 3); // First 3 bits
    const setBit = bin4.slice(3, 4); // Last 1 bit (0 or 1)

    valTagBits.textContent = tagBits;
    labelIndexBits.textContent = 'Set Index (1 bit)';
    valIndexBits.textContent = setBit;
    arrowExplanation.textContent = `Block ${blockNum} % 2 = Set ${targetSet}`;

    const candidateLines = targetSet === 0 ? [0, 1] : [2, 3];

    // Check for hit within the assigned Set
    let hitLineIndex = -1;
    for (let idx of candidateLines) {
      if (cacheLines[idx].valid === 1 && cacheLines[idx].block === blockNum) {
        hitLineIndex = idx;
        break;
      }
    }

    cacheLines.forEach((l) => (l.status = l.valid === 1 ? 'loaded' : 'empty'));

    if (hitLineIndex !== -1) {
      // Hit!
      stats.hits++;
      const line = cacheLines[hitLineIndex];
      line.status = 'hit';
      line.lastUsed = accessTimestamp;

      renderCacheView();
      highlightLine(hitLineIndex, true);

      statusBanner.className = 'status-banner banner-hit';
      statusIcon.textContent = '🟢';
      statusTitle.textContent = `CACHE HIT! (Block ${blockNum} found in Set ${targetSet}, Line ${hitLineIndex})`;
      statusMsg.textContent = `Matched tag ${tagBits} inside Set ${targetSet}. Fast and conflict-free!`;
    } else {
      // Miss! Find empty line inside targetSet or evict LRU inside that Set
      stats.misses++;
      let targetLine = -1;

      for (let idx of candidateLines) {
        if (cacheLines[idx].valid === 0) {
          targetLine = idx;
          break;
        }
      }

      let wasEvicted = false;
      let evictedBlock = null;
      if (targetLine === -1) {
        wasEvicted = true;
        // Evict older line in this set
        targetLine = cacheLines[candidateLines[0]].lastUsed < cacheLines[candidateLines[1]].lastUsed ? candidateLines[0] : candidateLines[1];
        evictedBlock = cacheLines[targetLine].block;
      }

      const line = cacheLines[targetLine];
      line.valid = 1;
      line.tag = tagBits;
      line.block = blockNum;
      line.lastUsed = accessTimestamp;
      line.status = wasEvicted ? 'evicted' : 'loaded';

      renderCacheView();
      highlightLine(targetLine, false);

      statusBanner.className = 'status-banner banner-miss';
      statusIcon.textContent = '🔵';
      statusTitle.textContent = `CACHE MISS! (Loaded Block ${blockNum} into Set ${targetSet}, Line ${targetLine})`;

      if (wasEvicted) {
        statusMsg.textContent = `Both lines in Set ${targetSet} were full. LRU Block ${evictedBlock} in Line ${targetLine} was evicted.`;
      } else {
        statusMsg.textContent = `Loaded Block ${blockNum} into free slot in Set ${targetSet}. You had 2 choices in this set!`;
      }
    }
  }

  function highlightLine(lineIdx, isHit) {
    const card = document.getElementById(`cacheLineCard-${lineIdx}`);
    if (card) {
      card.classList.remove('line-highlight', 'line-miss-highlight');
      void card.offsetWidth; // trigger reflow
      card.classList.add(isHit ? 'line-highlight' : 'line-miss-highlight');
    }
  }

  // --- MODE SWITCHING ---
  function setMode(mode) {
    currentMode = mode;
    [tabDirect, tabAssociative, tabSetAssoc].forEach((tab) => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });

    if (mode === 'direct') {
      tabDirect.classList.add('active');
      tabDirect.setAttribute('aria-selected', 'true');
      ruleBadge.textContent = 'Direct Mapping Formula';
      ruleBadge.style.color = 'var(--direct-color)';
      ruleBadge.style.background = 'var(--direct-bg)';
      ruleSub.textContent = 'Fixed 1-to-1 Mapping';
      ruleEquation.textContent = 'Cache Line = (Block Number) mod (Number of Cache Lines)';
      ruleMathPreview.innerHTML = 'Formula: <strong>Line = Block % 4</strong> &bull; Example: Block 6 &rarr; Line 2 (since 6 % 4 = 2)';
      miniExplanation.innerHTML = 'In <strong>Direct Mapping</strong>, 4 cache lines mean we take <code>Block # mod 4</code> to determine the exact cache line.';
    } else if (mode === 'associative') {
      tabAssociative.classList.add('active');
      tabAssociative.setAttribute('aria-selected', 'true');
      ruleBadge.textContent = 'Fully Associative Rule';
      ruleBadge.style.color = 'var(--assoc-color)';
      ruleBadge.style.background = 'var(--assoc-bg)';
      ruleSub.textContent = 'Flexible Unrestricted Placement';
      ruleEquation.textContent = 'Placement = ANY Empty Line (or LRU line when full)';
      ruleMathPreview.innerHTML = 'Formula: <strong>No Fixed Line Index</strong> &bull; Example: Block 6 can go into Line 0, 1, 2, or 3!';
      miniExplanation.innerHTML = 'In <strong>Fully Associative Mapping</strong>, there is no line index. Any block can be stored in any cache line.';
    } else if (mode === 'set-associative') {
      tabSetAssoc.classList.add('active');
      tabSetAssoc.setAttribute('aria-selected', 'true');
      ruleBadge.textContent = '2-Way Set-Associative Formula';
      ruleBadge.style.color = 'var(--set-color)';
      ruleBadge.style.background = 'var(--set-bg)';
      ruleSub.textContent = 'Grouped into Sets (2 Ways per Set)';
      ruleEquation.textContent = 'Set Index = (Block Number) mod (Number of Sets)';
      ruleMathPreview.innerHTML = 'Formula: <strong>Set = Block % 2</strong> &bull; Example: Block 6 &rarr; Set 0 (can pick Line 0 OR Line 1!)';
      miniExplanation.innerHTML = 'In <strong>2-Way Set-Associative Mapping</strong>, 4 lines are divided into 2 Sets. A block maps to a set, but has 2 slots to choose from.';
    }

    resetAll();
  }

  // Sequence playback helper
  async function runSequence(seqArray) {
    resetAll();
    for (let i = 0; i < seqArray.length; i++) {
      accessBlock(seqArray[i]);
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // --- QUIZ LOGIC ---
  function initQuiz() {
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;
    quizResultBox.classList.add('hidden');
    quizQuestionBox.classList.remove('hidden');
    renderQuiz();
  }

  function renderQuiz() {
    quizAnswered = false;
    const q = QUIZ_QUESTIONS[quizIndex];
    quizProgText.textContent = `Question ${quizIndex + 1} of ${QUIZ_QUESTIONS.length}`;
    quizScoreVal.textContent = quizScore;
    quizQuestionTitle.textContent = `${quizIndex + 1}. ${q.q}`;
    quizChoices.innerHTML = '';
    quizExplanation.classList.add('hidden');
    nextQuizBtn.classList.add('hidden');

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-btn';
      btn.innerHTML = `
        <span class="quiz-opt-letter">${letters[optIdx]}</span>
        <span>${optText}</span>
      `;
      btn.addEventListener('click', () => handleQuizSelect(optIdx));
      quizChoices.appendChild(btn);
    });
  }

  function handleQuizSelect(chosenIdx) {
    if (quizAnswered) return;
    quizAnswered = true;

    const q = QUIZ_QUESTIONS[quizIndex];
    const isCorrect = chosenIdx === q.correct;
    if (isCorrect) {
      quizScore++;
      quizScoreVal.textContent = quizScore;
    }

    const buttons = quizChoices.querySelectorAll('.quiz-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correct) {
        btn.classList.add('correct');
      } else if (idx === chosenIdx) {
        btn.classList.add('incorrect');
      }
    });

    quizExplanation.classList.remove('hidden');
    quizExplanationTitle.textContent = isCorrect ? '✓ Correct!' : '✗ Not quite';
    quizExplanationTitle.style.color = isCorrect ? 'var(--hit-color)' : '#dc2626';
    quizExplanationText.textContent = q.explanation;

    nextQuizBtn.classList.remove('hidden');
    if (quizIndex === QUIZ_QUESTIONS.length - 1) {
      nextQuizBtn.textContent = 'View Final Results 🏆';
    } else {
      nextQuizBtn.innerHTML = 'Next Question &rarr;';
    }
  }

  function nextQuiz() {
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      quizIndex++;
      renderQuiz();
    } else {
      showQuizResults();
    }
  }

  function showQuizResults() {
    quizQuestionBox.classList.add('hidden');
    quizResultBox.classList.remove('hidden');
    quizFinalScore.textContent = quizScore;

    const comment = document.getElementById('quizFinalComment');
    if (quizScore === 3) {
      comment.textContent = 'Perfect score! You understand Direct, Associative, and Set-Associative mapping thoroughly.';
    } else if (quizScore === 2) {
      comment.textContent = 'Great job! You have a solid grasp of cache mapping concepts.';
    } else {
      comment.textContent = 'Good effort! Review the concept cards above and try again.';
    }
  }

  // --- EVENT LISTENERS ---
  function bindEvents() {
    // Mode tabs
    tabDirect.addEventListener('click', () => setMode('direct'));
    tabAssociative.addEventListener('click', () => setMode('associative'));
    tabSetAssoc.addEventListener('click', () => setMode('set-associative'));

    // Access block
    accessBtn.addEventListener('click', () => {
      const val = parseInt(blockInput.value, 10);
      accessBlock(val);
    });

    blockInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = parseInt(blockInput.value, 10);
        accessBlock(val);
      }
    });

    // Clear Cache
    resetCacheBtn.addEventListener('click', resetAll);

    // Sequence Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const seq = btn.dataset.seq.split(',').map((n) => parseInt(n, 10));
        runSequence(seq);
      });
    });

    // Quiz events
    nextQuizBtn.addEventListener('click', nextQuiz);
    restartQuizBtn.addEventListener('click', initQuiz);
  }

  // Start app
  function init() {
    initCache();
    setMode('direct');
    initQuiz();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
