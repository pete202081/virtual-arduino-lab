/** M4 simulation adapter tests. Run: npx tsx tests/simulation-adapter.test.ts */
import assert from "node:assert/strict";
import { createArduinoUno, createLED, createResistor, createPushButton, createBuzzer, createPotentiometer, createLdrSensor, createRGBLED, createSevenSegmentDisplay, createSlideSwitch, createJoystickModule, createServoMotor, createDcMotor, createHBridgeDriver, createPirSensor, createHcSr04Sensor } from "../src/circuit-engine/models/componentTemplates";
import { STARTER_CODE } from "../src/types/circuit";
import { compileSimulationProgram, getLitLedIds, getLedBrightnesses, getBuzzerSignals, getRGBLedStates, getSevenSegmentStates, getServoStates, servoPulseWidthMicroseconds, getDcMotorStates, readDigitalPin, readAnalogPin, readUltrasonicPulseDuration, PinMode, PinLevel, RuntimeSnapshot, SimulationRuntime } from "../src/simulation/interfaces/simulationAdapter";
import { buildCircuitGraph } from "../src/circuit-engine/graph/netGraph";

let passed = 0;
function test(name: string, run: () => void) { run(); passed++; console.log(`✅ ${name}`); }

class FakeClock {
  now = 0;
  tasks: Array<{ id: number; at: number; fn: () => void; cancelled: boolean }> = [];
  nextId = 0;
  schedule = (fn: () => void, ms: number) => {
    const task = { id: ++this.nextId, at: this.now + ms, fn, cancelled: false };
    this.tasks.push(task);
    return task as unknown as ReturnType<typeof setTimeout>;
  };
  cancel = (handle: ReturnType<typeof setTimeout>) => {
    const task = handle as unknown as { cancelled: boolean };
    task.cancelled = true;
  };
  advance(ms: number) {
    const until = this.now + ms;
    while (true) {
      const next = this.tasks.filter(t => !t.cancelled && t.at <= until).sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!next) break;
      next.cancelled = true;
      this.now = next.at;
      next.fn();
    }
    this.now = until;
  }
}

test("Blink sketch compiles to safe setup/loop instructions", () => {
  const result = compileSimulationProgram(STARTER_CODE);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.program?.setup.some(i => i.kind === "pinMode" && i.pin === 8 && i.mode === "OUTPUT"));
  assert.deepEqual(result.program?.loop.filter(i => i.kind === "digitalWrite").map(i => i.kind === "digitalWrite" ? i.level : ""), ["HIGH", "LOW"]);
});
test("bounded analogWrite accepts PWM pins and 0–255 constants, but rejects invalid pins and values", () => {
  const valid = compileSimulationProgram("void setup() { analogWrite(3, 0); analogWrite(11, 255); }\nvoid loop() { analogWrite(9, 128); delay(1); }");
  assert.equal(valid.success, true, JSON.stringify(valid.errors));
  assert.deepEqual([...valid.program!.setup, ...valid.program!.loop].filter((instruction) => instruction.kind === "analogWrite").map((instruction) => instruction.kind === "analogWrite" ? [instruction.pin, instruction.value] : []), [[3, 0], [11, 255], [9, 128]]);
  const invalidPin = compileSimulationProgram("void setup() { analogWrite(8, 128); }\nvoid loop() { delay(1); }");
  assert.equal(invalidPin.success, false);
  assert.match(invalidPin.errors[0].message, /PWM pins/);
  const invalidValue = compileSimulationProgram("void setup() { analogWrite(9, 256); }\nvoid loop() { delay(1); }");
  assert.equal(invalidValue.success, false);
  assert.match(invalidValue.errors[0].message, /0 to 255/);
  const analogAlias = compileSimulationProgram("void setup() { analogWrite(9, A0); }\nvoid loop() { delay(1); }");
  assert.equal(analogAlias.success, false);
});

