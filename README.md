# COA Interactive Learning Suite
### Computer Organization and Architecture Educational Tools

A simple, beginner-friendly, and interactive suite of web-based tools designed for computer science and engineering students.

---

## 🗄️ Tool 1: Cache Memory Mapping Visualizer (`index.html`)

An interactive visual tool with a **clean, light, simple background and simple design** to understand how blocks from Main Memory (RAM) map into Cache lines.

### Key Concepts Covered:
1. **Direct Mapping:**
   - **Rule:** Each memory block maps to exactly one fixed cache line.
   - **Formula:** `Cache Line = (Block Number) mod (Number of Cache Lines)` (e.g. `6 % 4 = Line 2`).
   - **Trade-off:** Fast and inexpensive hardware, but high risk of conflict thrashing.
2. **Fully Associative Mapping:**
   - **Rule:** Any memory block can be placed in *any* available cache line.
   - **Formula:** No fixed index. Uses Least Recently Used (LRU) replacement when full.
   - **Trade-off:** Zero conflict misses, but requires parallel search comparators.
3. **2-Way Set-Associative Mapping:**
   - **Rule:** Cache lines are grouped into sets (e.g. Set 0 and Set 1). A block maps to a specific set, but can pick *any way/line* in that set.
   - **Formula:** `Set Index = (Block Number) mod (Number of Sets)` (e.g. `6 % 2 = Set 0`).
   - **Trade-off:** The real-world standard used in modern CPUs (Intel, AMD, Apple M-series), balancing cost, speed, and low conflict misses.

### Interactive Features:
- **Side-by-Side Diagram:** Click on any of the 16 Main Memory blocks (0–15) to see the exact formula and watch the block animate into the target Cache line or set.
- **Hit / Miss Detection:** Green banner for **Cache Hit** and Amber/Blue banner for **Cache Miss / Eviction**, complete with live Hit Rate percentage.
- **Demo Sequences:** One-click presets showing conflict thrashing (`0, 4, 0, 4`), sequential accesses (`1, 2, 3, 4`), and capacity eviction.
- **Comparison Table:** Feature-by-feature breakdown of placement, search speed, hardware cost, and real-world usage.
- **3-Question Quick Quiz:** Test understanding with immediate feedback and scoring.

---

## ⚙️ Tool 2: CPU Instruction Cycle Simulator (`cpu-cycle.html`)

An interactive simulator explaining the fundamental CPU Machine Cycle: **Fetch, Decode, Execute, and Repeat**.

### Key Features:
- **Visual Flow Pipeline:** Step-by-step progress tracking with Next, Previous, Reset, and Auto-Play buttons.
- **Example Calculation:** Demonstrates `ADD 5, 3` resulting in `8` inside the Accumulator register.
- **Hardware Architecture:** Interactive schematics of the Control Unit (CU), Arithmetic Logic Unit (ALU), Registers (PC, MAR, MDR, IR, ACC), System Buses (Address, Data, Control), and RAM.
- **Component Inspector:** Detailed modal for each hardware component with real-world analogies.
- **Knowledge Quiz:** 5 multiple-choice questions with score tracking and ranking.

---

## 🚀 How to Run

No installations, build steps, or external APIs are required:

### Option 1: Direct File Open
Simply double-click [`index.html`](file:///Users/adityatayde111gmail/Library/CloudStorage/OneDrive-Personal/COA%20TOOL/index.html) in your browser.

### Option 2: Local Web Server
```bash
cd "/Users/adityatayde111gmail/Library/CloudStorage/OneDrive-Personal/COA TOOL"
python3 -m http.server 8000
```
Then visit:
- **Cache Memory Mapping:** `http://localhost:8000/index.html`
- **CPU Instruction Cycle:** `http://localhost:8000/cpu-cycle.html`

---

## 📁 File Structure

```
├── index.html        # Cache Memory Mapping Tool (Simple, clean, light design)
├── cache-style.css   # Clean, light-background stylesheet for Cache Mapping
├── cache.js          # Interactive Cache Mapping state machine & quiz logic
├── cpu-cycle.html    # CPU Instruction Cycle Simulator (Fetch, Decode, Execute)
├── styles.css        # Dark-mode styling for the CPU cycle simulator
├── app.js            # CPU cycle state machine and audio synthesizer
└── README.md         # Documentation for the complete COA tool suite
```
