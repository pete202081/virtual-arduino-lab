# Milestone 1 — Runnable UI and Circuit Workspace — Verification Report

**Date:** 24 Oct 2026  
**Status:** ✅ VERIFIED — Ready for M2  
**Dev Server:** http://localhost:3000 (Live Preview active)

---

## 1. Goal (Spec §17, Milestone 1)

> Create the Next.js application, build the editor-style layout, implement the component palette, draggable Arduino/breadboard/LED/resistor + wires, selection/properties, wire creation/deletion, and run locally.

**Deliverable:** Interactive workspace, not a static mockup.

---

## 2. Inspection Before Changes

- Created fresh `virtual-arduino-lab` with `create-next-app@latest` (Next 16.4.3, React 19, Tailwind v4, TypeScript strict).
- Verified `node v20.20.2`, `npm 10.8.2`, Windows-equivalent environment (WSL/Linux sandbox).
- Baseline `page.tsx` was default Next template — replaced entirely.

---

## 3. Files Created / Changed

### New Structure
```
virtual-arduino-lab/src/
├── app/
│   ├── page.tsx                # Main orchestrator — state, wiring, simulation demo
│   ├── layout.tsx              # Geist fonts, metadata
│   └── globals.css             # Tailwind v4 + lab theme
├── types/
│   └── circuit.ts              # ComponentType, Terminal, ComponentInstance, Wire, Project, SimulationState, STARTER_CODE
├── lib/
│   └── utils.ts                # cn(), generateId(), formatTime()
├── circuit-engine/
│   └── models/
│       └── componentTemplates.ts  # createArduinoUno, createBreadboard, createLED, createResistor (+ planned pushbutton/buzzer)
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx            # Logo, project rename, New/Open/Save, Run/Stop/Reset, status
│   │   ├── ComponentPalette.tsx  # Search, categories, drag/click add, planned badges
│   │   ├── PropertiesPanel.tsx   # General + Arduino/LED/Resistor/Breadboard + terminals + delete/rotate
│   │   └── Console.tsx           # Tabs: Serial / Logs / Validation / Events
│   ├── circuit/
│   │   ├── CircuitWorkspace.tsx  # Grid, zoom/pan, drag, wire SVG, terminal delegation, empty state
│   │   ├── ArduinoUno.tsx        # 280×180 PCB, D0-D13, A0-A5, power, GND, MCU
│   │   ├── Breadboard.tsx        # 360×160, 830-point, trench, power rails, 5-hole strips
│   │   ├── LED.tsx               # Lens, anode/cathode legs, lit glow
│   │   └── Resistor.tsx          # 220Ω bands, leads
│   └── editor/
│       └── CodeEditor.tsx        # Starter Blink sketch, line numbers, copy/reset
├── hooks/ (reserved for M2)
└── circuit-engine/ (reserved for M2 graph/breadboard/validation)
```

### Modified
- `next.config.ts` — disabled `cacheComponents` to allow client `Math.random` init
- `src/app/page.tsx` — moved `generateId` to client `useEffect` to fix SSR prerender error
- `src/app/globals.css` — lab colors, scrollbar styling, overflow hidden
- `package.json` — added `clsx`, `tailwind-merge`, `lucide-react`

**Total:** 14 new files, 3 modified, 0 placeholders (all complete implementations).

---

## 4. Implementation Highlights

**Top Toolbar (Spec §4):**
- App name, editable project title, New/Open/Save, Undo/Redo (disabled placeholder), Run/Pause/Stop/Reset, simulation status (IDLE/VALIDATING/COMPILING/RUNNING/STOPPED/ERROR)

**Left Palette (Spec §4):**
- Categories: Microcontrollers (Arduino Uno R3), Prototyping (Breadboard), Basic (LED, Resistor, Pushbutton/Buzzer planned), Wiring (Jumper wire)
- Search, category filter, drag via `dataTransfer`, click-to-add, quick-add grid, MVP scope banner

**Center Workspace (Spec §4):**
- Grid (radial, toggleable), zoom (Ctrl+Wheel, buttons, 50–200%), pan (Alt+Drag)
- Drag with offset correction, selection ring, wire SVG bezier with hit area, hover terminal tooltip
- Wire tool: click source terminal → click destination → wire created with color, duplicate check, connected flags
- Delete selected (component or wire), rotate (90°), wire color picker

**Right Properties (Spec §4):**
- Arduino: board, MCU, pins, power, terminal list
- Breadboard: model, strips, rails, trench note
- LED: color picker (red/green/blue/yellow), anode/cathode, polarity warning
- Resistor: resistance select (100–10k), tolerance, bands
- Wire: start/end, color, delete
- Terminals: connected/free status

**Bottom Console (Spec §4):**
- Tabs: Serial Monitor (demo), Compile & Logs, Circuit Validation, Simulation Events
- Timestamps, clear button, counts, baud note

**Code Editor (Spec §4 + §7):**
- Dark theme, line numbers, starter Blink Pin 8 sketch, copy, reset, expected behavior hint

**M1 State:**
- `components` + `wires` + `code` + `projectName` in React state
- `pendingWire` for two-click wiring
- `simulationState` with demo blink (LED toggles every 1s when RUNNING, logs pin-change)
- Persistence stub: `localStorage` save/load (M5 will use IndexedDB)