test("unsafe control-flow and unknown statements are rejected", () => {
  const result = compileSimulationProgram("void setup() {}\nvoid loop() { while (1) {} delay(10); }");
  assert.equal(result.success, false);
  assert.ok(result.errors.length > 0, "unsafe control-flow must produce an adapter error");
});
test("non-yielding loop is rejected", () => {
  const result = compileSimulationProgram("void setup() {}\nvoid loop() { digitalWrite(8, HIGH); }");
  assert.equal(result.success, false);
  assert.match(result.errors.at(-1)!.message, /positive delay/);
});
test("quoted punctuation does not break comments, statement splitting, or braces", () => {
  const code = `void setup() { Serial.println("brace {; // still text"); }\nvoid loop() { delay(2); }`;
  const result = compileSimulationProgram(code);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.deepEqual(result.program?.setup.filter(i => i.kind === "serialPrint").map(i => i.kind === "serialPrint" ? i.text : ""), ["brace {; // still text"]);
});
test("runtime honors pinMode, writes, real delay, serial and stop", () => {
  const result = compileSimulationProgram(`const int pin = 8;\nvoid setup() { pinMode(pin, OUTPUT); Serial.begin(9600); Serial.println("ready"); }\nvoid loop() { digitalWrite(pin, HIGH); delay(1000); digitalWrite(pin, LOW); delay(1000); }`);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  const clock = new FakeClock();
  const changes: string[] = [];
  const serial: string[] = [];
  let baud = 0;
  const runtime = new SimulationRuntime(result.program!, {
    onPinChange: (pin, level) => changes.push(`${pin}:${level}`),
    onDigitalRead: () => "HIGH",
    onAnalogRead: () => 0,
    onToneChange: () => undefined,
    onSerial: text => serial.push(text),
    onBaud: value => { baud = value; },
    onError: message => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(0);
  assert.equal(baud, 9600);
  assert.deepEqual(serial, ["ready\n"]);
  assert.deepEqual(changes, ["8:HIGH"]);
  clock.advance(999);
  assert.deepEqual(changes, ["8:HIGH"]);
  clock.advance(1);
  assert.deepEqual(changes, ["8:HIGH", "8:LOW"]);
  runtime.stop();
  clock.advance(5000);
  assert.deepEqual(changes, ["8:HIGH", "8:LOW"]);
  assert.equal(runtime.isRunning, false);
});
test("runtime analogWrite sets PWM duty and a later digitalWrite clears PWM state", () => {
  const result = compileSimulationProgram("void setup() { analogWrite(9, 128); }\nvoid loop() { digitalWrite(9, HIGH); delay(10); }");
  assert.equal(result.success, true, JSON.stringify(result.errors));
  const clock = new FakeClock();
  const pwm: Array<{ pin: number; value: number; mode: string | undefined }> = [];
  const digital: Array<{ pin: number; level: string; pwmStillSet: boolean }> = [];
  const runtime = new SimulationRuntime(result.program!, {
    onPinChange: (pin, level, snapshot) => digital.push({ pin, level, pwmStillSet: snapshot.pwmLevels?.has(pin) ?? false }),
    onPwmChange: (pin, value, snapshot) => pwm.push({ pin, value, mode: snapshot.modes.get(pin) }),
    onDigitalRead: () => "HIGH",
    onAnalogRead: () => 0,
    onToneChange: () => undefined,
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: (message) => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  assert.deepEqual(pwm, [{ pin: 9, value: 128, mode: "OUTPUT" }]);
  clock.advance(0);
  assert.deepEqual(digital, [{ pin: 9, level: "HIGH", pwmStillSet: false }]);
  runtime.stop();
});

test("Servo API compiles only declared objects, digital pins D2–D13, and fixed 0–180 degree angles", () => {
  const source = `#include <Servo.h>\nServo arm;\nconst int signalPin = 9;\nvoid setup() { arm.attach(signalPin); arm.write(0); }\nvoid loop() { arm.write(180); delay(20); }`;
  const compiled = compileSimulationProgram(source);
  assert.equal(compiled.success, true, JSON.stringify(compiled.errors));
  assert.ok(compiled.program?.setup.some((instruction) => instruction.kind === "servoAttach" && instruction.pin === 9));
  assert.ok(compiled.program?.setup.some((instruction) => instruction.kind === "servoWrite" && instruction.angle === 0));
  assert.equal(compileSimulationProgram("void setup() { arm.attach(9); }\nvoid loop() { delay(20); }").success, false);
  assert.equal(compileSimulationProgram("Servo arm; void setup() { arm.attach(1); }\nvoid loop() { delay(20); }").success, false);
  assert.equal(compileSimulationProgram("Servo arm; void setup() { arm.write(181); }\nvoid loop() { delay(20); }").success, false);
});

test("Servo runtime maps write angles to modeled pulse widths and emits 50 Hz position updates", () => {
  const result = compileSimulationProgram("Servo arm;\nvoid setup() { arm.attach(9); arm.write(0); }\nvoid loop() { arm.write(180); delay(20); arm.write(90); delay(20); }");
  assert.equal(result.success, true, JSON.stringify(result.errors));
  const clock = new FakeClock();
  const positions: Array<{ pin: number; angle: number; snapshotAngle: number | undefined }> = [];
  const runtime = new SimulationRuntime(result.program!, {
    onPinChange: () => undefined,
    onServoChange: (pin, angle, snapshot) => positions.push({ pin, angle, snapshotAngle: snapshot.servoAngles?.get(pin) }),
    onDigitalRead: () => "HIGH",
    onAnalogRead: () => 0,
    onToneChange: () => undefined,
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: (message) => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(0);
  clock.advance(20);
  assert.deepEqual(positions, [
    { pin: 9, angle: 90, snapshotAngle: 90 },
    { pin: 9, angle: 0, snapshotAngle: 0 },
    { pin: 9, angle: 180, snapshotAngle: 180 },
    { pin: 9, angle: 90, snapshotAngle: 90 },
  ]);
  assert.deepEqual([servoPulseWidthMicroseconds(0), servoPulseWidthMicroseconds(90), servoPulseWidthMicroseconds(180)], [1000, 1500, 2000]);
  runtime.stop();
});

test("servo module only animates from an attached signal on a powered, grounded circuit", () => {
  const board = createArduinoUno(0, 0);
  const servo = createServoMotor(400, 200);
  const components = [board, servo];
  const wires = [
    { id: "servo-vcc", startTerminalId: servo.terminals.find((terminal) => terminal.label === "VCC")!.id, endTerminalId: board.terminals.find((terminal) => terminal.label === "5V")!.id, startComponentId: servo.id, endComponentId: board.id, color: "#EF4444" },
    { id: "servo-gnd", startTerminalId: servo.terminals.find((terminal) => terminal.label === "GND")!.id, endTerminalId: board.terminals.find((terminal) => terminal.label === "GND-1")!.id, startComponentId: servo.id, endComponentId: board.id, color: "#1F2937" },
    { id: "servo-sig", startTerminalId: servo.terminals.find((terminal) => terminal.label === "SIG")!.id, endTerminalId: board.terminals.find((terminal) => terminal.label === "D9")!.id, startComponentId: servo.id, endComponentId: board.id, color: "#F59E0B" },
  ];
  const snapshot: RuntimeSnapshot = { modes: new Map([[9, "OUTPUT"]]), levels: new Map(), servoAngles: new Map([[9, 135]]) };
  assert.deepEqual(getServoStates(components, wires, snapshot), [{ componentId: servo.id, signalPin: 9, angle: 135, pulseMicroseconds: 1750, refreshHz: 50 }]);
  assert.deepEqual(getServoStates(components, wires.slice(0, 2), snapshot), []);
  assert.deepEqual(getServoStates(components, wires.slice(1), snapshot), []);
});

test("H-bridge maps PWM enable and IN1/IN2 direction to a connected DC motor", () => {
  const board = createArduinoUno(0, 0);
  const driver = createHBridgeDriver(350, 200);
  const motor = createDcMotor(600, 220);
  const components = [board, driver, motor];
  const terminal = (component: typeof board, label: string) => component.terminals.find((item) => item.label === label)!;
  const wire = (id: string, startComponent: typeof board, startLabel: string, endComponent: typeof board, endLabel: string) => ({
    id,
    startTerminalId: terminal(startComponent, startLabel).id,
    endTerminalId: terminal(endComponent, endLabel).id,
    startComponentId: startComponent.id,
    endComponentId: endComponent.id,
    color: "#2563EB",
  });
  const wires = [
    wire("logic-power", board, "5V", driver, "VCC"),
    wire("motor-power", board, "5V", driver, "VM"),
    wire("ground", board, "GND-1", driver, "GND"),
    wire("enable", board, "D3", driver, "ENA"),
    wire("input-1", board, "D4", driver, "IN1"),
    wire("input-2", board, "D5", driver, "IN2"),
    wire("output-1", driver, "OUT1", motor, "M+"),
    wire("output-2", driver, "OUT2", motor, "M-"),
  ];
  const modes = new Map([[3, "OUTPUT" as const], [4, "OUTPUT" as const], [5, "OUTPUT" as const]]);
  const clockwise: RuntimeSnapshot = { modes, levels: new Map([[4, "HIGH"], [5, "LOW"]]), pwmLevels: new Map([[3, 128]]) };
  assert.deepEqual(getDcMotorStates(components, wires, clockwise), [{ componentId: motor.id, driverId: driver.id, direction: "CLOCKWISE", duty: 128, speedPercent: 50 }]);
  const counterclockwise: RuntimeSnapshot = { ...clockwise, levels: new Map([[4, "LOW"], [5, "HIGH"]]) };
  assert.equal(getDcMotorStates(components, wires, counterclockwise)[0].direction, "COUNTERCLOCKWISE");
  const stopped: RuntimeSnapshot = { ...clockwise, pwmLevels: new Map([[3, 0]]) };
  assert.equal(getDcMotorStates(components, wires, stopped)[0].direction, "STOPPED");
  const braked: RuntimeSnapshot = { ...clockwise, levels: new Map([[4, "HIGH"], [5, "HIGH"]]) };
  assert.equal(getDcMotorStates(components, wires, braked)[0].direction, "BRAKED");
  assert.deepEqual(getDcMotorStates(components, wires.slice(0, 6), clockwise), []);
});

test("LED lights only on a connected, forward-biased output path", () => {
  const board = createArduinoUno(0, 0);
  const resistor = createResistor(60, 60, 220);
  const led = createLED(100, 100);
  const d8 = board.terminals.find(t => t.label === "D8")!.id;
  const gnd = board.terminals.find(t => t.label === "GND-1")!.id;
  const rA = resistor.terminals[0].id;
  const rB = resistor.terminals[1].id;
  const anode = led.terminals.find(t => t.label === "ANODE")!.id;
  const cathode = led.terminals.find(t => t.label === "CATHODE")!.id;
  const components = [board, resistor, led];
  const wire = (id: string, a: string, b: string, aComp: string, bComp: string) => ({ id, startTerminalId: a, endTerminalId: b, startComponentId: aComp, endComponentId: bComp, color: "#f00" });
  const wires = [wire("w1", d8, rA, board.id, resistor.id), wire("w2", rB, anode, resistor.id, led.id), wire("w3", cathode, gnd, led.id, board.id)];
  const highSnapshot: RuntimeSnapshot = { modes: new Map<number, PinMode>([[8, "OUTPUT"]]), levels: new Map<number, PinLevel>([[8, "HIGH"]]) };
  assert.deepEqual(getLitLedIds(components, wires, highSnapshot), [led.id]);
  assert.deepEqual(getLedBrightnesses(components, wires, { ...highSnapshot, levels: new Map(), pwmLevels: new Map([[8, 64]]) }), [{ componentId: led.id, brightness: 64 }]);
  assert.deepEqual(getLitLedIds(components, wires, { ...highSnapshot, levels: new Map(), pwmLevels: new Map([[8, 0]]) }), []);
  assert.deepEqual(getLitLedIds(components, wires, { ...highSnapshot, levels: new Map([[8, "LOW"]]) }), []);
  assert.deepEqual(getLitLedIds(components, [], highSnapshot), []);
  const reversed = [wire("w4", d8, cathode, board.id, led.id), wire("w5", anode, gnd, led.id, board.id)];
  assert.deepEqual(getLitLedIds(components, reversed, highSnapshot), []);
});

test("pushbutton opens and closes its circuit, and INPUT_PULLUP reads LOW only while pressed", () => {
  const board = createArduinoUno(0, 0);
  const button = createPushButton(100, 100);
  const d2 = board.terminals.find(t => t.label === "D2")!;
  const gnd = board.terminals.find(t => t.label === "GND-1")!;
  const side1 = button.terminals.find(t => t.label === "1A")!;
  const side2 = button.terminals.find(t => t.label === "2A")!;
  const components = [board, button];
  const wire = (id: string, a: typeof d2, b: typeof d2) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#EF4444" });
  const wires = [wire("to-button", d2, side1), wire("to-ground", side2, gnd)];
  const modes = new Map<number, PinMode>([[2, "INPUT_PULLUP"]]);
  assert.equal(buildCircuitGraph(components, wires).hasConnection(d2.id, gnd.id), false);
  assert.equal(readDigitalPin(2, modes, components, wires), "HIGH");
  assert.equal(buildCircuitGraph(components, wires, new Set([button.id])).hasConnection(d2.id, gnd.id), true);
  assert.equal(readDigitalPin(2, modes, components, wires, new Set([button.id])), "LOW");
});

test("HC-SR04 pulseIn threshold control models one triggered echo and responds to distance", () => {
  const board = createArduinoUno(0, 0);
  const sensor = createHcSr04Sensor(420, 200);
  sensor.properties.distanceCm = 10;
  const trigBoard = board.terminals.find((terminal) => terminal.label === "D3")!;
  const echoBoard = board.terminals.find((terminal) => terminal.label === "D2")!;
  const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V")!;
  const ground = board.terminals.find((terminal) => terminal.label === "GND-1")!;
  const trig = sensor.terminals.find((terminal) => terminal.label === "TRIG")!;
  const echo = sensor.terminals.find((terminal) => terminal.label === "ECHO")!;
  const vcc = sensor.terminals.find((terminal) => terminal.label === "VCC")!;
  const sensorGround = sensor.terminals.find((terminal) => terminal.label === "GND")!;
  const components = [board, sensor];
  const wire = (id: string, a: typeof trigBoard, b: typeof trigBoard) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#0284C7" });
  const wires = [wire("trig", trig, trigBoard), wire("echo", echo, echoBoard), wire("vcc", vcc, fiveVolt), wire("gnd", sensorGround, ground)];
  const program = compileSimulationProgram(`const int trigPin = 3; const int echoPin = 2; const int lampPin = 8; void setup() { pinMode(trigPin, OUTPUT); pinMode(echoPin, INPUT); pinMode(lampPin, OUTPUT); } void loop() { digitalWrite(trigPin, LOW); delayMicroseconds(2); digitalWrite(trigPin, HIGH); delayMicroseconds(10); digitalWrite(trigPin, LOW); if (pulseIn(echoPin, HIGH, 30000) < 1160) { digitalWrite(lampPin, HIGH); } else { digitalWrite(lampPin, LOW); } delay(50); }`);
  assert.equal(program.success, true, JSON.stringify(program.errors));
  const clock = new FakeClock();
  const pinChanges: string[] = [];
  const runtime = new SimulationRuntime(program.program!, {
    onPinChange: (pin, level) => pinChanges.push(`${pin}:${level}`),
    onDigitalRead: () => "LOW",
    onPulseIn: (pin, timeout, snapshot) => readUltrasonicPulseDuration(pin, timeout, components, wires, snapshot),
    onAnalogRead: () => 0,
    onToneChange: () => undefined,
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: (message) => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(1);
  assert.ok(pinChanges.includes("8:HIGH"), "10 cm distance should fall below the ~20 cm threshold");
  assert.equal(readUltrasonicPulseDuration(2, 30_000, components, wires, { modes: new Map([[2, "INPUT"], [3, "OUTPUT"]]), levels: new Map([[3, "LOW"]]), triggeredPins: new Set([3]) }), 580);
  sensor.properties.distanceCm = 100;
  clock.advance(60);
  assert.ok(pinChanges.includes("8:LOW"), "100 cm distance should exceed the threshold");
  runtime.stop();
  assert.equal(readUltrasonicPulseDuration(2, 30_000, components, wires, { modes: new Map([[2, "INPUT"], [3, "OUTPUT"]]), levels: new Map([[3, "LOW"]]), triggeredPins: new Set() }), 30_000, "an untriggered sensor produces the bounded timeout duration");
});

test("PIR digital output follows simulated motion only when wired and powered", () => {
  const board = createArduinoUno(0, 0);
  const pir = createPirSensor(420, 200);
  const d2 = board.terminals.find((terminal) => terminal.label === "D2")!;
  const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V")!;
  const ground = board.terminals.find((terminal) => terminal.label === "GND-1")!;
  const output = pir.terminals.find((terminal) => terminal.label === "OUT")!;
  const vcc = pir.terminals.find((terminal) => terminal.label === "VCC")!;
  const sensorGround = pir.terminals.find((terminal) => terminal.label === "GND")!;
  const components = [board, pir];
  const wire = (id: string, a: typeof d2, b: typeof d2) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#8B5CF6" });
  const modes = new Map<number, PinMode>([[2, "INPUT"]]);
  const wires = [wire("out", output, d2), wire("vcc", vcc, fiveVolt), wire("gnd", sensorGround, ground)];
  assert.equal(readDigitalPin(2, modes, components, wires), "LOW");
  pir.properties.motionDetected = true;
  assert.equal(readDigitalPin(2, modes, components, wires), "HIGH");
  assert.equal(readDigitalPin(2, modes, components, wires.slice(0, 2)), "LOW", "sensor output stays inactive without its ground connection");
  assert.equal(readDigitalPin(2, modes, components, wires.slice(1)), "LOW", "sensor output stays inactive without its signal wire");
  const sketch = compileSimulationProgram("const int motionPin = 2; const int lampPin = 8; void setup() { pinMode(motionPin, INPUT); pinMode(lampPin, OUTPUT); } void loop() { if (digitalRead(motionPin) == HIGH) { digitalWrite(lampPin, HIGH); } else { digitalWrite(lampPin, LOW); } delay(20); }");
  assert.equal(sketch.success, true, JSON.stringify(sketch.errors));
});

test("bounded if/else digitalRead sketch responds to button presses at the next loop poll", () => {
  const code = `const int buttonPin = 2;\nconst int ledPin = 8;\nvoid setup() { pinMode(buttonPin, INPUT_PULLUP); pinMode(ledPin, OUTPUT); }\nvoid loop() { if (digitalRead(buttonPin) == LOW) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); } delay(20); }`;
  const result = compileSimulationProgram(code);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  const clock = new FakeClock();
  let input: PinLevel = "HIGH";
  const changes: string[] = [];
  const runtime = new SimulationRuntime(result.program!, {
    onPinChange: (pin, level) => changes.push(`${pin}:${level}`),
    onDigitalRead: () => input,
    onAnalogRead: () => 0,
    onToneChange: () => undefined,
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: message => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(0);
  assert.deepEqual(changes, ["8:LOW"]);
  input = "LOW";
  clock.advance(20);
  assert.deepEqual(changes, ["8:LOW", "8:HIGH"]);
  input = "HIGH";
  clock.advance(20);
  assert.deepEqual(changes, ["8:LOW", "8:HIGH", "8:LOW"]);
  runtime.stop();
});

test("active buzzer sounds at its fixed pitch only on a valid powered path", () => {
  const board = createArduinoUno(0, 0);
  const buzzer = createBuzzer(100, 100, "active");
  const d9 = board.terminals.find(t => t.label === "D9")!;
  const gnd = board.terminals.find(t => t.label === "GND-1")!;
  const positive = buzzer.terminals.find(t => t.label === "+")!;
  const negative = buzzer.terminals.find(t => t.label === "-")!;
  const components = [board, buzzer];
  const wire = (id: string, a: typeof d9, b: typeof d9) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#EF4444" });
  const wires = [wire("plus-to-d9", positive, d9), wire("minus-to-gnd", negative, gnd)];
  const high: RuntimeSnapshot = { modes: new Map([[9, "OUTPUT"]]), levels: new Map([[9, "HIGH"]]) };
  const low: RuntimeSnapshot = { modes: new Map([[9, "OUTPUT"]]), levels: new Map([[9, "LOW"]]) };
  assert.deepEqual(getBuzzerSignals(components, wires, high), [{ componentId: buzzer.id, frequency: 2300 }]);
  assert.deepEqual(getBuzzerSignals(components, wires, low), []);
});

test("passive buzzer responds to bounded tone/noTone commands and stops on runtime stop", () => {
  const code = `const int buzzerPin = 9;\nvoid setup() {}\nvoid loop() { tone(buzzerPin, 440); delay(100); noTone(buzzerPin); delay(100); }`;
  const result = compileSimulationProgram(code);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  const clock = new FakeClock();
  const changes: Array<number | null> = [];
  const runtime = new SimulationRuntime(result.program!, {
    onPinChange: () => undefined,
    onDigitalRead: () => "LOW",
    onAnalogRead: () => 0,
    onToneChange: (_pin, frequency) => changes.push(frequency),
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: message => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(0);
  assert.deepEqual(changes, [440]);
  clock.advance(100);
  assert.deepEqual(changes, [440, null]);
  clock.advance(100);
  assert.deepEqual(changes, [440, null, 440]);
  runtime.stop();
  assert.deepEqual(changes, [440, null, 440, null]);
  clock.advance(1000);
  assert.deepEqual(changes, [440, null, 440, null]);
});

test("tone duration validates, auto-stops, and rejects out-of-range frequencies", () => {
  const timed = compileSimulationProgram("void setup() {}\nvoid loop() { tone(9, 440, 100); delay(200); }");
  assert.equal(timed.success, true, JSON.stringify(timed.errors));
  const invalid = compileSimulationProgram("void setup() {}\nvoid loop() { tone(9, 1); delay(200); }");
  assert.equal(invalid.success, false);
  assert.match(invalid.errors[0].message, /frequency/);

  const clock = new FakeClock();
  const changes: Array<number | null> = [];
  const runtime = new SimulationRuntime(timed.program!, {
    onPinChange: () => undefined,
    onDigitalRead: () => "LOW",
    onAnalogRead: () => 0,
    onToneChange: (_pin, frequency) => changes.push(frequency),
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: message => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(0);
  assert.deepEqual(changes, [440]);
  clock.advance(100);
  assert.deepEqual(changes, [440, null]);
  runtime.stop();
});

test("passive buzzer requires a matching tone pin and ground path", () => {
  const board = createArduinoUno(0, 0);
  const buzzer = createBuzzer(100, 100, "passive");
  const d9 = board.terminals.find(t => t.label === "D9")!;
  const gnd = board.terminals.find(t => t.label === "GND-1")!;
  const positive = buzzer.terminals.find(t => t.label === "+")!;
  const negative = buzzer.terminals.find(t => t.label === "-")!;
  const components = [board, buzzer];
  const wire = (id: string, a: typeof d9, b: typeof d9) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#EF4444" });
  const wires = [wire("plus-to-d9", positive, d9), wire("minus-to-gnd", negative, gnd)];
  const snapshot: RuntimeSnapshot = { modes: new Map(), levels: new Map(), tones: new Map([[9, 440]]) };
  assert.deepEqual(getBuzzerSignals(components, wires, snapshot), [{ componentId: buzzer.id, frequency: 440 }]);
  assert.deepEqual(getBuzzerSignals(components, [], snapshot), []);
});

test("potentiometer analogRead returns its wired wiper value on A0", () => {
  const board = createArduinoUno(0, 0);
  const pot = createPotentiometer(100, 100);
  const analog = board.terminals.find(t => t.label === "A0")!;
  const fiveVolt = board.terminals.find(t => t.label === "5V")!;
  const ground = board.terminals.find(t => t.label === "GND-1")!;
  const potGround = pot.terminals.find(t => t.label === "GND")!;
  const wiper = pot.terminals.find(t => t.label === "WIPER")!;
  const potFiveVolt = pot.terminals.find(t => t.label === "5V")!;
  const components = [board, pot];
  const wire = (id: string, a: typeof analog, b: typeof analog) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#10B981" });
  const wires = [wire("pot-ground", potGround, ground), wire("pot-vcc", potFiveVolt, fiveVolt), wire("pot-wiper", wiper, analog)];
  assert.equal(readAnalogPin(0, components, wires), 512);
  assert.equal(readAnalogPin(0, components, wires.slice(0, 2)), 0);
  const adjusted = components.map(component => component.id === pot.id ? { ...component, properties: { ...component.properties, value: 1000 } } : component);
  assert.equal(readAnalogPin(0, adjusted, wires), 1000);
});

test("bounded analogRead threshold conditional responds when the potentiometer moves", () => {
  const code = `const int potPin = A0;\nconst int ledPin = 8;\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() { if (analogRead(potPin) > 512) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); } delay(20); }`;
  const result = compileSimulationProgram(code);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  const clock = new FakeClock();
  let analogValue = 300;
  const changes: string[] = [];
  const runtime = new SimulationRuntime(result.program!, {
    onPinChange: (pin, level) => changes.push(`${pin}:${level}`),
    onDigitalRead: () => "LOW",
    onAnalogRead: () => analogValue,
    onToneChange: () => undefined,
    onSerial: () => undefined,
    onBaud: () => undefined,
    onError: message => { throw new Error(message); },
  }, clock.schedule, clock.cancel);
  runtime.start();
  clock.advance(0);
  assert.deepEqual(changes, ["8:LOW"]);
  analogValue = 900;
  clock.advance(20);
  assert.deepEqual(changes, ["8:LOW", "8:HIGH"]);
  runtime.stop();
});

test("wired LDR maps dark/bright slider positions to an analog ADC reading", () => {
  const board = createArduinoUno(0, 0);
  const ldr = createLdrSensor(100, 100);
  const analog = board.terminals.find(t => t.label === "A0")!;
  const fiveVolt = board.terminals.find(t => t.label === "5V")!;
  const ground = board.terminals.find(t => t.label === "GND-1")!;
  const sensorVcc = ldr.terminals.find(t => t.label === "VCC")!;
  const sensorGround = ldr.terminals.find(t => t.label === "GND")!;
  const output = ldr.terminals.find(t => t.label === "AO")!;
  const components = [board, ldr];
  const wire = (id: string, a: typeof analog, b: typeof analog) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#F59E0B" });
  const wires = [wire("ldr-vcc", sensorVcc, fiveVolt), wire("ldr-gnd", sensorGround, ground), wire("ldr-ao", output, analog)];
  ldr.properties.lightLevel = 0;
  assert.equal(readAnalogPin(0, components, wires), 0);
  ldr.properties.lightLevel = 50;
  assert.equal(readAnalogPin(0, components, wires), 512);
  ldr.properties.lightLevel = 100;
  assert.equal(readAnalogPin(0, components, wires), 1023);
  assert.equal(readAnalogPin(0, components, wires.slice(0, 2)), 0);
});

test("RGB LED channels follow independent digital outputs with common cathode grounded", () => {
  const board = createArduinoUno(0, 0);
  const rgb = createRGBLED(120, 120);
  const pins = [9, 10, 11].map(number => board.terminals.find(t => t.label === `D${number}`)!);
  const common = rgb.terminals.find(t => t.label === "COMMON")!;
  const ground = board.terminals.find(t => t.label === "GND-1")!;
  const channelTerminals = ["R", "G", "B"].map(label => rgb.terminals.find(t => t.label === label)!);
  const components = [board, rgb];
  const wire = (id: string, a: typeof pins[number], b: typeof pins[number]) => ({ id, startTerminalId: a.id, endTerminalId: b.id, startComponentId: a.componentId, endComponentId: b.componentId, color: "#EF4444" });
  const wires = [
    wire("red-pin", channelTerminals[0], pins[0]),
    wire("green-pin", channelTerminals[1], pins[1]),
    wire("blue-pin", channelTerminals[2], pins[2]),
    wire("common-ground", common, ground),
  ];
  const snapshot: RuntimeSnapshot = {
    modes: new Map([[9, "OUTPUT"], [10, "OUTPUT"], [11, "OUTPUT"]]),
    levels: new Map([[9, "HIGH"], [10, "LOW"], [11, "HIGH"]]),
  };
  assert.deepEqual(getRGBLedStates(components, wires, snapshot), [{ componentId: rgb.id, red: true, green: false, blue: true, redLevel: 255, greenLevel: 0, blueLevel: 255 }]);
  assert.deepEqual(getRGBLedStates(components, wires.slice(0, 3), snapshot), [{ componentId: rgb.id, red: false, green: false, blue: false, redLevel: 0, greenLevel: 0, blueLevel: 0 }]);
  const pwmSnapshot: RuntimeSnapshot = { modes: snapshot.modes, levels: new Map(), pwmLevels: new Map([[9, 64], [10, 128], [11, 255]]) };
  assert.deepEqual(getRGBLedStates(components, wires, pwmSnapshot), [{ componentId: rgb.id, red: true, green: true, blue: true, redLevel: 64, greenLevel: 128, blueLevel: 255 }]);
});

test("7-segment display decodes independently wired digital outputs into digits", () => {
  const board = createArduinoUno(0, 0);
  const display = createSevenSegmentDisplay(400, 100);
  const labels = ["A", "B", "C", "D", "E", "F", "G", "DP"];
  const wires: Array<{ id: string; startTerminalId: string; endTerminalId: string; startComponentId: string; endComponentId: string; color: string }> = [];
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index];
    const displayPin = display.terminals.find((terminal) => terminal.label === label)!;
    const boardPin = board.terminals.find((terminal) => terminal.label === `D${index + 2}`)!;
    wires.push({ id: `segment-${label}`, startTerminalId: displayPin.id, endTerminalId: boardPin.id, startComponentId: display.id, endComponentId: board.id, color: "#EF4444" });
  }
  for (const label of ["COM1", "COM2"]) {
    const common = display.terminals.find((terminal) => terminal.label === label)!;
    const ground = board.terminals.find((terminal) => terminal.label === "GND-1")!;
    wires.push({ id: `ground-${label}`, startTerminalId: common.id, endTerminalId: ground.id, startComponentId: display.id, endComponentId: board.id, color: "#1F2937" });
  }
  const components = [board, display];
  const modes = new Map(Array.from({ length: 8 }, (_, index) => [index + 2, "OUTPUT" as const]));
  const digit2: RuntimeSnapshot = { modes, levels: new Map([[2, "HIGH"], [3, "HIGH"], [4, "LOW"], [5, "HIGH"], [6, "HIGH"], [7, "LOW"], [8, "HIGH"], [9, "LOW"]]) };
  assert.deepEqual(getSevenSegmentStates(components, wires, digit2), [{ componentId: display.id, segments: { A: true, B: true, C: false, D: true, E: true, F: false, G: true }, decimalPoint: false, digit: 2 }]);
  const digit3: RuntimeSnapshot = { modes, levels: new Map([[2, "HIGH"], [3, "HIGH"], [4, "HIGH"], [5, "HIGH"], [6, "LOW"], [7, "LOW"], [8, "HIGH"], [9, "LOW"]]) };
  assert.equal(getSevenSegmentStates(components, wires, digit3)[0].digit, 3);
  assert.equal(getSevenSegmentStates(components, wires.slice(0, 8), digit2)[0].digit, null);
});

test("latched slide switch opens HIGH and closes LOW on a pull-up digital input", () => {
  const board = createArduinoUno(0, 0);
  const slide = createSlideSwitch(400, 120);
  const input = board.terminals.find((terminal) => terminal.label === "D2")!;
  const ground = board.terminals.find((terminal) => terminal.label === "GND-1")!;
  const contactA = slide.terminals.find((terminal) => terminal.label === "A")!;
  const contactB = slide.terminals.find((terminal) => terminal.label === "B")!;
  const components = [board, slide];
  const wires = [
    { id: "switch-input", startTerminalId: contactA.id, endTerminalId: input.id, startComponentId: slide.id, endComponentId: board.id, color: "#EF4444" },
    { id: "switch-ground", startTerminalId: contactB.id, endTerminalId: ground.id, startComponentId: slide.id, endComponentId: board.id, color: "#1F2937" },
  ];
  const modes = new Map([[2, "INPUT_PULLUP" as const]]);
  assert.equal(readDigitalPin(2, modes, components, wires), "HIGH");
  assert.equal(readDigitalPin(2, modes, components, wires, new Set(), new Set([slide.id])), "LOW");
  slide.properties.isOn = true;
  assert.equal(readDigitalPin(2, modes, components, wires), "LOW", "persisted ON state should close the switch graph");
});

test("joystick X/Y axes map to wired analog inputs and its pressed SW reads LOW", () => {
  const board = createArduinoUno(0, 0);
  const joystick = createJoystickModule(400, 120);
  joystick.properties.xValue = 875;
  joystick.properties.yValue = 240;
  const components = [board, joystick];
  const wires: Array<{ id: string; startTerminalId: string; endTerminalId: string; startComponentId: string; endComponentId: string; color: string }> = [];
  const connect = (moduleLabel: string, boardLabel: string, id: string, color = "#2563EB") => {
    const start = joystick.terminals.find((terminal) => terminal.label === moduleLabel)!;
    const end = board.terminals.find((terminal) => terminal.label === boardLabel)!;
    wires.push({ id, startTerminalId: start.id, endTerminalId: end.id, startComponentId: joystick.id, endComponentId: board.id, color });
  };
  connect("VCC", "5V", "vcc", "#EF4444");
  connect("GND", "GND-1", "gnd", "#1F2937");
  connect("VRX", "A0", "x");
  connect("VRY", "A1", "y");
  connect("SW", "D2", "button");
  assert.equal(readAnalogPin(0, components, wires), 875);
  assert.equal(readAnalogPin(1, components, wires), 240);
  const modes = new Map([[2, "INPUT_PULLUP" as const]]);
  assert.equal(readDigitalPin(2, modes, components, wires), "HIGH");
  assert.equal(readDigitalPin(2, modes, components, wires, new Set([joystick.id])), "LOW");
});

console.log(`\n${passed} M4 tests passed.`);
