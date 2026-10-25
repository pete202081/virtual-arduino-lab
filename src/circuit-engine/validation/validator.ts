/**
 * Circuit Validation — meaningful beginner-friendly checks
 * Inspects graph + code (code checks stubbed for M2, full in M3)
 */

import { ComponentInstance, Wire } from "@/types/circuit";
import { buildCircuitGraph, areTerminalsConnected } from "../graph/netGraph";

export type ValidationSeverity = "error" | "warning" | "info";
export interface ValidationMessage {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  help?: string;
}

function findArduino(components: ComponentInstance[]) {
  return components.find((c) => c.type === "arduino-uno");
}
function findLED(components: ComponentInstance[]) {
  return components.find((c) => c.type === "led");
}
function findResistor(components: ComponentInstance[]) {
  return components.find((c) => c.type === "resistor");
}
function findBreadboard(components: ComponentInstance[]) {
  return components.find((c) => c.type === "breadboard");
}

export function validateCircuit(components: ComponentInstance[], wires: Wire[], code: string): ValidationMessage[] {
  const msgs: ValidationMessage[] = [];
  const graph = buildCircuitGraph(components, wires);

  const arduino = findArduino(components);
  const led = findLED(components);
  const resistor = findResistor(components);
  const breadboard = findBreadboard(components);

  // Rule: Missing Arduino
  if (!arduino) {
    msgs.push({
      id: "missing-arduino",
      severity: "error",
      code: "MISSING_BOARD",
      message: "Missing Arduino board — add Arduino Uno R3 from Microcontrollers to run simulation.",
      help: "Every circuit needs a board. Drag Arduino Uno R3 onto the workspace.",
    });
    // Early return: other checks need Arduino
    return msgs;
  }

  // Rule: Invalid wire endpoint (dangling — terminal no longer exists)
  for (const w of wires) {
    const startExists = components.some((c) => c.terminals.some((t) => t.id === w.startTerminalId));
    const endExists = components.some((c) => c.terminals.some((t) => t.id === w.endTerminalId));
    if (!startExists || !endExists) {
      msgs.push({
        id: `invalid-wire-${w.id}`,
        severity: "error",
        code: "INVALID_WIRE",
        message: `Invalid wire endpoint — one side is not a real terminal (wire ${w.id.slice(0, 8)}). Delete and rewire.`,
      });
    }
  }

  // No components case
  if (components.length === 0) {
    msgs.push({
      id: "no-components",
      severity: "info",
      code: "NO_COMPONENTS",
      message: "Workspace is empty — add components from the left palette to start.",
    });
    return msgs;
  }

  // LED-specific checks (hero experiment)
  if (led) {
    const anodeId = led.terminals.find((t) => t.label === "ANODE")?.id;
    const cathodeId = led.terminals.find((t) => t.label === "CATHODE")?.id;

    if (!anodeId || !cathodeId) {
      msgs.push({
        id: "led-terminals",
        severity: "error",
        code: "LED_TERMINALS",
        message: "LED has no anode/cathode terminals — component may be corrupted. Delete and re-add.",
      });
    } else {
      const anodeNet = graph.getNetForTerminal(anodeId);
      const cathodeNet = graph.getNetForTerminal(cathodeId);

      // LED disconnected (no wire at all)
      const ledWires = wires.filter((w) => w.startTerminalId === anodeId || w.endTerminalId === anodeId || w.startTerminalId === cathodeId || w.endTerminalId === cathodeId);
      if (ledWires.length === 0) {
        msgs.push({
          id: "led-disconnected",
          severity: "error",
          code: "OPEN_CIRCUIT",
          message: "LED is not connected — anode and cathode have no wires. Wire D8 → Resistor → LED → GND.",
          help: "Hero circuit: D8 → 220Ω resistor → LED anode → LED cathode → GND. Use breadboard strips for neat wiring.",
        });
      } else {
        // Check anode path to D8 via resistor
        const d8Id = `${arduino.id}-D8`;
        const gndIds = [`${arduino.id}-GND-1`, `${arduino.id}-GND-2`];

        // Anode should have path to D8 (via resistor ideally)
        const anodeToD8 = areTerminalsConnected(graph, anodeId, d8Id);
        // Check if resistor is in path — resistor's two terminals are internally united, so check if resistor net overlaps D8 and anode
        let resistorInPath = false;
        if (resistor) {
          const rA = resistor.terminals[0]?.id;
          const rB = resistor.terminals[1]?.id;
          if (rA && rB) {
            // With resistor union, rA and rB are same net; check if that net is same as D8 and anode (i.e., resistor bridges)
            resistorInPath = areTerminalsConnected(graph, rA, d8Id) && areTerminalsConnected(graph, rA, anodeId);
          }
        } else {
          // No resistor component at all — will warn
          resistorInPath = false;
        }

        if (!anodeToD8) {
          msgs.push({
            id: "led-anode-d8",
            severity: "error",
            code: "ANODE_NOT_TO_D8",
            message: "LED anode is not connected to Arduino D8. Wire D8 → resistor → LED anode.",
            help: "Check your breadboard: D8 wire should land on same 5-hole strip as resistor lead, other resistor lead on same strip as LED anode.",
          });
        } else if (!resistorInPath) {
          msgs.push({
            id: "missing-resistor",
            severity: "warning",
            code: "MISSING_RESISTOR",
            message: "LED anode is wired to D8 but no resistor found in path — add 220Ω resistor between D8 and LED anode to limit current.",
            help: "Without resistor, LED may burn. Place resistor so one leg shares net with D8, other with LED anode.",
          });
        }

        // Cathode should have path to GND
        const cathodeToGND = gndIds.some((gid) => areTerminalsConnected(graph, cathodeId, gid));
        if (!cathodeToGND) {
          msgs.push({
            id: "led-cathode-gnd",
            severity: "error",
            code: "CATHODE_NOT_TO_GND",
            message: "LED cathode has no path to Arduino GND. Wire LED cathode (short leg) → GND.",
            help: "GND is at bottom of Arduino. Use a wire (or breadboard rail) to connect cathode to GND.",
          });
        }

        // Reversed polarity check (if LED is wired backwards)
        // If cathode is connected to D8 and anode to GND, that's reversed
        const cathodeToD8 = areTerminalsConnected(graph, cathodeId, d8Id);
        const anodeToGND = gndIds.some((gid) => areTerminalsConnected(graph, anodeId, gid));
        if (cathodeToD8 && anodeToGND) {
          msgs.push({
            id: "led-reversed",
            severity: "error",
            code: "REVERSED_POLARITY",
            message: "LED appears reversed — cathode is toward D8 and anode toward GND. Swap: long leg (anode) toward resistor/D8, short toward GND.",
          });
        }

        // Short circuit: anode and cathode same net (no resistor)
        if (anodeNet && cathodeNet && anodeNet.id === cathodeNet.id) {
          msgs.push({
            id: "led-short",
            severity: "error",
            code: "SHORT_CIRCUIT",
            message: "Short detected — LED anode and cathode are on same electrical net (no valid circuit). Check for stray wire or breadboard short.",
          });
        }
      }
    }

    // Open circuit info
    if (wires.length > 0 && wires.length < 3) {
      msgs.push({
        id: "open-circuit",
        severity: "warning",
        code: "OPEN_CIRCUIT",
        message: `Only ${wires.length} wire(s) — hero circuit needs 3: D8→Resistor, Resistor→LED, LED→GND. Add the missing connections.`,
      });
    }

    // Wrong pin check
    // If LED is wired to a pin other than D8 (e.g., D13) but code uses D8, warn
    const usedPinInCode = extractLedPinFromCode(code); // e.g., 8
    if (usedPinInCode !== null) {
      const expectedPinId = `${arduino.id}-D${usedPinInCode}`;
      // Check if any LED terminal is connected to a different digital pin than expected
      if (led) {
        const anodeId = led.terminals.find((t) => t.label === "ANODE")?.id;
        if (anodeId) {
          for (let p = 0; p <= 13; p++) {
            if (p === usedPinInCode) continue;
            const otherPinId = `${arduino.id}-D${p}`;
            // If anode is connected to other pin and NOT to expected, flag
            if (areTerminalsConnected(graph, anodeId, otherPinId) && !areTerminalsConnected(graph, anodeId, expectedPinId)) {
              msgs.push({
                id: "wrong-pin",
                severity: "warning",
                code: "WRONG_PIN",
                message: `LED is wired to D${p} but your code uses D${usedPinInCode} (const ledPin = ${usedPinInCode}). Wire to D${usedPinInCode} or update code.`,
              });
              break;
            }
          }
        }
      }
    }
  }

  // Breadboard trench isolation info (always valid if breadboard exists)
  if (breadboard) {
    // We already model trench as isolated, so no error, but we can confirm
    // Not a validation error, just info if user expects cross-trench connection
  }

  // If no errors/warnings and circuit looks valid
  if (msgs.length === 0) {
    if (led && resistor && wires.length >= 3) {
      msgs.push({
        id: "valid-circuit",
        severity: "info",
        code: "VALID",
        message: "Circuit looks valid — D8 → Resistor → LED → GND path exists. Click Run to simulate.",
      });
    }
  }

  return msgs;
}

function extractLedPinFromCode(code: string): number | null {
  // Look for const int ledPin = 8  or  #define LED_PIN 8  or ledPin = 8
  const m = code.match(/ledPin\s*=\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  const m2 = code.match(/const\s+int\s+\w+\s*=\s*(\d+)/);
  if (m2) return parseInt(m2[1], 10);
  return 8; // default to 8 for hero
}
