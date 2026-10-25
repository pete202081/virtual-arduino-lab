/**
 * Net Graph — builds electrical connectivity from components + wires + breadboard
 * Uses UnionFind to group terminals into nets
 */

import { ComponentInstance, Wire } from "@/types/circuit";
import { UnionFind } from "./unionFind";
import { getBreadboardInternalNets } from "../breadboard/breadboardModel";

export interface Net {
  id: string; // root terminal id
  terminals: string[]; // all terminal ids in net
  components: string[]; // component ids involved
}

export interface CircuitGraph {
  uf: UnionFind;
  nets: Net[];
  terminalToNet: Map<string, string>; // terminalId -> net root
  hasConnection: (a: string, b: string) => boolean;
  getNetForTerminal: (id: string) => Net | undefined;
}

export function buildCircuitGraph(components: ComponentInstance[], wires: Wire[], pressedButtonIds: ReadonlySet<string> = new Set(), closedSwitchIds: ReadonlySet<string> = new Set()): CircuitGraph {
  const uf = new UnionFind();

  // 1. Register all terminals
  for (const comp of components) {
    for (const t of comp.terminals) {
      uf.makeSet(t.id);
    }
  }

  // 2. Add breadboard internal nets (strips + rails)
  for (const comp of components) {
    if (comp.type === "breadboard") {
      const internalPairs = getBreadboardInternalNets(comp.id);
      for (const [a, b] of internalPairs) {
        // Only union if both terminals exist (they should)
        uf.union(a, b);
      }
    }
  }

  // 2b. Add resistor internal connectivity (resistor is conductive — its two terminals are same net for DC path)
  // For M2 we treat resistor as ideal wire with resistance property, not open. Documented as "limited digital-output model, not SPICE"
  for (const comp of components) {
    if (comp.type === "resistor" && comp.terminals.length === 2) {
      uf.union(comp.terminals[0].id, comp.terminals[1].id);
    }
  }

  // 2c. A tactile button permanently joins each side's two legs; pressing bridges the sides.
  for (const comp of components) {
    if (comp.type !== "pushbutton") continue;
    const leftTop = comp.terminals.find((terminal) => terminal.label === "1A")?.id;
    const leftBottom = comp.terminals.find((terminal) => terminal.label === "1B")?.id;
    const rightTop = comp.terminals.find((terminal) => terminal.label === "2A")?.id;
    const rightBottom = comp.terminals.find((terminal) => terminal.label === "2B")?.id;
    if (leftTop && leftBottom) uf.union(leftTop, leftBottom);
    if (rightTop && rightBottom) uf.union(rightTop, rightBottom);
    if (pressedButtonIds.has(comp.id) && leftTop && rightTop) uf.union(leftTop, rightTop);
  }

  // 2d. A joystick's momentary SW contact connects to module GND while pressed.
  for (const comp of components) {
    if (comp.type !== "joystick" || !pressedButtonIds.has(comp.id)) continue;
    const switchOutput = comp.terminals.find((terminal) => terminal.label === "SW")?.id;
    const ground = comp.terminals.find((terminal) => terminal.label === "GND")?.id;
    if (switchOutput && ground) uf.union(switchOutput, ground);
  }

  // 2e. A latched SPST slide switch bridges its two contacts while ON.
  for (const comp of components) {
    if (comp.type !== "slide-switch") continue;
    const contactA = comp.terminals.find((terminal) => terminal.label === "A")?.id;
    const contactB = comp.terminals.find((terminal) => terminal.label === "B")?.id;
    if ((closedSwitchIds.has(comp.id) || comp.properties.isOn === true) && contactA && contactB) uf.union(contactA, contactB);
  }

  // 3. Apply wires (connect their endpoints)
  for (const w of wires) {
    // Validate both endpoints exist in graph (i.e., terminals exist)
    // If invalid endpoint (e.g., deleted component), skip — will be flagged in validation
    uf.union(w.startTerminalId, w.endTerminalId);
  }

  // 4. Build nets list
  const sets = uf.getSets();
  const nets: Net[] = [];
  const terminalToNet = new Map<string, string>();

  for (const [root, members] of sets.entries()) {
    const terminals = Array.from(members);
    const comps = new Set<string>();
    for (const tid of terminals) {
      // Find component for this terminal
      for (const comp of components) {
        if (comp.terminals.some((t) => t.id === tid)) {
          comps.add(comp.id);
          break;
        }
      }
    }
    nets.push({ id: root, terminals, components: Array.from(comps) });
    for (const tid of terminals) terminalToNet.set(tid, root);
  }

  return {
    uf,
    nets,
    terminalToNet,
    hasConnection: (a, b) => uf.connected(a, b),
    getNetForTerminal: (id) => {
      const root = terminalToNet.get(id);
      if (!root) return undefined;
      return nets.find((n) => n.id === root);
    },
  };
}

/**
 * Helper to find path between two terminals via nets (are they same net?)
 */
export function areTerminalsConnected(graph: CircuitGraph, a: string, b: string): boolean {
  return graph.hasConnection(a, b);
}

/**
 * Get all terminals in same net as given terminal
 */
export function getConnectedTerminals(graph: CircuitGraph, terminalId: string): string[] {
  const net = graph.getNetForTerminal(terminalId);
  return net ? net.terminals : [];
}

/**
 * Check if a component terminal is connected to Arduino pin
 */
export function isComponentConnectedToPin(
  graph: CircuitGraph,
  componentTerminalId: string,
  pinTerminalId: string
): boolean {
  return areTerminalsConnected(graph, componentTerminalId, pinTerminalId);
}