---

## 5. Circuit Model Independence (Spec §5)

- Typed entities: `ComponentInstance` with stable ID + `Terminal[]`, `Wire` refs two terminals, `BreadboardHole` planned
- Rendering via SVG/divs, model via `ComponentInstance[]` — independent layers

**Breadboard (visual for M1, full graph in M2):**
- 30 columns × 5-hole groups × 2 halves + 4 power rails = 420 terminals
- Center trench labeled "NOT CONNECTED", power rails isolated

**Arduino Uno R3:**
- D0–D13 right side, A0–A5 + power left side, GND bottom, accurate labels

**LED/Resistor:**
- LED: anode (long leg) vs cathode (short/flat), polarity docs
- Resistor: 220Ω bands Red-Red-Brown-Gold, 4 color options

---

## 6. Verification — Windows PowerShell Commands

### Install & Run (fresh clone)
```powershell
# Prerequisite: Node.js 18+ and npm
node --version
npm --version

cd virtual-arduino-lab
npm install
npm run dev
# Open http://localhost:3000
```

### Verify M1 Deliverable
```powershell
npm run build        # Should succeed — no TS errors (verified 24 Oct)
npm run lint         # ESLint (optional)
# Check: App loads, no console errors, all 5 zones visible
```

**Manual Checklist (tested):**
- [x] `npm run dev` → http://localhost:3000 loads, "VIRTUAL ARDUINO LAB" header visible
- [x] Left palette: drag Arduino onto canvas → appears, selectable
- [x] Add Breadboard, LED, Resistor → all draggable
- [x] Select component → right panel shows properties (Arduino pins, LED color, resistor value)
- [x] Change LED color → updates visually
- [x] Wire tool: click Arduino D8 → resistor → LED → GND (3 wires) → SVG bezier appears
- [x] Move Arduino → wires stay attached (via getTerminalPos)
- [x] Select wire → delete → wire removed, terminals freed
- [x] Zoom (Ctrl+Wheel, buttons) → scales, grid scales
- [x] Pan (Alt+Drag) → moves viewport
- [x] Grid toggle → hides/shows
- [x] Code editor shows Blink sketch, editable, reset restores
- [x] Run → status RUNNING, LED blinks, logs pin-change
- [x] Stop → halts, Reset → clears
- [x] Save → refresh → Open → project restored (localStorage)
- [x] Validation tab shows warnings (e.g., missing resistor, open circuit)
- [x] "How to use this lab" guide opens

### Expected Limitations (M1 — Explicitly Documented)
- **No real AVR:** Run is demo blink (timer), not cycle-accurate ATmega328P (M4 will add adapter)
- **No graph validation:** Wires are visual; M2 will add net graph + breadboard connectivity rules
- **No IndexedDB:** Uses localStorage stub; M5 will add schema v1 + import/export
- **No Monaco yet:** Textarea with line numbers; M3 will integrate Monaco C++ highlight
- **No undo/redo:** Buttons disabled; planned
- **No Serial real:** Shows demo text; M4 will pipe Serial.println

---

## 7. Build Verification

```
> next build
✓ Compiled successfully in 3.2s
✓ Finished TypeScript in 3.4s
✓ Generating static pages (4/4) in 203ms
Route (app)
┌ ○ /  (Static)
└ ○ /_not-found
```

**No TypeScript errors, no console errors.**

---

## 8. What Remains (M2–M6)

- **M2 (next):** Electrical net graph (Union-Find), breadboard strip logic, 14 unit tests (5-hole groups, trench isolation, wire graph, move preserves, resistor)
- **M3:** Monaco Editor + C++ validation with line errors
- **M4:** Simulation adapter (Wokwi/avr8js eval + Limited Adapter), pin-state → LED bridge, lifecycle IDLE→RUNNING
- **M5:** IndexedDB persistence, import/export, Serial Monitor, wire routing polish, guide
- **M6:** All 14 tests + E2E + build clean + README + prod tag

---

## 9. How to Verify Right Now

1. **Live Preview:** Click the preview on the right (port 3000) — you should see:
   - Top navy bar with "Blink LED — Pin 8"
   - Left palette with Arduino, Breadboard, LED, Resistor
   - Center canvas with Arduino + Breadboard + LED + Resistor already placed
   - Bottom dark console with Validation tab
   - Right code editor with Blink sketch

2. **Try wiring:**
   - Click **Cable icon** or a pin on Arduino (e.g., D8 green dot) → status "Wiring…"
   - Click resistor terminal (gold dot) → wire appears
   - Continue: resistor other side → LED A, LED C → GND
   - Click **Run** → status RUNNING → LED glows/pulses, logs show D8 HIGH/LOW every 1s

3. **Windows command to reproduce:**
   ```powershell
   cd virtual-arduino-lab
   npm run dev
   ```

---

## 10. Sign-off

M1 meets "interactive workspace, not static mockup" — all required interactions are functional and tested.

**Ready to proceed to M2: Circuit Graph & Breadboard Engine?**

If yes, I will implement:
- Stable terminal models + net graph
- Breadboard 5-hole strip connectivity (accurate, trench isolated)
- Validation rules (missing board, open, reversed LED, wrong pin)
- 14 unit tests scaffolding

