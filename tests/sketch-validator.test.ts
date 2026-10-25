/** M3 sketch validation tests. Run: npx tsx tests/sketch-validator.test.ts */
import assert from "node:assert/strict";
import { STARTER_CODE, SERIAL_DEMO_CODE } from "../src/types/circuit";
import { validateSketch } from "../src/simulation/interfaces/compileAdapter";
import { compileSimulationProgram } from "../src/simulation/interfaces/simulationAdapter";

let passed = 0;
function test(name: string, run: () => void) {
  run(); passed++; console.log(`✅ ${name}`);
}

test("starter Blink sketch passes and reports supported APIs", () => {
  const result = validateSketch(STARTER_CODE);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.deepEqual(result.usedApis.sort(), ["delay", "digitalWrite", "pinMode"].sort());
});
test("Serial example passes", () => {
  const result = validateSketch(SERIAL_DEMO_CODE);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.usedApis.includes("Serial.begin"));
  assert.ok(result.usedApis.includes("Serial.println"));
});
test("bounded pushbutton digitalRead if/else sketch passes validation", () => {
  const code = `const int buttonPin = 2;\nconst int ledPin = 8;\nvoid setup() { pinMode(buttonPin, INPUT_PULLUP); pinMode(ledPin, OUTPUT); }\nvoid loop() { if (digitalRead(buttonPin) == LOW) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); } delay(20); }`;
  const result = validateSketch(code);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.usedApis.includes("digitalRead"));
});
test("bounded tone and noTone API calls pass sketch diagnostics", () => {
  const result = validateSketch("void setup() {}\nvoid loop() { tone(9, 440, 100); noTone(9); delay(20); }");
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.usedApis.includes("tone"));
  assert.ok(result.usedApis.includes("noTone"));
});
test("bounded analogRead threshold code is accepted by sketch diagnostics", () => {
  const code = "const int potPin = A0;\nvoid setup() {}\nvoid loop() { if (analogRead(potPin) > 512) { digitalWrite(8, HIGH); } else { digitalWrite(8, LOW); } delay(20); }";
  const result = validateSketch(code);
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.usedApis.includes("analogRead"));
});
test("missing setup and loop are line errors", () => {
  const result = validateSketch("void loop() { delay(1); }");
  assert.equal(result.success, false);
  assert.match(result.errors.map(e => e.message).join(" "), /Missing setup/);
});
test("bounded analogWrite is accepted as a supported PWM API", () => {
  const result = validateSketch("void setup() { analogWrite(9, 128); }\nvoid loop() {}");
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.usedApis.includes("analogWrite"));
});
test("bounded Servo attach/write methods are recognized without enabling arbitrary methods", () => {
  const result = validateSketch("#include <Servo.h>\nServo arm;\nvoid setup() { arm.attach(9); }\nvoid loop() { arm.write(90); delay(20); }");
  assert.equal(result.success, true, JSON.stringify(result.errors));
  assert.ok(result.usedApis.includes("Servo.attach"));
  assert.ok(result.usedApis.includes("Servo.write"));
  const unsupported = validateSketch("Servo arm;\nvoid setup() { arm.detach(); }\nvoid loop() { delay(20); }");
  assert.equal(unsupported.success, false);
});

test("bounded pulseIn threshold conditions are recognized without allowing generic pulseIn statements", () => {
  const supported = validateSketch("const int echoPin = 2;\nvoid setup() {}\nvoid loop() { if (pulseIn(echoPin, HIGH, 30000) < 1160) { digitalWrite(8, HIGH); } delay(20); }");
  assert.equal(supported.success, true, JSON.stringify(supported.errors));
  assert.ok(supported.usedApis.includes("pulseIn"));
  const unsupportedStatement = compileSimulationProgram("void setup() {}\nvoid loop() { pulseIn(2, HIGH); delay(20); }");
  assert.equal(unsupportedStatement.success, false);
});
test("unbalanced braces are caught", () => {
  const result = validateSketch("void setup() {\nvoid loop() {}\n");
  assert.equal(result.success, false);
  assert.match(result.errors.map(e => e.message).join(" "), /Unbalanced braces/);
});
test("comments and string literals do not trigger API/braces errors", () => {
  const result = validateSketch('void setup() { Serial.println("{ tone(3, 440);"); } // analogWrite(8, 20)\nvoid loop() {}');
  assert.equal(result.success, true, JSON.stringify(result.errors));
});
test("unknown function call gets actionable error at source line", () => {
  const result = validateSketch("void setup() {\n  mysteryThing();\n}\nvoid loop() {}");
  assert.equal(result.success, false);
  assert.match(result.errors[0].message, /Unsupported function mysteryThing/);
  assert.equal(result.errors[0].line, 2);
});

console.log(`\n${passed} M3 tests passed.`);
