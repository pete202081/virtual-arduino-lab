/** M5 project persistence validation tests. Run: npx tsx tests/project-persistence.test.ts */
import assert from "node:assert/strict";
import { createStarterCircuit } from "../src/circuit-engine/models/starterCircuit";
import { createPotentiometer, createLdrSensor, createRGBLED, createSevenSegmentDisplay, createSlideSwitch, createJoystickModule, createServoMotor, createDcMotor, createHBridgeDriver, createPirSensor } from "../src/circuit-engine/models/componentTemplates";
import { validateCircuit } from "../src/circuit-engine/validation/validator";
import { createProjectFile, listSavedProjects, loadMostRecentProject, loadProjectById, makeProjectFilename, MAX_PROJECT_BYTES, parseProjectData, parseProjectFile, saveProjectFile } from "../src/lib/projectPersistence";

let passed = 0;
function test(name: string, run: () => void) { run(); passed++; console.log(`✅ ${name}`); }
function starterFile() {
  const starter = createStarterCircuit();
  const now = new Date().toISOString();
  return createProjectFile({ id: "test_project_1", name: starter.name, createdAt: now, updatedAt: now, components: starter.components, wires: starter.wires, code: starter.code, settings: { wireColor: "#EF4444" } });
}

test("versioned export round-trips circuit, wires, sketch, and settings", () => {
  const file = starterFile();
  const parsed = parseProjectFile(JSON.stringify(file));
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.file.project.name, "Blink LED — Pin 8");
  assert.equal(parsed.file.project.components.length, 4);
  assert.equal(parsed.file.project.wires.length, 3);
  assert.equal(parsed.file.project.settings.wireColor, "#EF4444");
  assert.match(parsed.file.project.code, /digitalWrite\(ledPin, HIGH\)/);
});
test("potentiometer, LDR, RGB LED, 7-segment display, slide-switch state, joystick axes, servo position, H-bridge/motor, and PIR motion properties persist through project JSON", () => {
  const starter = createStarterCircuit();
  const pot = createPotentiometer(420, 260);
  pot.properties.value = 777;
  const ldr = createLdrSensor(520, 260);
  ldr.properties.lightLevel = 24;
  const rgb = createRGBLED(600, 200);
  const sevenSegment = createSevenSegmentDisplay(640, 220);
  const slideSwitch = createSlideSwitch(700, 230);
  slideSwitch.properties.isOn = true;
  const joystick = createJoystickModule(760, 250);
  joystick.properties.xValue = 901;
  joystick.properties.yValue = 37;
  const servo = createServoMotor(810, 260);
  servo.properties.angle = 135;
  const motor = createDcMotor(830, 300);
  const driver = createHBridgeDriver(620, 270);
  const pir = createPirSensor(880, 260);
  pir.properties.motionDetected = true;
  const now = new Date().toISOString();
  const file = createProjectFile({ id: "analog_project", name: "Additional Components Test", createdAt: now, updatedAt: now, components: [...starter.components, pot, ldr, rgb, sevenSegment, slideSwitch, joystick, servo, motor, driver, pir], wires: starter.wires, code: starter.code, settings: { wireColor: "#EF4444" } });
  const parsed = parseProjectFile(JSON.stringify(file));
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  const restoredPot = parsed.file.project.components.find((component) => component.type === "potentiometer");
  const restoredLdr = parsed.file.project.components.find((component) => component.type === "ldr");
  const restoredRgb = parsed.file.project.components.find((component) => component.type === "rgb-led");
  const restoredSevenSegment = parsed.file.project.components.find((component) => component.type === "seven-segment");
  const restoredSwitch = parsed.file.project.components.find((component) => component.type === "slide-switch");
  const restoredJoystick = parsed.file.project.components.find((component) => component.type === "joystick");
  const restoredServo = parsed.file.project.components.find((component) => component.type === "servo");
  const restoredMotor = parsed.file.project.components.find((component) => component.type === "dc-motor");
  const restoredDriver = parsed.file.project.components.find((component) => component.type === "h-bridge");
  const restoredPir = parsed.file.project.components.find((component) => component.type === "pir");
  assert.equal(restoredPot?.properties.value, 777);
  assert.equal(restoredPot?.terminals.length, 3);
  assert.equal(restoredLdr?.properties.lightLevel, 24);
  assert.equal(restoredLdr?.terminals.length, 3);
  assert.equal(restoredRgb?.properties.common, "cathode");
  assert.equal(restoredRgb?.terminals.length, 4);
  assert.equal(restoredSevenSegment?.properties.common, "cathode");
  assert.equal(restoredSevenSegment?.terminals.length, 10);
  assert.equal(restoredSwitch?.properties.isOn, true);
  assert.equal(restoredSwitch?.terminals.length, 2);
  assert.equal(restoredJoystick?.properties.xValue, 901);
  assert.equal(restoredJoystick?.properties.yValue, 37);
  assert.equal(restoredJoystick?.terminals.length, 5);
  assert.equal(restoredServo?.properties.angle, 135);
  assert.equal(restoredServo?.terminals.length, 3);
  assert.equal(restoredMotor?.type, "dc-motor");
  assert.equal(restoredMotor?.terminals.length, 2);
  assert.equal(restoredDriver?.type, "h-bridge");
  assert.deepEqual(restoredDriver?.terminals.map((terminal) => terminal.label), ["VCC", "VM", "GND", "ENA", "IN1", "IN2", "OUT1", "OUT2"]);
  assert.equal(restoredPir?.properties.motionDetected, true);
  assert.deepEqual(restoredPir?.terminals.map((terminal) => terminal.label), ["VCC", "OUT", "GND"]);
});
test("default Blink starter is pre-wired and passes circuit validation", () => {
  const starter = createStarterCircuit();
  const messages = validateCircuit(starter.components, starter.wires, starter.code);
  assert.equal(messages.some(message => message.severity === "error" || message.severity === "warning"), false);
  assert.equal(messages.some(message => message.code === "VALID"), true);
});
test("persistent format omits transient terminal connection flags", () => {
  const file = starterFile();
  file.project.components[0].terminals[0].connected = true;
  const parsed = parseProjectFile(JSON.stringify(file));
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.file.project.components[0].terminals[0].connected, false);
});
test("import rejects dangling wires and component/terminal mismatches", () => {
  const file = starterFile();
  file.project.wires[0].endTerminalId = "missing-terminal";
  const parsed = parseProjectData(file);
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.match(parsed.error, /missing terminal/);
});
test("unknown schema versions are rejected safely", () => {
  const file = starterFile();
  file.schemaVersion = 99;
  const parsed = parseProjectData(file);
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.match(parsed.error, /Unsupported project schema/);
});
test("legacy M1-M3 local project data migrates to schema version 1", () => {
  const file = starterFile();
  const legacy = { projectName: file.project.name, components: file.project.components, wires: file.project.wires, code: file.project.code, savedAt: file.project.updatedAt };
  const parsed = parseProjectData(legacy);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.migrated, true);
    assert.equal(parsed.file.schemaVersion, 1);
    assert.equal(parsed.file.project.wires.length, 3);
  }
});
test("oversized JSON is rejected before parsing", () => {
  const parsed = parseProjectFile(" ".repeat(MAX_PROJECT_BYTES + 1));
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.match(parsed.error, /5 MB limit/);
});
test("dangerous property keys and unsupported component types are rejected", () => {
  const file = starterFile();
  const component = file.project.components[0] as unknown as { properties: unknown };
  component.properties = JSON.parse('{"constructor":"bad"}');
  const parsed = parseProjectData(file);
  assert.equal(parsed.success, false);
  if (!parsed.success) assert.match(parsed.error, /invalid properties/);
});
test("export filename is filesystem-friendly", () => {
  assert.equal(makeProjectFilename("Blink LED — Pin 8"), "Blink-LED-Pin-8.valab.json");
});

async function testLocalStorageFallback() {
  const values = new Map<string, string>();
  const fakeStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: fakeStorage });
  try {
    const location = await saveProjectFile(starterFile());
    assert.equal(location, "localStorage");
    const listed = await listSavedProjects();
    assert.equal(listed.length, 1);
    const loaded = await loadProjectById(listed[0].id);
    assert.equal(loaded?.success, true);
    if (loaded?.success) assert.equal(loaded.file.project.wires.length, 3);
    const latest = await loadMostRecentProject();
    assert.equal(latest?.success, true);
    passed++;
    console.log("✅ localStorage fallback saves, lists, and reopens the versioned project");
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
  }
}

void testLocalStorageFallback().then(() => console.log(`\n${passed} M5 tests passed.`)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
