import assert from "node:assert/strict";
import { createArduinoUno, createBreadboard, createLED, createResistor } from "../src/circuit-engine/models/componentTemplates";
import { buildWireRoutePoints, wireRouteToPath, type RoutedTerminal } from "../src/components/circuit/wireRouting";
import type { ComponentInstance } from "../src/types/circuit";

function position(component: ComponentInstance, label: string): RoutedTerminal {
  const terminal = component.terminals.find((item) => item.label === label);
  assert.ok(terminal, `missing terminal ${label}`);
  return { x: component.x + terminal.dx, y: component.y + terminal.dy, compId: component.id };
}

function isOrthogonal(points: { x: number; y: number }[]) {
  return points.slice(1).every((point, index) =>
    Math.abs(point.x - points[index].x) < 0.001 || Math.abs(point.y - points[index].y) < 0.001,
  );
}

const board = createBreadboard(300, 180);
const uno = createArduinoUno(20, 180);
const resistor = createResistor(540, 170);
const led = createLED(680, 180);
const components = [board, uno, resistor, led];
const boardHole = position(board, "T-4-0");
const d8 = position(uno, "D8");

const breadboardRoute = buildWireRoutePoints(d8, boardHole, 0, components);
assert.equal(breadboardRoute[0].x, d8.x);
assert.equal(breadboardRoute[0].y, d8.y);
assert.equal(breadboardRoute.at(-1)?.x, boardHole.x);
assert.equal(breadboardRoute.at(-1)?.y, boardHole.y);
assert.ok(isOrthogonal(breadboardRoute), "breadboard wires should use orthogonal segments");
assert.match(wireRouteToPath(breadboardRoute), /Q/, "elbows should be rounded");
assert.doesNotMatch(wireRouteToPath(breadboardRoute), / C /, "routes should not use crossing-prone Bezier arcs");
console.log("✅ breadboard wire routes use rounded elbows and land on the exact hole terminal");

const boardToResistor = buildWireRoutePoints(boardHole, position(resistor, "A"), 1, components);
assert.equal(boardToResistor[0].x, boardHole.x);
assert.equal(boardToResistor.at(-1)?.x, resistor.x + resistor.terminals.find((item) => item.label === "A")!.dx);
assert.ok(isOrthogonal(boardToResistor));
console.log("✅ reverse-direction breadboard routes preserve endpoints and right-angle geometry");

const secondBoardRoute = buildWireRoutePoints(d8, position(board, "R_TOP+_0"), 1, components);
assert.notEqual(breadboardRoute[1].x, secondBoardRoute[1].x, "staggered entry lanes should separate nearby wires");
console.log("✅ breadboard wire routes stagger their outside approach lanes");

const resistorPoint = position(resistor, "B");
const ledPoint = position(led, "ANODE");
const directRoute = buildWireRoutePoints(resistorPoint, ledPoint, 2, components);
assert.equal(directRoute[0].x, resistorPoint.x);
assert.equal(directRoute.at(-1)?.x, ledPoint.x);
assert.ok(isOrthogonal(directRoute), "direct component wires should have an elbow route too");
console.log("✅ direct component wires use deterministic elbow routing");

console.log("4 wire-routing checks passed.");
