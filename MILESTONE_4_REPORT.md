# Milestone 4 — Simulation Adapter — Verification Report

**Status:** ✅ VERIFIED — safe instruction adapter integrated, 6/6 M4 tests passed, M2/M3 regressions pass, production build clean.  
**Date:** 24 Oct 2026  
**Depends on:** M1 interactive workspace ✓ · M2 circuit graph ✓ · M3 editor/validation ✓

## Goal
Replace the M1 demo blink timer with a bounded, non-`eval` simulation adapter that executes supported sketch statements, drives virtual Arduino output pins, uses actual circuit connectivity to determine LED illumination, returns Serial output, and cancels reliably on Stop/Reset.

## Delivered
- `src/simulation/interfaces/simulationAdapter.ts`
  - Parses a deliberately small subset of sketch code into typed instructions; no dynamic code execution or native AVR binary.
  - Runs setup once, repeats loop, schedules delays on browser timers, and exposes Stop cancellation.
  - Tracks pin modes/levels, emits digital pin transitions, supports `Serial.begin`, `Serial.print`, and `Serial.println`.
  - Converts `delayMicroseconds()` to a millisecond browser timer value (coarse, not microsecond-accurate).
  - Determines lit LED IDs from the graph: must have a forward-biased path from an Arduino output pin; normal path is OUTPUT/HIGH → anode → cathode → GND. Reverse polarity or disconnected wiring stays dark. Supports the inverse 5V-to-output-LOW orientation too.
- `src/app/page.tsx`
  - Replaced the fixed 1-second demo interval with M4 interpreter lifecycle and actual sketch instructions.
  - Run checks M3 diagnostics and M4 adapter subset. Unsupported constructs show line diagnostics and prevent starting.
  - Simulation logs pin changes and electrical path status; LED rendering follows computed LED IDs.
  - Stop cancels active timer and clears LED state; Reset clears runtime, LED state, and restores serial baud; New/Open stop an active runtime.
- `src/components/circuit/CircuitWorkspace.tsx` — receives per-LED lit IDs instead of one global blinking flag.
- `src/components/layout/Console.tsx` — Serial Monitor now renders `Serial.print/println` output at current baud; Simulation Logs reflect M4 runtime events.
- `src/components/layout/TopBar.tsx` — M4 status badge and Run disabled during validation/compile/run.
- `tests/simulation-adapter.test.ts` — deterministic adapter/runtime/graph tests using a fake clock.
- Added an npm override to `dompurify@3.4.17` for Monaco's pinned transitive dependency; full `npm audit` now reports zero vulnerabilities.

## Supported executable subset
- `pinMode(pin, OUTPUT | INPUT | INPUT_PULLUP)`
- `digitalWrite(pin, HIGH | LOW)`
- `delay(ms)` and `delayMicroseconds(us)` (browser timer precision applies)
- `Serial.begin(baud)`, `Serial.print("text")`, `Serial.println("text")`, and numeric literal/constant output
- Integer global constants such as `const int ledPin = 8;`

**Safety bounds:** D0–D13 only; delay limited to 60 seconds per call; loop must contain a positive delay to yield; maximum 500 supported statements. Unsupported control flow such as `if`, `for`, and `while`, unsupported APIs, variables/expressions outside this subset, and unsupported statements are rejected with a source-line message. This is a small interpreter for the hero experiment, not a general C++/AVR compiler.

## Verification
Run from `virtual-arduino-lab/`:

```sh
npx tsx tests/simulation-adapter.test.ts  # 6 passed
npx tsx tests/sketch-validator.test.ts    # 7 passed
npx tsx tests/circuit-graph.test.ts       # 14 passed
npm run build                            # success
```

M4 tests cover: Blink-to-instruction compilation; rejecting unsafe control flow; rejecting non-yielding loops; string/comment/brace edge cases; deterministic setup/loop pin and serial execution with 1000 ms delay and stop cancellation; connected LED lights only with correct polarity and output state (including a resistor path), and stays off when disconnected, LOW, or reversed.

**Build:** Next.js optimized compilation succeeded, TypeScript passed, all four static pages generated. **Live smoke check:** preview returned HTTP 200 and server HTML included M4 status, Simulation Logs, and Serial Monitor labels. Interactive browser behavior is available in the live preview for user confirmation.

## Accuracy and remaining boundaries
- Browser `setTimeout` is not real-time; delays are approximate and can be throttled when the tab is backgrounded.
- No AVR binary compilation, instruction-level CPU model, analog/SPICE/current/voltage simulation, interrupts, PWM, actual pin input/button behavior, or `digitalRead` execution yet.
- Resistors remain ideal conductive pass-throughs in the M2 connectivity graph; values are not used to calculate current/voltage.
- Disconnected/miswired LEDs do not light, but Serial output and sketch logic can still run. Circuit validation warnings are logged at Run.

## Next milestone
**M5 — Persistence/import-export and reliability** per the phase plan, unless the implementation plan places another milestone next. Preserve the M4 tests as regression gates.
