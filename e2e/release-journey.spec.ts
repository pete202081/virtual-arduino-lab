import { test, expect } from "@playwright/test";

test("pre-wired Blink starter runs from circuit graph and stops/resets", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await expect(page.getByText(/VALID.*Circuit looks valid/)).toBeVisible();

  // Exercise the Monaco editor as a beginner would: edit the sketch, then run it.
  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("// e2e sketch edit\nconst int ledPin = 8;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(1000);\n  digitalWrite(ledPin, LOW);\n  delay(1000);\n}");

  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByText(/LIT/)).toBeVisible();
  await expect(page.getByText(/LIT/)).toBeHidden({ timeout: 5_000 });

  await page.getByTitle("Stop").click();
  await expect(page.getByText(/LIT/)).toBeHidden();
  await page.locator('button[title="Reset"]').click();
  await expect(page.getByText(/Reset: interpreter stopped/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("save/open, duplicate, export/import, and safely reject invalid project files", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(/Saved “Blink LED — Pin 8” to IndexedDB/)).toBeVisible();

  await page.getByRole("button", { name: "Open", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Open a saved project" });
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: /Blink LED — Pin 8/ }).click();
  await expect(page.getByText(/Opened saved project “Blink LED — Pin 8”/)).toBeVisible();

  await page.getByRole("button", { name: "Project actions" }).click();
  await page.getByRole("button", { name: "Duplicate project" }).click();
  await expect(page.getByText(/Duplicated as “Blink LED — Pin 8 \(copy\)” and saved to IndexedDB/)).toBeVisible();

  await page.getByRole("button", { name: "Project actions" }).click();
  const downloadWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON…" }).click();
  const download = await downloadWait;
  expect(download.suggestedFilename()).toMatch(/\.valab\.json$/);
  const downloadedPath = await download.path();
  expect(downloadedPath).toBeTruthy();

  await page.locator('input[type="file"]').setInputFiles(downloadedPath!);
  await expect(page.getByText(/Imported and validated “Blink LED — Pin 8 \(copy\)”/)).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "invalid.valab.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ format: "not-a-lab", schemaVersion: 999, project: {} })),
  });
  await expect(page.getByText(/Import rejected safely: Not a Virtual Arduino Lab project file/)).toBeVisible();
  await expect(page.getByText("Blink LED — Pin 8 (copy)", { exact: true })).toBeVisible();
});

test("interactive pushbutton can be pressed and released on the canvas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /Pushbutton.*Interactive/ }).click();

  const button = page.getByRole("button", { name: "Pushbutton, released" });
  await expect(button).toBeVisible();
  await expect(page.getByTitle("Terminal 1A")).toBeVisible();
  await expect(page.getByTitle("Terminal 1B")).toBeVisible();
  await expect(page.getByTitle("Terminal 2A")).toBeVisible();
  await expect(page.getByTitle("Terminal 2B")).toBeVisible();

  await button.hover();
  await page.mouse.down();
  await expect(page.getByRole("button", { name: "Pushbutton, pressed" })).toBeVisible();
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Pushbutton, released" })).toBeVisible();

  // Drag the gray switch base (not the red cap) to reposition the component.
  const body = page.getByTitle("Drag the gray base to move; hold the red cap to press");
  const before = await body.boundingBox();
  expect(before).not.toBeNull();
  await page.mouse.move(before!.x + 6, before!.y + 24);
  await page.mouse.down();
  await page.mouse.move(before!.x + 86, before!.y + 64, { steps: 5 });
  await page.mouse.up();
  const after = await body.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.x).toBeGreaterThan(before!.x + 20);
  expect(errors).toEqual([]);
});

test("passive buzzer can be added, wired, and driven by tone()", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /Buzzer.*Audio/ }).click();

  await page.getByLabel("Buzzer type").selectOption("passive");
  await expect(page.getByText("Passive Buzzer", { exact: true }).last()).toBeVisible();

  const d9 = page.locator('[data-terminal-id$="-D9"]');
  const gnd = page.locator('[data-terminal-id$="-GND-1"]');
  const plus = page.getByTitle("Buzzer positive (+)");
  const minus = page.getByTitle("Buzzer negative (−)");
  // The starter LED overlaps the board's D9 hit target, so trigger the same delegated terminal-click event directly.
  await d9.dispatchEvent("click");
  await plus.dispatchEvent("click");
  await minus.dispatchEvent("click");
  await gnd.dispatchEvent("click");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int buzzerPin = 9;\nvoid setup() {}\nvoid loop() {\n  tone(buzzerPin, 440);\n  delay(1000);\n  noTone(buzzerPin);\n  delay(1000);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByTitle("Passive buzzer sounding at 440 Hz")).toBeVisible();
  await page.getByTitle("Stop").click();
  await expect(page.getByTitle("Passive buzzer")).toBeVisible();
  expect(errors).toEqual([]);
});

