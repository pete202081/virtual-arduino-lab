import { ComponentInstance, Wire, STARTER_CODE } from "@/types/circuit";
import { createArduinoUno, createBreadboard, createLED, createResistor } from "./componentTemplates";
import { generateId } from "@/lib/utils";

export interface StarterCircuit {
  name: string;
  code: string;
  components: ComponentInstance[];
  wires: Wire[];
}

/** A pre-wired, code-driven Blink demo that is ready to run on first load. */
export function createStarterCircuit(): StarterCircuit {
  const board = createArduinoUno(40, 30);
  const breadboard = createBreadboard(40, 230);
  const led = createLED(280, 130, "red");
  const resistor = createResistor(180, 165, 220);
  const components = [board, breadboard, led, resistor];
  const pin = board.terminals.find((terminal) => terminal.label === "D8")!;
  const ground = board.terminals.find((terminal) => terminal.label === "GND-1")!;
  const resistorA = resistor.terminals[0];
  const resistorB = resistor.terminals[1];
  const anode = led.terminals.find((terminal) => terminal.label === "ANODE")!;
  const cathode = led.terminals.find((terminal) => terminal.label === "CATHODE")!;
  const makeWire = (a: typeof pin, b: typeof pin, color: string): Wire => ({
    id: generateId("wire"),
    startTerminalId: a.id,
    endTerminalId: b.id,
    startComponentId: a.componentId,
    endComponentId: b.componentId,
    color,
  });
  return {
    name: "Blink LED — Pin 8",
    code: STARTER_CODE,
    components,
    wires: [
      makeWire(pin, resistorA, "#EF4444"),
      makeWire(resistorB, anode, "#EF4444"),
      makeWire(cathode, ground, "#1F2937"),
    ],
  };
}
