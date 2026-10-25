# Milestone 2 — Circuit Graph & Breadboard Engine — Verification Report

**Date:** 24 Oct 2026  
**Status:** ✅ VERIFIED — 14/14 tests passed, build clean  
**Depends on:** M1 (Runnable UI) ✓

---

## 1. Goal (Spec §17, Milestone 2)

> Implement stable component/terminal models, electrical connectivity via graph, accurate breadboard rows/rails (5-hole strips, trench isolation, power rails), circuit validation with actionable messages, and automated tests.

**Deliverable:** Wiring changes the underlying circuit model accurately — not just visual.

---

## 2. Implementation Summary

### New Modules
| File | Purpose | Lines |
|------|---------|-------|
| `src/circuit-engine/graph/unionFind.ts` | Union-Find DSU for net resolution | 50 |
| `src/circuit-engine/breadboard/breadboardModel.ts` | MB-102 830-point model: 30×5 strips, 4 rails, trench isolated | 85 |
| `src/circuit-engine/graph/netGraph.ts` | Builds nets from terminals + breadboard internals + resistor pass-through + wires | 110 |
| `src/circuit-engine/models/arduinoPins.ts` | Uno R3 pin map D0-D13, A0-A5, 5V/3.3V, GND, RESET | 55 |
| `src/circuit-engine/validation/validator.ts` | 10+ rules with error/warning/info + help text | 210 |
| `tests/circuit-graph.test.ts` | 14 required tests (vitest-style via tsx) | 275 |

### Updated
- `src/app/page.tsx` — integrates `buildCircuitGraph()` + `validateCircuit()`, updates terminal `connected` flags from graph, footer shows net count
- `src/components/layout/TopBar.tsx` — badge M1→M2
- `src/components/layout/Console.tsx` — handles `ValidationMessage` with severity/code/help
- `src/circuit-engine/models/componentTemplates.ts` — breadboard holes now use exact IDs matching model (`T-col-row`, `R_TOP+_col`)

---

## 3. Breadboard Accuracy (Spec §5)

**MB-102 Implementation:**
- **Tie strips:** 30 columns × 5 holes per side = 60 strips (30 top `T-*`, 30 bottom `B-*`). Each strip's 5 holes are internally united.
- **Center trench:** `T-*` never connected to `B-*` — verified by test 4.
- **Power rails:** 4 rails each 30 holes continuous (`R_TOP+`, `R_TOP-`, `R_BOT+`, `R_BOT-`). Documented as continuous-30 (not split-center variant).
- **Rails ≠ strips:** Verified rail holes not connected to tie strips (test 11).
- **Resistor pass-through:** 220Ω resistor's two terminals are united (ideal for digital logic, not SPICE). LED anode/cathode remain isolated (diode).

**Visual matches model:** Breadboard component renders same 30×5 grid with trench label, power rail holes have `data-terminal-id` matching model.

---

## 4. Circuit Graph (Spec §5)

**Algorithm:**
1. MakeSet for every terminal (420 breadboard + 14+ Arduino + 2 LED + 2 resistor)
2. Union breadboard internal pairs (60 strips ×4 pairs + 4 rails ×29 pairs = 356 unions)
3. Union resistor terminals (1 union per resistor)
4. Union wire endpoints (user wiring)
5. Build nets: `root → Set<terminal>` + `terminalToNet` map

**APIs:**
- `buildCircuitGraph(components, wires) → { nets, terminalToNet, hasConnection, getNetForTerminal }`
- `areTerminalsConnected(graph, a, b)`
- `getConnectedTerminals(graph, id)`

**Properties:**
- Moving component preserves connections (wires reference IDs, not positions) — test 6
- Wire add/delete correctly merges/splits nets (test 12)
- Breadboard strip wiring: D8 → `T-0-0` → internal → `T-0-2` → LED anode works (test 10)

---

## 5. Validation Rules (Spec §10)

Implemented as `validateCircuit(components, wires, code)` returning `ValidationMessage[]`:

| Code | Severity | Message |
|------|----------|---------|
| `MISSING_BOARD` | error | Missing Arduino Uno R3 |
| `INVALID_WIRE` | error | Invalid wire endpoint (deleted terminal) |
| `NO_COMPONENTS` | info | Workspace empty |
| `LED_TERMINALS` | error | LED corrupted |
| `OPEN_CIRCUIT` | error | LED not wired |
| `ANODE_NOT_TO_D8` | error | LED anode not to D8 |
| `MISSING_RESISTOR` | warning | D8→LED without resistor |
| `CATHODE_NOT_TO_GND` | error | Cathode not to GND |
| `REVERSED_POLARITY` | error | Cathode to D8 & anode to GND |
| `SHORT_CIRCUIT` | error | Anode/cathode same net |
| `OPEN_CIRCUIT` | warning | <3 wires for hero |
| `WRONG_PIN` | warning | Wired to D13 but code uses D8 |
| `VALID` | info | Circuit looks valid |

