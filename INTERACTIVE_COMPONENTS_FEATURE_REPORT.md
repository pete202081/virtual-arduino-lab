# Interactive Components Feature Report

## Pushbutton

- Four-terminal, normally-open momentary switch is available in the component library and Quick Add.
- The two legs on each side are permanently connected; holding the red cap bridges the sides. Drag the gray base to move it.
- A bounded `digitalRead` conditional and input-pullup model support the common D2-to-GND button circuit.

## Latched slide switch

- Added a two-terminal SPST slide switch. Clicking the blue control toggles and latches its contact open or closed; the gray base remains draggable.
- A closed switch electrically bridges A–B in the circuit graph, so it works with `INPUT_PULLUP`: open reads HIGH, closed to GND reads LOW.
- The ON state is stored in component properties and persists with project save/open. The Properties panel can toggle it too.

## Active and passive buzzers

- Choose **Active** or **Passive** in the Buzzer Properties panel.
- Active buzzers sound at a fixed 2,300 Hz modeled pitch when powered; passive buzzers respond to bounded `tone(pin, frequency[, duration])` and `noTone(pin)` calls.
- Audio is a low-volume browser-generated square wave with a visual indicator; browser/system settings may mute it.
- Stop, Reset, project load, or unmount cancels tones and releases audio nodes.

## Joystick module

- Added a five-terminal joystick with interactive X/Y axes (0–1023) and a momentary SW button.
- VRX and VRY support wired `analogRead()` values when the module is powered; SW connects internally to GND while pressed and reads LOW with `INPUT_PULLUP`.
- Drag the canvas pad or use Properties sliders; projects persist both axis positions. Axis response is idealized; no calibration, acceleration, or coordinate math is modeled.

## Servo motor

- Added a 3-terminal servo component (VCC/GND/SIG) with a visual arm, angle label, and modeled pulse width.
- The safe subset accepts `Servo name;`, `name.attach(pin)` on D2–D13, and `name.write(angle)` for fixed 0°–180° positions.
- Position maps to 1,000–2,000 µs pulse metadata at a modeled 50 Hz refresh. The simulator animates the arm; it does not generate an AVR waveform or execute arbitrary Servo-library code.
- Added the Joystick Servo Controller dropdown project with threshold positions and SW-to-center control.

## Potentiometer and LDR

- The 10kΩ potentiometer has GND, 5V, and WIPER terminals; its slider maps a wired analog input to 0–1023.
- The three-pin LDR module has VCC, GND, and AO terminals. Its light slider maps dark (0%) to ADC 0 and bright (100%) to ADC 1023.
- Both support the bounded analogRead threshold condition. Sensor readings are idealized values, not circuit-voltage calculations.

## PWM and RGB LED

- Added bounded `analogWrite(pin, value)` support for Arduino Uno PWM pins D3, D5, D6, D9, D10, and D11, with compile-time constant duty values from 0 to 255.
- Single LEDs show PWM brightness and common-cathode RGB channels mix independently at their modeled duty levels.
- PWM is rendered as average visual brightness; frequency, waveforms, and current/voltage effects are not modeled. This is not Servo pulse control; no Servo API/component is included.
- For a physical RGB LED, connect common cathode to GND and use one current-limiting resistor per channel.

## 7-segment display

- Added a common-cathode single-digit display with individually wired A–G segment and DP terminals plus two common cathode terminals.
- Each segment responds to its own HIGH/LOW digital pin. Standard 0–9 segment patterns are recognized and titled on the canvas; arbitrary combinations display as custom patterns.
- For hardware, tie COM1/COM2 to GND and use a current-limiting resistor for every segment used.
- This models on/off segments only; PWM, multiplexing, and decoder chips are not simulated.

## DC motor and H-bridge driver

- Added separate two-terminal DC motor and eight-terminal L298N-style H-bridge components.
- Motor state requires modeled driver power/ground, connected Arduino direction/PWM controls, and both motor leads connected to OUT1/OUT2. IN1/IN2 select clockwise/counterclockwise; both LOW coast, both HIGH brake; ENA PWM duty sets the displayed speed, and swapping motor leads reverses direction.
- Added a ready-to-run DC Motor Speed + Direction Control project using ENA D3, IN1 D4, and IN2 D5.
- This is a visual model only: no current, torque, stall, voltage drop, heat, or realistic external-supply behavior is calculated. A physical motor must not be driven directly from an Uno GPIO pin.

## PIR motion sensor

- Added a three-terminal PIR component (VCC, OUT, GND) with an accessible motion/clear toggle on the canvas and in Properties.
- A powered and wired OUT terminal supplies modeled HIGH when motion is toggled on and LOW when clear.
- Added the PIR Motion-Triggered Light project (D2 sensor input, D8 LED output).
- The component is intentionally binary; sensor electronics, range, field of view, warm-up, hold/retrigger timing, and ambient effects are not modeled.

## Beginner project selector

- Added a top-bar dropdown with fourteen ready-to-run projects: Blink, traffic-light sequence, button lamp, potentiometer threshold, LDR night light, RGB signal, 7-segment digits, button buzzer, Serial heartbeat, room-status capstone, slide-switch/joystick/PWM color mixer, Joystick Servo Controller, DC Motor Speed + Direction Control, and PIR Motion-Triggered Light.
- Selecting one replaces the current screen with its prewired component layout, working wires, project sketch, title, and a relevant selected component in Properties. The canvas auto-fits the loaded circuit; the user can then edit, duplicate, and save it.
- Added unit coverage for every template and an E2E journey that selects, inspects, and runs all fourteen projects, checking the code, properties, and circuit counts.

## Verification

- 76 unit checks pass, including PWM validation/runtime, single/RGB LED brightness, joystick behavior, persistence of motor/driver/PIR component state, and all fourteen template compile/wiring-reference/fresh-ID checks.
- 12 Playwright end-to-end tests pass, including analogWrite-driven RGB brightness, joystick analog/digital input behavior, the latched switch journey, servo position control, DC motor clockwise/counterclockwise states, PIR-driven LED on/off behavior, and all fourteen ready-made projects.
- ESLint and the production Next.js build pass; `npm audit` found zero vulnerabilities.

## Scope limits

The interpreter remains bounded and safe, not a general C++/AVR compiler. It supports documented digital inputs from momentary buttons, joystick SW, and the latched slide switch; analog threshold conditions from modeled sensors; `tone`/`noTone`; bounded 0–255 PWM duty on the six Uno PWM pins for LEDs; and on/off-only 7-segment outputs. PWM waveform generation, Servo-library features beyond the restricted attach/write visual model, general `for`/`while`, arbitrary code execution, physical analog/SPICE voltage/current analysis, H-bridge motor current/torque/stall/thermal behavior, PIR sensing/range/timing/ambient effects, and interrupts are not modeled. Never connect a physical motor directly to an Uno GPIO. Resistors remain ideal conductive pass-throughs in the graph model.
