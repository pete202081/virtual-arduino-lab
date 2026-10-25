# Virtual Arduino Lab — Beginner’s User Guide

Welcome! This guide walks you through the Virtual Arduino Lab from first opening the app to building, running, saving, and troubleshooting a simple Arduino Blink circuit. You do not need previous electronics or programming experience. Browse the [Project Gallery](/projects) to choose from all 23 guided builds by concept and difficulty; for wiring maps, copy-ready sketches, and extension challenges, follow the [Beginner Project Catalog](BEGINNER_PROJECT_CATALOG.md).

> **What this is:** a local, browser-based learning simulator. It does not connect to a physical Arduino and does not compile a real AVR binary.

## Contents

1. [Start here: run the ready-made Blink project](#1-start-here-run-the-ready-made-blink-project)
2. [Understand the screen](#2-understand-the-screen)
3. [Build the circuit yourself](#3-build-the-circuit-yourself)
4. [How the breadboard behaves](#4-how-the-breadboard-behaves)
5. [Edit the Arduino sketch](#5-edit-the-arduino-sketch)
6. [Run, stop, and reset](#6-run-stop-and-reset)
7. [Read validation, logs, events, and Serial output](#7-read-validation-logs-events-and-serial-output)
8. [Save, open, duplicate, export, and import](#8-save-open-duplicate-export-and-import)
9. [Move, zoom, select, and delete](#9-move-zoom-select-and-delete)
10. [Fix common problems](#10-fix-common-problems)
11. [What the simulator supports—and what it doesn’t](#11-what-the-simulator-supportsand-what-it-doesnt)
12. [Glossary and practice activities](#12-glossary-and-practice-activities)

---

## 1. Start here: run the ready-made Blink project

Open the landing page at `/` and choose **Start building** or **Open the Lab**. On a first visit with no saved project, the simulator loads a ready-made example containing an Arduino Uno, breadboard, LED, 220 Ω resistor, three wires, and the Blink sketch. It is already wired as **D8 → resistor → LED → GND**.

1. Wait for the project to appear on the canvas.
2. In the **Circuit Validation** panel, look for **`[VALID] Circuit looks valid`**.
3. Click **Run** in the top bar.
4. Watch the LED: it should turn on and off according to the sketch’s one-second delays.
5. Click **Stop** to stop the sketch. Click **Reset** to stop it and clear its simulated pin/LED state.

If you have saved projects in this browser, the most recently saved project may load automatically instead. To return to the working example, choose **More → Reset to Blink starter** and confirm.

### Quick electronics idea

A digital output pin can be set **HIGH** or **LOW**. In the Blink sketch, D8 alternates between HIGH and LOW. The LED illuminates only when it has a valid forward path from a HIGH output to GND, with the LED’s anode and cathode connected in the correct direction.

---

## 2. Understand the screen

### Top bar

- **Project title:** click its name to rename it; press Enter or click elsewhere to finish.
- **Beginner projects…:** loads any of twenty-three complete beginner projects, including their components, wiring, sketch, and selected component guidance. Choose **Project gallery** on the landing page to browse them by concept and difficulty. Choosing a project replaces the current workspace; duplicate or save work first if you want to keep it.
- **Quick Add:** opens a compact top-bar picker for frequently used parts. Selecting an item adds it directly to the canvas.
- **New:** creates a blank project after confirmation. It starts with the Blink sketch but no circuit components.
- **Open:** opens a picker for projects saved in this browser.
- **Save:** saves the current project locally.
- **More:** Duplicate project, Export JSON, Import JSON, and Reset to Blink starter.
- **Run / Stop / Reset:** controls the simulation. The status text shows whether it is idle, validating, running, or stopped.
- **Undo / Redo:** visible but not implemented in this MVP.

### Left: Component Library

Browse or search the full component list and choose a category. Use the **Collapse component library** arrow in its header to give the design area more horizontal room; the narrow rail’s **Expand component library** arrow restores it. Interactive items include Arduino Uno R3, breadboard, single LED, RGB LED, 7-segment display, 220 Ω resistor, pushbutton, latched slide switch, joystick module, servo motor, DC motor, H-bridge driver, 5V relay module, potentiometer, LDR sensor, PIR motion sensor, HC-SR04 ultrasonic sensor, TMP36 temperature sensor, buzzer, and jumper-wire tool.

Clicking an available component adds it to the canvas; supported component cards can also be dragged onto the workspace.

### Center: Circuit Workspace

This is the canvas where you place and connect components. It has a grid, wire-color swatches, selection/wire controls, delete, zoom in/out, and a reset-view control. The status strip shows component and wire counts.

### Right: Arduino Sketch

The editor uses C++ syntax highlighting and shows diagnostics. It includes a Blink starter, Reset, Copy, a width toggle, and a collapse arrow; use the narrow right-side rail to expand it again. Collapsing the editor gives the circuit design area more room. Red diagnostics are errors; amber diagnostics are warnings. The simulator applies a stricter supported-code subset when you click Run—see [Edit the Arduino sketch](#5-edit-the-arduino-sketch).

### Bottom: Console

- **Serial Monitor:** output produced by supported `Serial.print()` / `Serial.println()` statements.
- **Simulation Logs:** run, validation, save, import, and error messages.
- **Circuit Validation:** circuit-specific messages such as `VALID`, `OPEN_CIRCUIT`, or `REVERSED_POLARITY`.
- **Simulation Events:** pin changes and other run events.

---

## 3. Build the circuit yourself

The target circuit is:

```text
Arduino D8 ── 220 Ω resistor ── LED anode (A, +)
                                    LED cathode (C, −) ── Arduino GND
```

The 220 Ω resistor limits current in a real circuit. In this simulator the resistor value is recorded, but the engine models it as a conductive connection rather than calculating current or voltage.

### Add components

1. Choose **New** for an empty workspace. Confirm if asked; the Blink sketch remains in the editor.
2. Add **Arduino Uno R3**, **Breadboard 830** (optional for direct wiring, useful for learning), **LED**, and **Resistor 220 Ω** from the left library or Quick Add.
3. Drag components to arrange them. Place the resistor between the Arduino and LED to make the intended path easy to follow.
4. Click the LED or resistor and inspect the **Properties** panel. For an LED, choose a color and note **Anode** and **Cathode**. For a resistor, choose a resistance value.

### Connect the terminals

1. In the canvas toolbar, choose a wire color. Red is convenient for the D8 side; black is convenient for GND.
2. Click the first terminal—for example Arduino **D8**. The canvas shows a pending wire.
3. Click the destination terminal—for example resistor **A**. The wire is created.
4. Repeat for **resistor B → LED A (anode)**.
5. Repeat for **LED C (cathode) → Arduino GND-1** or **GND-2**.
6. Check the **Circuit Validation** tab. A correctly connected hero circuit should report **`VALID`**.

You can also click the **Jumper Wire** card under Wiring to highlight the wiring tool. To cancel a pending connection, use the on-canvas **Cancel** button or click the same starting terminal again. The **Select** button clears wire mode.

> **Important:** components do not electrically connect just because they look close together or overlap on the canvas. Connect their terminals with wires. A visible wire endpoint must land on a terminal.

### Use the breadboard

You can wire directly between components, or connect them through breadboard holes. To route through the breadboard, make wires from component terminals to holes; the wire is drawn on the board’s front surface and its endpoint is centered on the selected hole. Column numbers and A–J row letters help you locate holes. Hover over a hole to enlarge it and show both its simulator ID (such as `T-4-0`) and common coordinate (`A5`); the full connected net is highlighted as well. This is only a visual aid—the graph still applies the board’s internal connectivity rules.

### Adjust a wire route

The lab automatically draws wires as rounded, right-angle routes while keeping their endpoints attached to the chosen terminals. To customize one, click the wire, then drag its circular bend handle on the canvas; the route stays orthogonal as the handle moves. You can also focus the handle and use the arrow keys to nudge it (hold **Shift** for a larger step). The **Wire Properties** panel shows whether the route is automatic or manual. Choose **Reset to auto-route** there to remove your custom bend and let the obstacle-aware router choose a fresh path. Manual bend coordinates are preserved when you save, export, reopen, or import a project.

---

## 4. How the breadboard behaves

The simulated MB-102 breadboard has 30 columns of five-hole groups on each side of the center trench, plus separate power rails.

- The **five holes in one group** are internally connected.
- Different columns are separate unless you add a wire.
- Groups across the **center trench are isolated**. A top-side group does not connect to the opposite-side group automatically.
- Power rails are continuous along their modeled length, but each rail is separate from the terminal strips and from the other rails.
- Rails are not automatically connected to Arduino 5V or GND; add wires where needed.

Think of a connected group as one shared electrical node. A wire from any hole in that group can reach the other holes in the same group.

---

## 5. Edit the Arduino sketch

The default sketch is:

```cpp
const int ledPin = 8;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);

  digitalWrite(ledPin, LOW);
  delay(1000);
}
```

### What each part does

- `const int ledPin = 8;` gives the pin number a readable name.
- `setup()` runs once when the simulation starts.
- `pinMode(ledPin, OUTPUT);` configures D8 as an output.
- `loop()` repeats while the simulation is running.
- `digitalWrite(ledPin, HIGH);` sets the pin high; `LOW` sets it low.
- `delay(1000);` pauses for approximately 1,000 milliseconds (one second).

To edit, click in the code area and type as in a normal code editor. For example, change both `delay(1000)` values to `delay(500)` to request a faster blink. Click **Run** to execute the edited sketch. **Reset** in the editor restores the editor’s Blink code; it does not restore the circuit. **More → Reset to Blink starter** restores both the pre-wired example and its code.

### Supported executable subset

The current safe browser interpreter accepts a bounded subset of `setup()` and `loop()` code:

- `pinMode(pin, OUTPUT)`, `pinMode(pin, INPUT)`, or `pinMode(pin, INPUT_PULLUP)`
- `digitalWrite(pin, HIGH)` and `digitalWrite(pin, LOW)`
- `delay(milliseconds)` and `delayMicroseconds(microseconds)`
- `Serial.begin(baud)`, `Serial.print("text")`, and `Serial.println("text")`
- Braced conditions using `digitalRead(pin) == HIGH|LOW` or `analogRead(A0..A5) <, >, <=, >=, ==, != threshold`
- `tone(pin, frequency[, duration])` and `noTone(pin)` for the passive buzzer
- Simple integer constants such as `const int ledPin = 8;`

Use digital pin numbers **0–13**. A loop must contain a positive delay so the browser can yield safely. Delay calls are limited to 60 seconds each. The interpreter does not run general C++ control flow, loops, custom functions, or arbitrary user code.

### Try the interactive pushbutton

1. Add **Pushbutton** from the left component library. Its four terminals form two sides: `1A` and `1B` are permanently joined; `2A` and `2B` are permanently joined. Pressing bridges the two sides.
2. Wire Arduino **D2** to either `1A` or `1B`, then wire either terminal on the other side (`2A` or `2B`) to **GND**. You can use the direct board pins or breadboard holes.
3. Replace the sketch with this bounded example:

```cpp
const int buttonPin = 2;
const int ledPin = 8;

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (digitalRead(buttonPin) == LOW) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(20);
}
```

4. Click **Run**, then hold the pushbutton’s red cap. The connected LED should turn on while pressed and turn off when released. To move the pushbutton on the canvas, drag its gray base (not the red cap). `INPUT_PULLUP` makes this wiring **active-low**: pressed reads LOW; released reads HIGH. A short positive loop delay lets the simulation poll the switch safely.

### Try the latched slide switch

1. Add **Slide Switch**. Unlike the momentary pushbutton, it stays ON or OFF after you release the slider.
2. Connect terminal **A** to Arduino **D2** and terminal **B** to **GND**.
3. Use `pinMode(2, INPUT_PULLUP)` and a `digitalRead(2)` if/else condition, like the pushbutton example above.
4. Press **Run**, then click the blue slide control on the canvas or use **Toggle ON/OFF** in Properties. Closed/ON connects the input to GND and reads LOW; open/OFF leaves the input pulled HIGH. The position remains set when the simulation stops and is saved with the project.

### Try the joystick module

1. Add **Joystick Module**. Drag the pad on the canvas to move X/Y together, or adjust each axis separately in Properties. The red SW button is momentary.
2. Wire **VCC→5V**, **GND→GND**, **VRX→A0**, **VRY→A1**, and **SW→D2**. Add an LED with a series resistor from D8 to GND.
3. This sketch turns the LED on when the joystick's X reading is to the right of the 700 threshold:

```cpp
const int joyX = A0;
const int ledPin = 8;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (analogRead(joyX) > 700) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(20);
}
```

4. Press **Run** and move the pad or change the X slider. For the button input, set D2 to `INPUT_PULLUP`; while held, SW connects to the module's GND and reads LOW. The axes are idealized 0–1023 values; the lab does not model joystick acceleration, calibration, or coordinate math.

### Try the servo motor

1. Add **Servo Motor** from the Actuators category or Quick Add. Wire **VCC→5V**, **GND→GND**, and **SIG→D9**.
2. Use the bounded Servo API to move the arm between fixed angles:

```cpp
#include <Servo.h>
Servo arm;

void setup() {
  arm.attach(9);
}

void loop() {
  arm.write(0);
  delay(500);
  arm.write(90);
  delay(500);
  arm.write(180);
  delay(500);
}
```

3. Click **Run**. The canvas arm should move to 0°, 90°, and 180°; the label shows the corresponding modeled pulse widths (1,000, 1,500, and 2,000 µs at 50 Hz). For joystick thresholds and a centered-button control, load **12 · Joystick Servo Controller** from the dropdown.

The simulator supports only `Servo name;`, `name.attach(pin)` on D2–D13, and `name.write(angle)` with fixed 0–180° values. This is a visual position/pulse model, not a physical pulse waveform or full Servo library. For a real servo, use a suitable external supply when required and connect grounds together; never power a loaded motor directly from an Uno GPIO pin.

### Try a DC motor with an H-bridge

1. Add **DC Motor** and **H-Bridge Driver** from Actuators or Quick Add. The simulated L298N-style driver has VCC, VM, GND, ENA, IN1, IN2, OUT1, and OUT2 terminals; the motor has M+ and M−.
2. Wire driver VCC and VM to Uno 5V, GND to Uno GND, ENA→D3, IN1→D4, IN2→D5, and OUT1/OUT2 to the motor's two leads. The model requires these connections plus the driver control pins to be present.
3. Run this bounded sketch to rotate in each direction at about 50% modeled speed, then stop: \n
```cpp
const int enablePin = 3;
const int in1Pin = 4;
const int in2Pin = 5;

void setup() {
  pinMode(in1Pin, OUTPUT);
  pinMode(in2Pin, OUTPUT);
}

void loop() {
  analogWrite(enablePin, 128);
  digitalWrite(in1Pin, HIGH);
  digitalWrite(in2Pin, LOW);
  delay(1000);
  digitalWrite(in1Pin, LOW);
  digitalWrite(in2Pin, HIGH);
  delay(1000);
  analogWrite(enablePin, 0);
  digitalWrite(in1Pin, LOW);
  digitalWrite(in2Pin, LOW);
  delay(500);
}
```

IN1 HIGH/IN2 LOW is clockwise; LOW/HIGH is counterclockwise; both LOW coasts and both HIGH brakes. `analogWrite(3, 0..255)` changes the displayed speed. Swapping the motor leads reverses the displayed direction. Load **13 · DC Motor Speed + Direction Control** to inspect a complete prewired example. This visual model does not calculate current, torque, stall, voltage drop, heat, or realistic external motor-supply behavior. Never drive a physical motor directly from an Uno GPIO pin; use a suitable driver and supply, with a shared ground.

### Try a PIR motion sensor

1. Add **PIR Motion Sensor** from the Sensors category or Quick Add. Click its **MOTION CLEAR** control (or use the Properties panel) to toggle simulated motion on and off.
2. Wire **VCC→5V**, **GND→GND**, and **OUT→D2**. Add an LED with its anode through a resistor to D8 and cathode to GND, or load **14 · PIR Motion-Triggered Light** for a complete circuit.
3. Use `digitalRead()` to switch the LED while the simulated PIR output is HIGH:

```cpp
const int motionPin = 2;
const int lampPin = 8;

void setup() {
  pinMode(motionPin, INPUT);
  pinMode(lampPin, OUTPUT);
}

void loop() {
  if (digitalRead(motionPin) == HIGH) {
    digitalWrite(lampPin, HIGH);
  } else {
    digitalWrite(lampPin, LOW);
  }
  delay(20);
}
```

When the model is powered and wired, **MOTION DETECTED** produces HIGH and **MOTION CLEAR** produces LOW. This is a binary learning model only; it does not simulate range, field of view, warm-up time, retrigger/hold timing, ambient conditions, or real PIR electronics. Real sensor modules may have different timing/voltage requirements; check the module datasheet before building hardware.

### Try an HC-SR04 ultrasonic sensor

1. Add **HC-SR04 Ultrasonic Sensor** from Sensors or Quick Add. Its target-distance slider represents a simulated object from 2 to 400 cm; the component also shows the modeled echo pulse duration.
2. Wire **VCC→5V**, **GND→GND**, **TRIG→D3**, and **ECHO→D2**. Connect a yellow LED and 220 Ω resistor from D8 to GND, or load **15 · Ultrasonic Distance Alarm** for the full circuit.
3. The bounded interpreter supports a numeric `pulseIn()` threshold condition. This example lights the LED when the object is closer than about 20 cm (20 cm × 58 µs/cm ≈ 1,160 µs):

```cpp
const int trigPin = 3;
const int echoPin = 2;
const int lampPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(lampPin, OUTPUT);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  if (pulseIn(echoPin, HIGH, 30000) < 1160) {
    digitalWrite(lampPin, HIGH);
  } else {
    digitalWrite(lampPin, LOW);
  }
  delay(50);
}
```

Try moving the distance slider while the sketch runs: 2 cm produces an echo duration near 116 µs, 20 cm near 1,160 µs, and 400 cm near 23,200 µs. The model uses roughly 58 µs per centimeter and requires a HIGH-to-LOW TRIG pulse, powered sensor, and both signal wires. `pulseIn()` is supported only as a bounded numeric threshold inside `if`; variable assignments, arithmetic distance calculations, and arbitrary code remain unsupported. This is not acoustic physics: beam width, propagation, reflections, temperature, sensor tolerance, and real-time echo waveforms are not simulated. Check the hardware datasheet and voltage compatibility before connecting a physical module.

### Try a TMP36 temperature sensor

1. Add **TMP36 Temperature Sensor** from Sensors or Quick Add. Its simulated temperature slider ranges from −40 to 125 °C and shows the modeled output voltage and ADC value.
2. Wire **VCC→5V**, **GND→GND**, and **VOUT→A0**. Connect a red LED through a 220 Ω resistor from D8 to GND, or load **16 · TMP36 Temperature Alarm**.
3. This sketch lights the LED above a fixed threshold of about 30 °C. For the modeled TMP36, 30 °C gives about 800 mV, or ADC 164 on a 5 V, 10-bit Uno:

```cpp
const int tempPin = A0;
const int lampPin = 8;

void setup() {
  pinMode(lampPin, OUTPUT);
}

void loop() {
  if (analogRead(tempPin) > 164) {
    digitalWrite(lampPin, HIGH);
  } else {
    digitalWrite(lampPin, LOW);
  }
  delay(100);
}
```

Try changing the temperature while the sketch runs. The idealized TMP36 relationship is **VOUT ≈ 500 mV + (10 mV × °C)**; at 25 °C, VOUT is about 750 mV (ADC ≈153). The lab models only this slider-to-analog mapping, not sensor calibration, noise, thermal lag, ambient heat transfer, or physical voltage. The restricted sketch language supports fixed `analogRead()` threshold conditions but not general arithmetic or variable assignments.

### Try the active and passive buzzers

1. Add **Buzzer** from the library or Quick Add. Select it and choose **Active** or **Passive** in Properties.
2. Wire buzzer **+** to Arduino **D9** and buzzer **−** to **GND**. A buzzer wired directly to 5V and GND is modeled for active buzzers too.
3. For an **active buzzer**, upload/run a simple HIGH/LOW pattern. It generates a fixed 2,300 Hz tone when powered:

```cpp
const int buzzerPin = 9;
void setup() { pinMode(buzzerPin, OUTPUT); }
void loop() {
  digitalWrite(buzzerPin, HIGH);
  delay(250);
  digitalWrite(buzzerPin, LOW);
  delay(750);
}
```

4. For a **passive buzzer**, use `tone()` to set pitches and `noTone()` to silence it:

```cpp
const int buzzerPin = 9;
void setup() { }
void loop() {
  tone(buzzerPin, 440);
  delay(300);
  tone(buzzerPin, 660);
  delay(300);
  noTone(buzzerPin);
  delay(400);
}
```

The browser generates a quiet square-wave sound and shows a visual buzzing indicator. Audio can depend on browser/system sound settings; if audio is blocked, the visual state still updates. Click **Stop** or **Reset** to silence it.

### Try the potentiometer analog input

1. Add the **Potentiometer 10kΩ** component. Its range control sets a simulated ADC value from **0 to 1023**.
2. Wire potentiometer **GND → Arduino GND**, potentiometer **5V → Arduino 5V**, and potentiometer **WIPER → A0**.
3. This sketch turns the starter LED on when the wiper value is above the midpoint. Move the potentiometer slider while the sketch is running:

```cpp
const int potPin = A0;
const int ledPin = 8;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (analogRead(potPin) > 512) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(20);
}
```

The interpreter supports only direct, braced `if` conditions that compare `analogRead(A0..A5)` to a numeric threshold. It does not support storing the reading in a variable, arbitrary C++ expressions, or other general control flow. The potentiometer is an idealized input source—not a full voltage/current model.

### Try the LDR light sensor

1. Add **LDR Light Sensor** from the Sensors category. The component has a **Light level** slider: 0% (dark) maps to ADC 0, and 100% (bright) maps to ADC 1023.
2. Wire **VCC → 5V**, **GND → GND**, and **AO → A0**.
3. This sketch turns the starter LED on when the simulated environment is dark. Move the light slider while the simulation is running:

```cpp
const int lightPin = A0;
const int ledPin = 8;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (analogRead(lightPin) < 400) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(20);
}
```

This is an idealized three-pin sensor module, not a bare photoresistor. The slider directly sets its analog reading; the lab does not calculate a physical LDR/resistor voltage divider.

### Try the RGB LED

1. Add **RGB LED** and connect its **COMMON** terminal to GND.
2. Connect **R → D9**, **G → D10**, and **B → D11**. Put a current-limiting resistor in series with each channel when building a real circuit.
3. Set each digital pin as an output and switch the channels HIGH/LOW. For example:

```cpp
const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
}

void loop() {
  digitalWrite(redPin, HIGH);
  digitalWrite(greenPin, LOW);
  digitalWrite(bluePin, LOW);
  delay(300);
  digitalWrite(redPin, LOW);
  digitalWrite(greenPin, HIGH);
  digitalWrite(bluePin, LOW);
  delay(300);
  digitalWrite(redPin, LOW);
  digitalWrite(greenPin, LOW);
  digitalWrite(bluePin, HIGH);
  delay(300);
}
```

The display mixes channel on/off states (red, green, blue, yellow, cyan, magenta, white). For smooth brightness and color mixing, wire the RGB R/G/B channels to PWM pins D9/D10/D11 and use `analogWrite(pin, value)` on Uno PWM pins D3, D5, D6, D9, D10, or D11 with a constant duty value from 0 to 255. The lab displays duty as visual brightness; it does not simulate PWM frequency or electrical waveforms.

```cpp
void setup() {}

void loop() {
  analogWrite(9, 64);  // red: about 25%
  analogWrite(10, 128); // green: about 50%
  analogWrite(11, 255); // blue: full brightness
  delay(20);
}
```

A servo is not controlled by `analogWrite()` here. Servo positioning uses the separate restricted Servo model described below.

### Try the 7-segment display

1. Add the single-digit common-cathode **7-Segment Display**.
2. Connect both **COM1** and **COM2** to GND. Connect each segment through its own current-limiting resistor (including DP if you use it).
3. Wire **A→D2, B→D3, C→D4, D→D5, E→D6, F→D7, G→D8**, and optional **DP→D9**. A is the top bar; B/C are the upper/lower right bars; D is bottom; E/F are lower/upper left; G is the middle bar.
4. Set those pins to OUTPUT, then set each segment pin HIGH to light it and LOW to turn it off. For example, the pattern for digit 2 is A, B, D, E, and G on; C and F off:

```cpp
const int segA = 2;
const int segB = 3;
const int segC = 4;
const int segD = 5;
const int segE = 6;
const int segF = 7;
const int segG = 8;
const int segDP = 9;

void setup() {
  pinMode(segA, OUTPUT);
  pinMode(segB, OUTPUT);
  pinMode(segC, OUTPUT);
  pinMode(segD, OUTPUT);
  pinMode(segE, OUTPUT);
  pinMode(segF, OUTPUT);
  pinMode(segG, OUTPUT);
  pinMode(segDP, OUTPUT);
}

void loop() {
  digitalWrite(segA, HIGH);
  digitalWrite(segB, HIGH);
  digitalWrite(segC, LOW);
  digitalWrite(segD, HIGH);
  digitalWrite(segE, HIGH);
  digitalWrite(segF, LOW);
  digitalWrite(segG, HIGH);
  digitalWrite(segDP, LOW);
  delay(1000);
}
```

The lab lights segments independently and recognizes the standard 0–9 patterns visually. It does not include a decoder chip, multiplexing, or PWM dimming; each channel is simply on/off. In a real circuit, use a current-limiting resistor per segment and confirm the pinout for your exact display.

This is **not** a full Arduino C++ compiler. General `for`/`while` loops, standalone analog-read assignments, interrupts, custom functions, and many other APIs are not executable. PWM is limited to `analogWrite(pin, value)` on Uno pins D3, D5, D6, D9, D10, and D11 with constant values from 0 to 255. The restricted Servo `attach()`/`write()` API displays fixed angles and modeled pulse metadata, but does not generate an AVR waveform. The supported passive-buzzer calls are bounded `tone(pin, frequency[, duration])` and `noTone(pin)` with numeric constants; unsupported code may produce an adapter error even if the editor’s initial syntax check looks okay. Check the line-numbered diagnostics.

---

## 6. Run, stop, and reset

1. Confirm the code has no errors in the editor.
2. Check circuit validation. Circuit warnings are shown in the logs; an invalid LED path will leave the LED dark even though the code may run.
3. Click **Run**. The top-bar status moves through validation/compile and then **RUNNING**.
4. Observe the LED and check **Simulation Events** for messages such as `D8 → HIGH` and `D8 → LOW`.
5. Click **Stop** to cancel the active simulation timers and turn the LED off.
6. Click **Reset** to stop and clear simulated runtime state. Reset does **not** delete or rewire the circuit, change the sketch, or restore the Blink example.

If Run rejects the sketch, read the **Simulation Logs** and the editor’s line diagnostics. No unsupported sketch code is executed.

---

## 7. Read validation, logs, events, and Serial output

### Circuit Validation

This tab checks the circuit graph, not just the appearance of wires. Common codes include:

- **`VALID`** — the D8 → resistor → LED → GND path is recognized.
- **`MISSING_BOARD`** — add an Arduino Uno.
- **`OPEN_CIRCUIT`** — the LED has no complete connection.
- **`ANODE_NOT_TO_D8`** — connect the LED anode through the resistor to D8.
- **`CATHODE_NOT_TO_GND`** — connect the cathode to GND.
- **`REVERSED_POLARITY`** — the LED is facing the wrong way; swap the anode/cathode connections.
- **`MISSING_RESISTOR`** — a warning that the hero circuit should include a resistor.
- **`SHORT_CIRCUIT`** — the LED terminals ended up on the same graph net.
- **`WRONG_PIN`** — wiring pin and sketch pin may not match.

Select the message and follow its help text. A warning is not always a run blocker; errors indicate a circuit problem that needs attention.

### Simulation Logs and Events

Logs explain validation, adapter errors, save/import actions, and simulation activity. Events show pin changes and state messages. Use **Clear** to clear the visible console log; it does not change the project or circuit.

### Serial Monitor

The Serial Monitor displays text emitted by executed `Serial.print()` or `Serial.println()` statements. `Serial.begin(9600)` sets the displayed baud rate. The monitor does not invent output—the sketch must run and actually print it.

---

## 8. Save, open, duplicate, export, and import

### Save and Open

- Click **Save**. A log entry reports whether the project was saved to IndexedDB or the localStorage fallback.
- Click **Open** to choose among saved projects in the current browser. The picker shows the project name, save date, component count, and wire count.
- The app restores the most recently saved project automatically when it opens, if one is available.

### Duplicate

Choose **More → Duplicate project**. The lab creates a separately named copy and saves it locally. Use this before experimenting if you want to keep the original project intact.

### Export and Import

- **More → Export JSON…** downloads a portable `.valab.json` file.
- **More → Import JSON…** selects a project file. A successful import replaces the current workspace only after validation.
- Invalid, oversized, or unsupported-schema files are rejected with an explanation. An import failure does not replace the current circuit.
- Imported projects are not automatically saved to browser storage; click **Save** after importing if you want them in the Open list.

Projects are stored in the browser, not in a cloud account. Browser cleanup can remove local data, so export important projects as backups. Runtime states, pin states, and logs are not saved as project content.

---

## 9. Move, zoom, select, and delete

- **Move:** drag a component on the canvas. Wires refer to terminal IDs, so moving a component does not break its logical connections.
- **Select:** click a component or wire to view its properties. Click **Select** to leave a pending wire operation.
- **Delete:** select an item, then use the canvas **Delete** button or the Properties panel’s delete action. Deleting a component also removes its attached wires.
- **Rotate:** select a component and use **Rotate 90°** in Properties where available.
- **Zoom:** use the plus/minus controls or hold **Ctrl** while scrolling.
- **Pan:** drag an empty part of the canvas with the left mouse button to move the whole workspace in any direction. You can also use **Alt+drag** or the middle mouse button.
- **Reset view:** use the fit/reset-view canvas button to restore the default pan and zoom.
- **Grid:** toggle the grid button in the canvas toolbar.
- **Wire color:** choose a color before beginning a wire; new wires use that color.

### Undo and Redo

Use the top-bar **Undo** and **Redo** buttons, or press **Ctrl+Z / Cmd+Z** and **Ctrl+Shift+Z / Cmd+Shift+Z**. **Ctrl+Y** also redoes an action on Windows/Linux. History covers circuit edits such as adding, moving, rotating, and deleting components; adding or deleting wires; and changing component or wire properties, including manual wire routes. Dragging a component or wire bend is grouped as one action. The editor’s own undo handles sketch changes separately, and sensor/simulation input adjustments are not included in circuit history. History keeps up to 100 edits and clears when you open, import, duplicate, create, or load a different project.

---

## 10. Fix common problems

### “The LED does not light”

1. Check that the circuit passes validation.
2. Confirm the sketch sets the pin you wired—default is D8—and configures it as `OUTPUT`.
3. Check the complete path: D8 → resistor → **A/anode**; **C/cathode** → GND.
4. Confirm a breadboard route uses holes on the intended five-hole group; do not assume the center trench or power rails are connected to other groups.
5. Inspect Simulation Events. If D8 changes but the LED is dark, the graph does not see a forward-biased LED path.

### “Run was rejected” or the LED stops at compile/adapter

- Look at the line number in the editor and **Simulation Logs**.
- Make sure `void setup()` and `void loop()` exist and braces match.
- Remove unsupported statements or APIs. Only a bounded `if (digitalRead(pin) == HIGH|LOW)` with braced branches is supported; general loops (`for`, `while`) and other C++ control flow are not.
- A line may pass the editor’s live syntax check but still be outside the M4 interpreter subset. The Run-time adapter message is the final check.

### “I clicked a pin but the wire is not finished”

Click a second, different terminal to complete the wire. Use **Cancel** to abandon a pending wire. Clicking the same start terminal cancels it too.

### “I cannot find my project”

Open lists projects saved in this browser profile. If browser storage was cleared, use the `.valab.json` export you saved earlier. Imported files are not automatically added to the saved-project list until you click **Save**.

### “The pushbutton input seems inverted”

That is expected with `INPUT_PULLUP`: a released button reads HIGH and a pressed button reads LOW. Check that one side of the button is wired to D2 and the opposite side is wired to GND, then use the LOW condition for the pressed state.

### “The buzzer is silent”

Check that the component is set to the right type and is wired with **+** to the sketch’s output pin and **−** to GND. Active buzzers sound at a fixed pitch when powered; passive buzzers need a supported `tone()` command. Check that your browser and system audio are not muted. The visual buzzing indicator should still appear when the circuit is active.

---

## 11. What the simulator supports—and what it doesn’t

The lab is designed for learning basic circuit connectivity and the Blink experiment. It uses a graph model for wires and breadboard holes and a limited interpreter for supported code.

It is not a native compiler, full Arduino board emulator, or SPICE engine. Delays use browser timers and can be approximate, especially in background tabs. The graph treats resistors as conductive pass-throughs; it does not calculate resistance, current, voltage drops, heat, or LED damage. Pushbuttons and joystick SW support momentary inputs, while the slide switch latches open/closed; all can be read with the documented bounded `digitalRead` conditions. Potentiometer, LDR, and joystick axes provide idealized analogRead values for threshold conditions, not physical analog voltage/current analysis. Active/passive buzzers use a simple browser-generated square-wave audio model; this is not a physical sound-pressure or waveform simulation. PWM duty is shown as average visual LED brightness; the H-bridge motor is an idealized direction/speed animation only, with no current, torque, stall, voltage-drop, thermal, or real supply model. Never drive a physical motor from an Uno GPIO. The PIR sensor is a user-toggleable binary HIGH/LOW input, not a physical sensing or timing simulation. The TMP36 model maps a temperature slider to an idealized analog output (500 mV at 0 °C, plus 10 mV/°C), but does not simulate thermal response, calibration, noise, or real voltage. The HC-SR04 model maps the 2–400 cm slider to an approximate 58 µs/cm echo and recognizes a bounded `pulseIn()` threshold only after a trigger pulse; it does not simulate acoustic propagation, echoes, beam shape, temperature, tolerances, or waveforms. Servo angles are mapped to a 1,000–2,000 µs pulse display at 50 Hz, but actual waveform timing and electrical behavior are not simulated. Interrupts are not simulated. Use the simulator as a learning aid, not as a substitute for checking a real physical circuit safely.

---

## 12. Glossary and practice activities

### Glossary

- **Anode (A, +):** LED’s positive terminal; shown as the long leg.
- **Cathode (C, −):** LED’s negative terminal; shown as the short/flat-side leg.
- **Digital pin:** Arduino pin that can be set HIGH or LOW in the supported simulation.
- **GND:** ground/reference connection and the return path in this example.
- **Net:** terminals the circuit graph considers electrically connected.
- **Breadboard strip:** a group of five holes internally connected on one side of the trench.
- **Sketch:** the Arduino program shown in the editor.
- **Baud rate:** the configured serial communication rate shown by the Serial Monitor.

### Project 19: Three-Level LED Dimmer

Load **19 · Three-Level LED Dimmer** from the project selector or gallery. It uses an Uno, breadboard, potentiometer, green LED, and a 220 Ω series resistor. The potentiometer’s 5V, GND, and WIPER connect to Uno 5V, GND, and A0. The LED branch runs from D9 through one five-hole breadboard strip, the resistor, and LED anode; the cathode returns through the breadboard ground rail. Move the knob to see three modeled output levels: off at values up to 350, medium brightness (PWM duty 128) above 350 through 700, and full brightness (255) above 700. This introduces analog input thresholds and a PWM output together; the lab displays duty as visual brightness, not an electrical PWM waveform.

### Project 20: Two-Branch Breadboard Challenge

Load **20 · Two-Branch Breadboard Challenge** from the selector or gallery. Two LEDs use separate five-hole strips and their own 220 Ω resistors, while the bottom ground rail is explicitly shared. The red LED blinks independently from D8; a pushbutton connects the D2 `INPUT_PULLUP` input to ground and controls the green LED on D9. Hold the red button cap to light green, then release it. Hover over the D8 and D9 breadboard strips to see that each branch is electrically separate; nearby columns are not automatically connected.

### Project 21: Armed PIR Alarm

Load **21 · Armed PIR Alarm** from the project selector or gallery. Turn the slide switch ON to arm it; the switch connects D2 to GND, so `INPUT_PULLUP` reads LOW. When the PIR's simulated motion state is HIGH while armed, the red LED lights and the passive buzzer sounds. Switch OFF to silence and disarm, even if motion remains detected. This extends the PIR light example by adding an arm condition and sound. The PIR control is a manually toggled binary model, not a real security sensor or alarm system.

### Project 22: Distance-Zone Parking Assistant

Load **22 · Distance-Zone Parking Assistant**. The HC-SR04 distance control selects three feedback zones: near (under 15 cm) shows red with an 880 Hz tone; medium (15–40 cm) shows yellow with a 440 Hz tone; far (40 cm or more) shows green and stays silent. Move the simulated-distance slider to test each zone. This extends the existing one-threshold distance alarm; the model uses an idealized distance-to-echo-duration mapping and does not model real acoustic behavior.

### Project 23: Temperature-Controlled Fan

Load **23 · Temperature-Controlled Fan**. The TMP36's simulated temperature changes its analog reading at A0. The sketch stops the fan at readings of 140 or less (roughly 18 °C and cooler), uses 50% PWM between the thresholds, and commands full PWM above 185 (roughly 41 °C and hotter). The H-bridge receives its enable signal on D3 and direction signals on D4/D5; its outputs drive the modeled DC motor. Adjust the sensor's temperature slider to try cool, room-temperature, and hot conditions. The motor is a visual direction/speed model, not a real fan or power circuit. For physical hardware, follow the sensor and driver datasheets and use a suitably rated motor supply; never power a motor from an Uno GPIO.

### Try these safe learning changes

1. Change both Blink delays from `1000` to `500`; Run and compare the faster blink.
2. Change the LED’s displayed color using the Properties panel; the electrical path stays the same.
3. Reverse the LED’s two terminal connections and watch validation report reversed polarity; then fix it.
4. Delete one wire, check the validation message, and reconnect it.
5. Export a copy before experimenting, then import it to restore your saved version.

Have fun experimenting—and remember: a correct-looking drawing is not enough; the graph must contain a complete, correctly oriented electrical path.