test("potentiometer analog input changes the simulated LED output", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /Potentiometer 10kΩ.*Analog/ }).click();

  const potGround = page.getByTitle("Potentiometer GND");
  const potWiper = page.getByTitle("Potentiometer WIPER");
  const potFiveVolt = page.getByTitle("Potentiometer 5V");
  const analogA0 = page.locator('[data-terminal-id$="-A0"]');
  const boardGround = page.locator('[data-terminal-id$="-GND-1"]');
  const boardFiveVolt = page.locator('[data-terminal-id$="-5V"]').first();
  await potGround.dispatchEvent("click");
  await boardGround.dispatchEvent("click");
  await potFiveVolt.dispatchEvent("click");
  await boardFiveVolt.dispatchEvent("click");
  await potWiper.dispatchEvent("click");
  await analogA0.dispatchEvent("click");

  const dial = page.getByLabel("Potentiometer position");
  await dial.press("End");
  await expect(dial).toHaveValue("1023");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int potPin = A0;\nconst int ledPin = 8;\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  if (analogRead(potPin) > 512) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); }\n  delay(20);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByText(/LIT/)).toBeVisible();

  await dial.press("Home");
  await expect(dial).toHaveValue("0");
  await expect(page.getByText(/LIT/)).toBeHidden({ timeout: 3_000 });
  await page.getByTitle("Stop").click();
  expect(errors).toEqual([]);
});

test("LDR light sensor changes analogRead and controls the starter LED", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /LDR Light Sensor.*Sensor/ }).click();

  const sensorVcc = page.getByTitle("LDR sensor VCC");
  const sensorGround = page.getByTitle("LDR sensor GND");
  const sensorOutput = page.getByTitle("LDR sensor AO");
  const analogA0 = page.locator('[data-terminal-id$="-A0"]');
  const boardGround = page.locator('[data-terminal-id$="-GND-1"]');
  const boardFiveVolt = page.locator('[data-terminal-id$="-5V"]').first();
  await sensorVcc.dispatchEvent("click");
  await boardFiveVolt.dispatchEvent("click");
  await sensorGround.dispatchEvent("click");
  await boardGround.dispatchEvent("click");
  await sensorOutput.dispatchEvent("click");
  await analogA0.dispatchEvent("click");

  const light = page.getByRole("slider", { name: "LDR light level", exact: true });
  await light.press("Home");
  await expect(light).toHaveValue("0");
  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int lightPin = A0;\nconst int ledPin = 8;\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  if (analogRead(lightPin) < 400) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); }\n  delay(20);\n}");

  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByText(/LIT/)).toBeVisible();
  await light.press("End");
  await expect(light).toHaveValue("100");
  await expect(page.getByText(/LIT/)).toBeHidden({ timeout: 3_000 });
  await page.getByTitle("Stop").click();
  expect(errors).toEqual([]);
});

test("RGB LED independently displays its digital red, green, and blue channels", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /RGB LED.*3 channels/ }).click();

  const red = page.getByTitle("RGB LED red channel");
  const green = page.getByTitle("RGB LED green channel");
  const blue = page.getByTitle("RGB LED blue channel");
  const common = page.getByTitle("RGB LED common cathode");
  const d9 = page.locator('[data-terminal-id$="-D9"]');
  const d10 = page.locator('[data-terminal-id$="-D10"]');
  const d11 = page.locator('[data-terminal-id$="-D11"]');
  const ground = page.locator('[data-terminal-id$="-GND-1"]');
  await red.dispatchEvent("click");
  await d9.dispatchEvent("click");
  await green.dispatchEvent("click");
  await d10.dispatchEvent("click");
  await blue.dispatchEvent("click");
  await d11.dispatchEvent("click");
  await common.dispatchEvent("click");
  await ground.dispatchEvent("click");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int redPin = 9;\nconst int greenPin = 10;\nconst int bluePin = 11;\nvoid setup() { pinMode(redPin, OUTPUT); pinMode(greenPin, OUTPUT); pinMode(bluePin, OUTPUT); }\nvoid loop() {\n  digitalWrite(redPin, HIGH); digitalWrite(greenPin, LOW); digitalWrite(bluePin, LOW); delay(300);\n  digitalWrite(redPin, LOW); digitalWrite(greenPin, HIGH); digitalWrite(bluePin, LOW); delay(300);\n  digitalWrite(redPin, LOW); digitalWrite(greenPin, LOW); digitalWrite(bluePin, HIGH); delay(300);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByTitle("RGB LED: R")).toBeVisible();
  await expect(page.getByTitle("RGB LED: G")).toBeVisible({ timeout: 2_000 });
  await expect(page.getByTitle("RGB LED: B")).toBeVisible({ timeout: 2_000 });
  await page.getByTitle("Stop").click();
  expect(errors).toEqual([]);
});

