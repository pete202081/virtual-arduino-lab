# Interactive Components Feature Report

## Pushbutton

- Four-terminal, normally-open momentary switch is available in the component library and Quick Add.
- The two legs on each side are permanently connected; holding the red cap bridges the sides. Drag the gray base to move it.
- A bounded `digitalRead` conditional and input-pullup model support the common D2-to-GND button circuit.

## Active and passive buzzers

- The Buzzer component is available in the library and Quick Add. Choose **Active** or **Passive** in its Properties panel.
- Wire **+** to an Arduino output (or 5V for an active buzzer) and **−** to GND.
- Active buzzers sound at a fixed 2,300 Hz modeled pitch when powered.
- Passive buzzers respond to bounded `tone(pin, frequency[, duration])` and `noTone(pin)` sketch instructions.
- Audible feedback is synthesized in the browser with a low-volume square wave. A visual indicator is shown as well; browser/system audio may mute or block the sound.
- Stop, Reset, project load, or unmount cancels tones and releases the audio nodes.

## Potentiometer

- Added an adjustable 10kΩ potentiometer to the library and Quick Add, with GND, 5V, and WIPER terminals.
- Its on-canvas slider and Properties slider set a simulated ADC reading from 0 to 1023.
- When wired between Arduino GND and 5V, with WIPER connected to A0–A5, `analogRead()` supplies that value to the bounded interpreter.
- Supports direct braced `if (analogRead(A0) > 512) { ... } else { ... }` threshold logic; the potentiometer state is saved and restored with project JSON.

## Example

```cpp
const int potPin = A0;
const int ledPin = 8;
void setup() { pinMode(ledPin, OUTPUT); }
void loop() {
  if (analogRead(potPin) > 512) { digitalWrite(ledPin, HIGH); }
  else { digitalWrite(ledPin, LOW); }
  delay(20);
}
```

## LDR Light Sensor

- Added a three-terminal VCC/GND/AO light-sensor module in the Sensors palette and Quick Add.
- Its brightness slider maps 0% dark to ADC 0 and 100% bright to ADC 1023.
- When correctly wired to 5V, GND, and A0–A5, it works with the bounded analogRead threshold condition.
- This models the sensor module output directly; it does not calculate a bare LDR/resistor voltage divider.

## Verification

- 50 unit tests pass, covering switch topology, button input, buzzer drive/tone, potentiometer and LDR analog reads, runtime thresholds, and persistence.
- 6 Playwright end-to-end tests pass, including wired buzzer and potentiometer/LDR-controlled LED journeys.
- ESLint and the production Next.js build pass; `npm audit` found zero vulnerabilities.

## Scope limits

The interpreter remains bounded and safe, not a general C++/AVR compiler. It supports only the documented digital/analog read condition forms and bounded `tone`/`noTone` calls using numeric constants. There is no general `for`/`while`, arbitrary code execution, analog/SPICE voltage/current analysis, PWM, or interrupt behavior. The potentiometer supplies an idealized ADC value; resistors remain ideal conductive pass-throughs in the graph model.
