/** Ready-to-load beginner project template checks. Run: npx tsx tests/beginner-project-templates.test.ts */
import assert from "node:assert/strict";
import { BEGINNER_PROJECTS, createBeginnerProject } from "../src/circuit-engine/models/beginnerProjectTemplates";
import { compileSimulationProgram } from "../src/simulation/interfaces/simulationAdapter";

assert.equal(BEGINNER_PROJECTS.length, 14, "the dropdown should offer all fourteen catalog projects");
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
  const secondCopy = createBeginnerProject(item.id);
  assert.notEqual(project.components[0].id, secondCopy.components[0].id, `${item.name} should create fresh component IDs for each selection`);
  console.log(`✅ ${item.name}: sketch, wiring references, focus, and fresh IDs`);
}
console.log(`\n${BEGINNER_PROJECTS.length} beginner project templates passed.`);