test("7-segment display shows digits from separate wired digital output pins", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /7-Segment Display.*8 outputs/ }).click();

  for (const [index, label] of ["A", "B", "C", "D", "E", "F", "G", "DP"].entries()) {
    await page.getByTitle(label === "DP" ? "7-segment decimal point" : `7-segment segment ${label}`).dispatchEvent("click");
    await page.locator(`[data-terminal-id$="-D${index + 2}"]`).dispatchEvent("click");
  }
  const ground = page.locator('[data-terminal-id$="-GND-1"]');
  await page.getByTitle("7-segment COM1 common cathode").dispatchEvent("click");
  await ground.dispatchEvent("click");
  await page.getByTitle("7-segment COM2 common cathode").dispatchEvent("click");
  await ground.dispatchEvent("click");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int a = 2; const int b = 3; const int c = 4; const int d = 5; const int e = 6; const int f = 7; const int g = 8; const int dp = 9;\nvoid setup() { pinMode(a, OUTPUT); pinMode(b, OUTPUT); pinMode(c, OUTPUT); pinMode(d, OUTPUT); pinMode(e, OUTPUT); pinMode(f, OUTPUT); pinMode(g, OUTPUT); pinMode(dp, OUTPUT); }\nvoid loop() {\n  digitalWrite(a, HIGH); digitalWrite(b, HIGH); digitalWrite(c, LOW); digitalWrite(d, HIGH); digitalWrite(e, HIGH); digitalWrite(f, LOW); digitalWrite(g, HIGH); digitalWrite(dp, LOW); delay(300);\n  digitalWrite(a, HIGH); digitalWrite(b, HIGH); digitalWrite(c, HIGH); digitalWrite(d, HIGH); digitalWrite(e, LOW); digitalWrite(f, LOW); digitalWrite(g, HIGH); digitalWrite(dp, LOW); delay(300);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByTitle("7-segment display: 2")).toBeVisible();
  await expect(page.getByTitle("7-segment display: 3")).toBeVisible({ timeout: 2_000 });
  await page.getByTitle("Stop").click();
  expect(errors).toEqual([]);
});