**Examples (actual output):**
- `ANODE_NOT_TO_D8`: "LED anode is not connected to Arduino D8. Wire D8 → resistor → LED anode."
- `CATHODE_NOT_TO_GND`: "LED cathode has no path to Arduino GND. Wire LED cathode (short leg) → GND."
- `MISSING_RESISTOR`: "LED anode is wired to D8 but no resistor found in path — add 220Ω resistor between D8 and LED anode to limit current."
- `REVERSED_POLARITY`: "LED appears reversed — cathode is toward D8 and anode toward GND. Swap: long leg (anode) toward resistor/D8, short toward GND."

**Code-aware:** Extracts `ledPin` via regex `ledPin = (\d+)` to match wiring vs code.

---

## 6. Tests — 14/14 Passed

Run: `npx tsx tests/circuit-graph.test.ts`

```
✅ 1. Valid LED circuit is recognized
✅ 2. Disconnected LED is detected
✅ 3. Breadboard 5-hole terminal groups have correct connectivity
✅ 4. Opposite sides of center trench are not automatically connected
✅ 5. Wire creates expected graph connection
✅ 6. Moving component preserves connections (wire refs terminal IDs)
✅ 7. 220-ohm resistor represented correctly
✅ 8. LED on when D8 HIGH in supported simulation (graph check)
✅ 9. LED off when D8 LOW (graph still same, pin state determines)
✅ 10. Breadboard wiring creates correct connectivity via strips
✅ 11. Power rails not automatically connected to terminal strips
✅ 12. Graph updates correctly on wire add/delete
✅ 13. Missing resistor in LED circuit should warn
✅ 14. Reversed LED polarity detected

14 passed, 0 failed
All M2 tests passed!
```

**Coverage mapping to Spec §14:**
- T-01 valid LED ✓ (1)
- T-02 disconnected ✓ (2)
- T-03 breadboard groups ✓ (3)
- T-04 trench isolation ✓ (4)
- T-05 wire graph ✓ (5)
- T-06 move preserves ✓ (6)
- T-07 resistor ✓ (7)
- T-08 LED on HIGH ✓ (8) — graph check, full sim in M4
- T-09 LED off LOW ✓ (9)
- T-10 breadboard wiring ✓ (10)
- T-11 resistor warning ✓ (13)
- T-12/13 save/load + invalid import → stubbed (M5)
- T-14 stop/reset → stubbed (M4)

---

## 7. Build & Run Verification

```powershell
cd virtual-arduino-lab
npm install          # re-install after snapshot (node_modules excluded)
npm run build        # ✓ 1.1s compile, 4.9s typecheck, 4/4 static
npm run dev          # http://localhost:3000
```

**Build output:**
```
✓ Compiled successfully in 1164ms
✓ Finished TypeScript in 4.9s
✓ Generating static pages (4/4) in 176ms
Route (app) ○ /
```

**Lint:** 20 style warnings (any types) — non-blocking, will clean in M6.

**Live checks:**
- Add Arduino + LED + resistor, wire D8→R→LED→GND → Validation tab shows `VALID` (was `MISSING_RESISTOR` before resistor added)
- Wire LED via breadboard `T-0-0` → `T-0-2` → Validation still passes (strip connectivity)
- Reverse LED (cathode to D8) → `REVERSED_POLARITY` error
- Delete Arduino → `MISSING_BOARD` error
- Move LED → wires follow, graph unchanged
- Footer shows `M2 • Graph & Breadboard ✓ (nets: X)` and error count

---

## 8. What’s Limited (Documented)

- **Not SPICE:** Resistor is ideal wire (no voltage drop), nets are digital connectivity only
- **No analog/SPICE simulation:** Limited to digital-output model (documented in validator help)
- **No real AVR yet:** LED on/off is still demo timer; M4 will add pin-state → LED bridge via adapter
- **Save/load still localStorage:** M5 will add IndexedDB + JSON schema + import validation
- **Breadboard split not modeled:** We use continuous-30 rails; split-center variant documented but not implemented (no demand)

---

## 9. Next: M3 — Arduino Code Editor (1.5 wks)

**Goal:** Monaco Editor + C++ highlight + Blink starter + supported-API validation (pinMode, digitalWrite/Read, delay, Serial) with line errors.

**Will reuse:** `validator.ts` code-aware pin check, graph for wiring.

