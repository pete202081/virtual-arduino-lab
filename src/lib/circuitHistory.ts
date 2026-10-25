import type { ComponentInstance, Wire } from "@/types/circuit";

export interface CircuitHistorySnapshot {
  components: ComponentInstance[];
  wires: Wire[];
}

function cloneSnapshot(snapshot: CircuitHistorySnapshot): CircuitHistorySnapshot {
  return {
    components: structuredClone(snapshot.components),
    wires: structuredClone(snapshot.wires),
  };
}

/** Bounded undo/redo history for circuit structure and editable component/wire properties. */
export class CircuitHistory {
  private past: CircuitHistorySnapshot[] = [];
  private future: CircuitHistorySnapshot[] = [];

  constructor(private readonly limit = 100) {}

  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }

  push(snapshot: CircuitHistorySnapshot) {
    this.past.push(cloneSnapshot(snapshot));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: CircuitHistorySnapshot): CircuitHistorySnapshot | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(cloneSnapshot(current));
    return cloneSnapshot(previous);
  }

  redo(current: CircuitHistorySnapshot): CircuitHistorySnapshot | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(cloneSnapshot(current));
    if (this.past.length > this.limit) this.past.shift();
    return cloneSnapshot(next);
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}