test("beginner project dropdown loads each full circuit, configuration, and sketch", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  const selector = page.getByRole("combobox", { name: "Choose a beginner project" });
  await expect(selector.locator("option")).toHaveCount(16); // placeholder plus fifteen projects
  const projects = [
    { id: "blink-led", name: "01 · Blink one LED", focus: "RED LED", code: "const int ledPin = 8;" },
    { id: "traffic-light", name: "02 · Traffic-light sequence", focus: "RED LED", code: "const int redPin = 8;" },
    { id: "button-lamp", name: "03 · Press-to-light button", focus: "Pushbutton", code: "const int buttonPin = 2;" },
    { id: "pot-threshold", name: "04 · Knob threshold indicator", focus: "10kΩ Potentiometer", code: "const int knobPin = A0;" },
    { id: "night-light", name: "05 · Automatic night light", focus: "LDR Light Sensor", code: "const int lightPin = A0;" },
    { id: "rgb-signal", name: "06 · RGB color signal", focus: "RGB LED", code: "const int redPin = 9;" },
    { id: "seven-segment", name: "07 · Display digits 2 and 3", focus: "7-Segment Display", code: "const int segA = 2;" },
    { id: "button-buzzer", name: "08 · Button-operated buzzer", focus: "Pushbutton", code: "const int buttonPin = 2;" },
    { id: "serial-heartbeat", name: "09 · Serial heartbeat", focus: "Arduino Uno R3", code: "Serial.begin(9600);" },
    { id: "room-status", name: "10 · Room-status indicator", focus: "LDR Light Sensor", code: "const int lightPin = A0;" },
    { id: "switch-joystick-pwm", name: "11 · Switch + joystick PWM color mixer", focus: "XY Joystick Module", code: "const int enablePin = 3;" },
    { id: "joystick-servo", name: "12 · Joystick Servo Controller", focus: "Micro Servo Motor", code: "#include <Servo.h>" },
    { id: "dc-motor-hbridge", name: "13 · DC Motor Speed + Direction Control", focus: "L298N H-Bridge Driver", code: "const int enablePin = 3;" },
    { id: "pir-motion-light", name: "14 · PIR Motion-Triggered Light", focus: "PIR Motion Sensor", code: "const int motionPin = 2;" },
    { id: "ultrasonic-distance-alarm", name: "15 · Ultrasonic Distance Alarm", focus: "HC-SR04 Ultrasonic Sensor", code: "const int trigPin = 3;" },
  ];

  for (const project of projects) {
    await selector.selectOption(project.id);
    await expect(page.getByRole("button", { name: project.name, exact: true })).toBeVisible();
    await expect(page.getByText(project.focus, { exact: true }).first()).toBeVisible();
    await expect(page.locator(".monaco-editor")).toContainText(project.code);
    await expect(page.getByText(/\d+ components • \d+ wires/).first()).toBeVisible();
    await page.getByRole("button", { name: "Run", exact: false }).click();
    await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
    if (project.id === "switch-joystick-pwm") {
      await expect(page.getByTitle("RGB LED: OFF")).toBeVisible();
      await page.getByRole("button", { name: "Slide switch, OFF" }).click();
      await expect(page.getByTitle("RGB LED: B")).toBeVisible();
      await page.getByTitle("Drag the joystick pad to set X/Y; press its red button; drag the base to move").dispatchEvent("click");
      await page.getByRole("slider", { name: "Joystick X axis" }).press("End");
      await expect(page.getByTitle("RGB LED: R")).toBeVisible();
      await page.getByRole("slider", { name: "Joystick Y axis" }).press("End");
      await expect(page.getByText(/R 100% · G 50% · B 0%/)).toBeVisible();
      const stickButton = page.getByTitle("Hold to press joystick button");
      await stickButton.hover();
      await page.mouse.down();
      await expect(page.getByTitle("RGB LED: R+G+B")).toBeVisible();
      await page.mouse.up();
      await page.getByRole("button", { name: "Slide switch, ON" }).click();
      await expect(page.getByTitle("RGB LED: OFF")).toBeVisible();
    }
    if (project.id === "joystick-servo") {
      await expect(page.getByTitle("Servo motor: 90 degrees, 1500 microseconds at 50 Hz")).toBeVisible();
      await page.getByTitle("Drag the joystick pad to set X/Y; press its red button; drag the base to move").dispatchEvent("click");
      await page.getByRole("slider", { name: "Joystick X axis" }).press("End");
      await expect(page.getByTitle("Servo motor: 180 degrees, 2000 microseconds at 50 Hz")).toBeVisible();
      await page.getByRole("slider", { name: "Joystick X axis" }).press("Home");
      await expect(page.getByTitle("Servo motor: 0 degrees, 1000 microseconds at 50 Hz")).toBeVisible();
      const servoButton = page.getByTitle("Hold to press joystick button");
      await servoButton.hover();
      await page.mouse.down();
      await expect(page.getByTitle("Servo motor: 90 degrees, 1500 microseconds at 50 Hz")).toBeVisible();
      await page.mouse.up();
    }
    if (project.id === "ultrasonic-distance-alarm") {
      const distance = page.getByRole("slider", { name: "Ultrasonic simulated distance (cm)" });
      await expect(page.getByTitle("YELLOW LED: 0% brightness")).toBeVisible();
      await distance.press("Home");
      await expect(page.getByText(/Target distance: 2 cm/)).toBeVisible();
      await expect(page.getByTitle("YELLOW LED: 100% brightness")).toBeVisible({ timeout: 2_000 });
      await distance.press("End");
      await expect(page.getByText(/Target distance: 400 cm/)).toBeVisible();
      await expect(page.getByTitle("YELLOW LED: 0% brightness")).toBeVisible({ timeout: 2_000 });
    }
    if (project.id === "pir-motion-light") {
      await expect(page.getByTitle("GREEN LED: 0% brightness")).toBeVisible();
      await page.getByRole("button", { name: "PIR motion, clear", exact: true }).click();
      await expect(page.getByRole("button", { name: "PIR motion, detected", exact: true })).toBeVisible();
      await expect(page.getByTitle("GREEN LED: 100% brightness")).toBeVisible({ timeout: 2_000 });
      await page.getByRole("button", { name: "PIR motion, detected", exact: true }).click();
      await expect(page.getByTitle("GREEN LED: 0% brightness")).toBeVisible({ timeout: 2_000 });
    }
    if (project.id === "dc-motor-hbridge") {
      await expect(page.getByTitle("DC motor: clockwise at 50% PWM")).toBeVisible();
      await expect(page.getByTitle("DC motor: counterclockwise at 50% PWM")).toBeVisible({ timeout: 2_500 });
    }
    await page.getByRole("button", { name: "Stop", exact: true }).click();
  }
});

