import assert from "node:assert/strict";
import { CircuitHistory } from "../src/lib/circuitHistory";
import { createStarterCircuit } from "../src/circuit-engine/models/starterCircuit";

const initial = createStarterCircuit();
const history = new CircuitHistory(2);
const first = { components: initial.components, wires: initial.wires };
const moved = {
  components: initial.components.map((component, index) => index === 0 ? { ...component, x: component.x + 40 } : component),
  wires: initial.wires.map((wire, index) => index === 0 ? { ...wire, routePoint: { x: 420, y: 275 } } : wire),
};
const recolored = {
  components: moved.components,
  wires: moved.wires.map((wire, index) => index === 0 ? { ...wire, color: "#2563EB" } : wire),
};

assert.equal(history.canUndo, false);
assert.equal(history.canRedo, false);
history.push(first);
assert.equal(history.canUndo, true);
assert.deepEqual(history.undo(moved), first, "undo restores the prior circuit snapshot");
assert.equal(history.canRedo, true);
assert.deepEqual(history.redo(first), moved, "redo restores positions and manual wire route data");
assert.equal(history.canRedo, false);

history.undo(moved);
history.push(recolored);
assert.equal(history.canRedo, false, "a new edit after undo discards the redo branch");
history.push(moved);
history.push(first);
assert.deepEqual(history.undo(recolored), first, "history is bounded and retains the newest snapshot");
assert.deepEqual(history.undo(moved), moved, "the second newest snapshot remains available");
history.clear();
assert.equal(history.canUndo, false);
assert.equal(history.canRedo, false);
console.log("✅ bounded circuit history supports undo, redo, route-point snapshots, branch invalidation, and clearing");
