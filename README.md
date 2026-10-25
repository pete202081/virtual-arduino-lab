# Virtual Arduino Lab

A local-first beginner circuit workspace built with Next.js, TypeScript, Tailwind CSS, and Monaco. The default project is a **pre-wired Blink LED** circuit: Arduino D8 → 220 Ω resistor → LED anode → LED cathode → Arduino GND. The Blink sketch executes through a bounded, safe browser-side simulation adapter. Use the top-bar **Beginner projects…** dropdown to load any of seventeen complete, ready-to-run learning circuits with their wiring, components, properties, and matching sketches.

**New to the lab?** Follow the [Beginner User Guide](USER_GUIDE_BEGINNER.md) for workspace and wiring basics, then build the sequenced projects in the [Beginner Project Catalog](BEGINNER_PROJECT_CATALOG.md). The catalog includes components, wiring maps, copy-ready sketches, and extension challenges for all seventeen projects.

## Requirements

- Node.js 20 or newer (developed and verified with Node 20.20.2)
- npm 10 or newer
- A desktop browser; Chromium is used for the automated end-to-end tests

## Windows PowerShell — install, run, verify

```powershell
cd virtual-arduino-lab
npm ci
npm run dev
```

Open `http://localhost:3000`. The starter project should show **Circuit looks valid**. Click **Run** to see the connected LED blink according to the sketch’s 1-second delays; use **Stop** or **Reset** to end it.

Run the release checks from a second PowerShell window:

```powershell
cd virtual-arduino-lab
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

`npm run test:e2e` builds the production app, starts it on port 3100, and runs Playwright Chromium journeys for project management, components, sensors, inputs, and all seventeen beginner presets. On Linux CI machines, install Playwright’s OS libraries with `npx playwright install-deps chromium` before the first run. The app itself does not require Chromium specifically.

## Project actions

- **Save** stores projects in browser IndexedDB; localStorage is used if IndexedDB is unavailable.
- **Open** shows saved projects in this browser. Use **Export JSON…** for a portable backup or **Import JSON…** to restore one.
- **Duplicate project** creates a separately saved copy.
- **Reset to Blink starter** restores the pre-wired example; **New** creates a blank project.
- Imports are version-checked, limited to 5 MB, validated for component/wire references, and rejected safely if malformed. Project files contain no executable JavaScript.

## Verification suites

- `tests/circuit-graph.test.ts` — 14 graph, breadboard, and validation tests
- `tests/sketch-validator.test.ts` — 12 editor/compile-diagnostic tests
- `tests/simulation-adapter.test.ts` — 29 interpreter, timing, stop, PWM, Servo, DC motor/H-bridge, PIR, HC-SR04, TMP36, relay, LED-path, pushbutton, slide-switch, joystick, buzzer, analog sensor, RGB LED, and 7-segment tests
- `tests/project-persistence.test.ts` — 11 schema, migration, safety, and fallback tests
- `tests/beginner-project-templates.test.ts` — 17 ready-to-load project compile, wiring-reference, focus, and fresh-ID checks
- `e2e/release-journey.spec.ts` — 12 browser journeys covering core components, PWM RGB brightness, joystick and slide-switch behavior, PIR-triggered LED behavior, HC-SR04 distance thresholds, TMP36 temperature thresholds, relay-controlled load switching, and selecting/running all seventeen beginner projects from the dropdown

Current verified status: all 83 unit checks pass, all 12 end-to-end tests pass, ESLint passes, and the Next.js production build passes. The dependency audit found zero vulnerabilities; no dependencies were added for the interactive components, sensors, PWM, Servo, DC motor/H-bridge, HC-SR04, or TMP36 and relay features.

## Implemented simulation subset and limitations

The M4 interpreter accepts a bounded subset of `setup()`/`loop()` statements using `pinMode`, `digitalWrite`, bounded `analogWrite` on Uno PWM pins D3, D5, D6, D9, D10, and D11 with constant duty values 0–255, `delay`, `delayMicroseconds`, `Serial.begin`, `Serial.print`, and `Serial.println`, plus braced `if` conditions for digital `digitalRead(pin) == HIGH|LOW`, analog `analogRead(A0..A5) > threshold` comparisons, and `tone(pin, frequency[, duration])` / `noTone(pin)` with numeric constants. Servo support is limited to `Servo name;`, `name.attach(pin)` on D2–D13, and `name.write(angle)` for constant 0°–180° positions. A wired L298N-style H-bridge model uses digital IN1/IN2 direction and ENA PWM to show a brushed DC motor rotating, coasting, or braking; it does not simulate current, torque, stall, voltage drop, heat, or realistic external-supply behavior. The PIR component is a binary, user-toggleable motion signal (HIGH when motion is simulated, LOW when clear) and requires modeled VCC, GND, and OUT wiring; it does not model real sensor electronics, field of view, warm-up, or retrigger timing. The HC-SR04-style component provides a distance slider (2–400 cm) and modeled echo duration at 58 µs/cm; the safe interpreter accepts `pulseIn(echoPin, HIGH[, timeout])` only inside numeric threshold `if` conditions, after a modeled TRIG HIGH-to-LOW pulse. It does not simulate acoustic propagation or physical echo waveforms. A powered active-low relay module energizes on a wired OUTPUT LOW and switches COM–NO; released state connects COM–NC. Only ideal low-voltage contact logic is modeled—not coil current, electrical isolation, contact ratings, arcing, transients, or mains safety. Never use the simulator to design or assess mains circuits. The TMP36 model maps a temperature slider from −40 to 125 °C to an idealized analog output (500 mV at 0 °C, 10 mV/°C), without thermal response, calibration, noise, or ambient heat transfer. Never connect a physical motor directly to an Uno GPIO pin. It does **not** evaluate arbitrary C++ or produce an AVR binary; unsupported control flow/APIs are rejected. The four-terminal pushbutton models a momentary bridge while held; the latched slide switch bridges its two contacts until toggled off. With `INPUT_PULLUP`, an open switch reads HIGH and a closed switch wired to GND reads LOW. Active buzzers sound at a fixed modeled pitch when powered; passive buzzers sound at the frequency requested by `tone()`. The 10kΩ potentiometer, three-pin LDR, and two-axis joystick map their controls to wired analog input values from 0 to 1023; joystick SW is a momentary active-low button. These are idealized sensor values, not voltage-divider or current calculations. The common-cathode RGB LED responds to independent digital outputs or modeled 0–255 PWM duty on each channel, enabling smooth visual brightness and color mixing; PWM frequency and electrical waveforms are not simulated. A common-cathode single-digit 7-segment display lights A–G and DP independently from digital output pins and recognizes digits 0–9 visually; multiplexing, PWM, and decoder chips are not modeled. Browser audio is synthesized with a low-volume square wave, while browser timers are approximate, particularly in background tabs. There is no general analog/SPICE/current-voltage simulation or interrupt simulation. Servo positions map to a displayed 1,000–2,000 µs command at 50 Hz; the lab does not generate an AVR pulse waveform, and `analogWrite()` PWM is not a servo-control signal. Resistor values are stored and validated as circuit components, but the connectivity graph treats each resistor as an ideal conductive pass-through.

Projects stay in the browser unless the user explicitly exports a JSON file. Browser storage may be cleared; export important projects for backup.

## Build output

```powershell
npm run build
npm start
```

Production server listens on port 3000 by default. For phase-by-phase implementation notes, see `MILESTONE_1_REPORT.md` through `MILESTONE_6_REPORT.md`.