test("slide switch latches and changes a pull-up button input", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /Slide Switch.*Latched/ }).click();
  await page.getByTitle("Slide switch terminal A").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-D2"]').dispatchEvent("click");
  await page.getByTitle("Slide switch terminal B").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-GND-1"]').dispatchEvent("click");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int switchPin = 2;\nconst int ledPin = 8;\nvoid setup() { pinMode(switchPin, INPUT_PULLUP); pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  if (digitalRead(switchPin) == LOW) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); }\n  delay(20);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  await expect(page.getByText(/LIT/)).toBeHidden();
  await page.getByRole("button", { name: "Slide switch, OFF" }).click();
  await expect(page.getByRole("button", { name: "Slide switch, ON" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/LIT/)).toBeVisible();
  await page.getByRole("button", { name: "Slide switch, ON" }).click();
  await expect(page.getByText(/LIT/)).toBeHidden({ timeout: 2_000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect(errors).toEqual([]);
});

test("joystick axes and momentary button act as wired analog and digital inputs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /Joystick Module.*3 inputs/ }).click();

  const pin = (label: string) => page.getByTitle(`Joystick ${label}`);
  await pin("VCC").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-5V"]').first().dispatchEvent("click");
  await pin("GND").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-GND-1"]').dispatchEvent("click");
  await pin("VRX").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-A0"]').dispatchEvent("click");
  await pin("VRY").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-A1"]').dispatchEvent("click");
  await pin("SW").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-D2"]').dispatchEvent("click");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int joyX = A0;\nconst int ledPin = 8;\nvoid setup() { pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  if (analogRead(joyX) > 700) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); }\n  delay(20);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  const xAxis = page.getByRole("slider", { name: "Joystick X axis" });
  await xAxis.press("End");
  await expect(xAxis).toHaveValue("1023");
  await expect(page.getByText(/LIT/)).toBeVisible();
  await xAxis.press("Home");
  await expect(page.getByText(/LIT/)).toBeHidden({ timeout: 2_000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("const int buttonPin = 2;\nconst int ledPin = 8;\nvoid setup() { pinMode(buttonPin, INPUT_PULLUP); pinMode(ledPin, OUTPUT); }\nvoid loop() {\n  if (digitalRead(buttonPin) == LOW) { digitalWrite(ledPin, HIGH); } else { digitalWrite(ledPin, LOW); }\n  delay(20);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  const joystickButton = page.getByTitle("Hold to press joystick button");
  await joystickButton.hover();
  await page.mouse.down();
  await expect(page.getByText(/LIT/)).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText(/LIT/)).toBeHidden({ timeout: 2_000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect(errors).toEqual([]);
});

test("analogWrite provides smooth per-channel RGB LED PWM brightness", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("Arduino Sketch")).toBeVisible();
  await page.getByRole("button", { name: /RGB LED.*3 channels/ }).click();

  const channel = (label: string) => page.getByTitle(`RGB LED ${label} channel`);
  await channel("red").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-D9"]').dispatchEvent("click");
  await channel("green").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-D10"]').dispatchEvent("click");
  await channel("blue").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-D11"]').dispatchEvent("click");
  await page.getByTitle("RGB LED common cathode").dispatchEvent("click");
  await page.locator('[data-terminal-id$="-GND-1"]').dispatchEvent("click");

  await page.locator(".monaco-editor .view-line").first().click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("void setup() {}\nvoid loop() {\n  analogWrite(9, 64);\n  analogWrite(10, 128);\n  analogWrite(11, 255);\n  delay(20);\n}");
  await page.getByRole("button", { name: "Run", exact: false }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();
  const rgb = page.getByTitle("RGB LED: R+G+B");
  await expect(rgb).toBeVisible();
  await expect(rgb).toContainText("R 25% · G 50% · B 100%");
  await expect(rgb.locator(":scope > div").first()).toHaveCSS("background-color", "rgb(64, 128, 255)");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  expect(errors).toEqual([]);
});
