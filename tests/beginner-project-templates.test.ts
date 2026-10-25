/** Ready-to-load beginner project template checks. Run: npx tsx tests/beginner-project-templates.test.ts */
import assert from "node:assert/strict";
import { BEGINNER_PROJECTS, createBeginnerProject } from "../src/circuit-engine/models/beginnerProjectTemplates";
import { compileSimulationProgram } from "../src/simulation/interfaces/simulationAdapter";

assert.equal(BEGINNER_PROJECTS.length, 23, "the dropdown should offer all twenty-three catalog projects");
for (const item of BEGINNER_PROJECTS) {
  const project = createBeginnerProject(item.id);
  const compiled = compileSimulationProgram(project.code);
  assert.equal(compiled.success, true, `${item.name} sketch should compile: ${compiled.errors.map((error) => error.message).join("; ")}`);
  assert.ok(project.components.some((component) => component.type === "arduino-uno"), `${item.name} needs an Arduino board`);
  assert.ok(project.components.some((component) => component.id === project.focusComponentId), `${item.name} focus component must exist`);
  const terminalIds = new Set(project.components.flatMap((component) => component.terminals.map((terminal) => terminal.id)));
  for (const wire of project.wires) {
    assert.ok(terminalIds.has(wire.startTerminalId), `${item.name} wire start must exist`);
    assert.ok(terminalIds.has(wire.endTerminalId), `${item.name} wire end must exist`);
  }
  if (item.id === "two-branch-breadboard") {
    assert.equal(project.components.filter((component) => component.type === "breadboard").length, 1);
    assert.equal(project.components.filter((component) => component.type === "pushbutton").length, 1);
    assert.equal(project.components.filter((component) => component.type === "led").length, 2);
    assert.equal(project.components.filter((component) => component.type === "resistor").length, 2);
    assert.match(project.code, /digitalRead\(buttonPin\)/);
    assert.match(project.code, /digitalWrite\(blinkLedPin, HIGH\)/);
  }
  if (item.id === "armed-pir-alarm") {
    assert.equal(project.components.filter((component) => component.type === "slide-switch").length, 1);
    assert.equal(project.components.filter((component) => component.type === "pir").length, 1);
    assert.equal(project.components.filter((component) => component.type === "buzzer").length, 1);
    assert.equal(project.components.filter((component) => component.type === "led").length, 1);
    assert.equal(project.components.filter((component) => component.type === "resistor").length, 1);
    assert.match(project.code, /digitalRead\(armPin\)/);
    assert.match(project.code, /digitalRead\(motionPin\)/);
    assert.match(project.code, /tone\(buzzerPin, 880\)/);
    assert.match(project.code, /noTone\(buzzerPin\)/);
  }
  if (item.id === "distance-zone-parking") {
    assert.equal(project.components.filter((component) => component.type === "hc-sr04").length, 1);
    assert.equal(project.components.filter((component) => component.type === "rgb-led").length, 1);
    assert.equal(project.components.filter((component) => component.type === "buzzer").length, 1);
    assert.equal(project.components.filter((component) => component.type === "resistor").length, 3);
    assert.match(project.code, /pulseIn\(echoPin, HIGH, 30000\) < 870/);
    assert.match(project.code, /pulseIn\(echoPin, HIGH, 30000\) < 2320/);
    assert.match(project.code, /tone\(buzzerPin, 880\)/);
    assert.match(project.code, /tone\(buzzerPin, 440\)/);
    assert.match(project.code, /noTone\(buzzerPin\)/);
  }
  if (item.id === "temperature-controlled-fan") {
    assert.equal(project.components.filter((component) => component.type === "breadboard").length, 1);
    assert.equal(project.components.filter((component) => component.type === "tmp36").length, 1);
    assert.equal(project.components.filter((component) => component.type === "h-bridge").length, 1);
    assert.equal(project.components.filter((component) => component.type === "dc-motor").length, 1);
    assert.match(project.code, /analogRead\(tempPin\) > 185/);
    assert.match(project.code, /analogRead\(tempPin\) > 140/);
    assert.match(project.code, /analogWrite\(enablePin, 255\)/);
    assert.match(project.code, /analogWrite\(enablePin, 128\)/);
    assert.match(project.code, /analogWrite\(enablePin, 0\)/);
  }
  const secondCopy = createBeginnerProject(item.id);
  assert.notEqual(project.components[0].id, secondCopy.components[0].id, `${item.name} should create fresh component IDs for each selection`);
  console.log(`✅ ${item.name}: sketch, wiring references, focus, and fresh IDs`);
}
console.log(`\n${BEGINNER_PROJECTS.length} beginner project templates passed.`);
