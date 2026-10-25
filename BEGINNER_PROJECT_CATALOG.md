# Beginner Arduino Project Catalog

A step-by-step project path using the components already available in Virtual Arduino Lab. Each project introduces one new idea, then reuses it in the next one. The wiring notes and sketches below are designed for this lab's **currently supported simulator subset**.

## How to start and customize a project

1. In the app's top bar, open **Beginner projects…** and select one of the thirteen entries. The circuit, wires, component configuration, and matching sketch load together; the relevant component is selected so its Properties guidance is visible.
2. Press **Run** to try the starter project, or inspect its wiring and compare the code with the matching sketch below.
3. To make your own version, choose **More → Duplicate project**, rename it, then change the wiring, component values, pins, timing, or behavior. You can also create a blank workspace with **New**.
4. Use **Stop** to end a simulation and **Save** to keep your copy. Try the suggested challenge only after the starter sketch works.

### Important simulator and hardware notes

- This lab uses a bounded, safe Arduino-like interpreter; it does not run arbitrary C++. The examples intentionally use only supported calls and braced `if` conditions. `for`/`while` loops, arrays, variables that change at runtime, and general C++ are not supported. Bounded `analogWrite(pin, value)` is supported only for Uno PWM pins D3, D5, D6, D9, D10, and D11 with constant duty values from 0 to 255. The H-bridge motor example models direction and PWM speed visually only; it does not calculate motor current, torque, stall, voltage drop, heating, or external-supply behavior. Never drive a physical motor from an Uno GPIO. The limited Servo API supports declared Servo objects, `attach()` on D2–D13, and fixed `write()` angles from 0° to 180°; it renders position/pulse metadata but not a physical waveform.
- The circuit view models digital HIGH/LOW paths, not electrical current or voltage. Resistors are ideal conductive connections in the simulator; **use real current-limiting resistors in physical circuits**.
- Every ordinary LED needs a series resistor. For an RGB LED, use one resistor per color channel. For a 7-segment display, use one resistor per used segment.
- The RGB LED and 7-segment display in the lab are common-cathode. RGB COMMON goes to GND; for the 7-segment display, connect both COM1 and COM2 to GND.
- The potentiometer and LDR sliders provide idealized analog values from 0–1023; the lab is not modeling a physical voltage divider.

## Project path at a glance

| # | Project | Main idea | Components |
|---:|---|---|---|
| 1 | Blink one LED | Output pin, HIGH/LOW, timing | Uno, LED, resistor |
| 2 | Traffic-light sequence | Coordinate multiple outputs | Uno, 3 LEDs, 3 resistors |
| 3 | Press-to-light button | Digital input, pull-up logic | Uno, pushbutton, LED, resistor |
| 4 | Knob threshold indicator | Read analog input and compare | Uno, potentiometer, LED, resistor |
| 5 | Automatic night light | Use an LDR sensor threshold | Uno, LDR, LED, resistor |
| 6 | RGB color signal | Control separate output channels | Uno, RGB LED, 3 resistors |
| 7 | Display digits 2 and 3 | Map several output pins to segments | Uno, 7-segment display, up to 8 resistors |
| 8 | Button-operated buzzer | Combine an input with passive sound | Uno, pushbutton, passive buzzer |
| 9 | Serial heartbeat | Send messages to Serial Monitor | Uno |
| 10 | Room-status indicator | Combine an LDR, RGB LED, and buzzer | Uno, LDR, RGB LED, passive buzzer, 4 resistors |
| 11 | Switch + joystick PWM color mixer | Combine a latched enable, X/Y thresholds, momentary SW, and PWM color levels | Uno, slide switch, joystick, RGB LED, 3 resistors |
| 12 | Joystick Servo Controller | Use axis thresholds and SW to select servo positions | Uno, joystick, hobby servo |

---

## 1. Blink one LED

**Learn:** An Arduino output pin can turn a connected LED on and off. `delay()` controls how long each state lasts.

**Parts:** Arduino Uno, one LED, one current-limiting resistor.

**Wire:** D8 → resistor → LED ANODE; LED CATHODE → GND.

**Sketch:**

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

**Try next:** Change the delays to 200 ms and 800 ms. Observe how the blink changes. This is also the lab's pre-wired starter project.

---

## 2. Traffic-light sequence

**Learn:** Several output pins can be controlled independently in a sequence.

**Parts:** Uno, red/yellow/green LEDs, three current-limiting resistors.

**Wire:** Connect each LED's ANODE through its own resistor to D8 (red), D9 (yellow), or D10 (green). Connect all three CATHODE terminals to GND. In the Properties panel, choose each LED's color.

**Sketch:**

```cpp
const int redPin = 8;
const int yellowPin = 9;
const int greenPin = 10;

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(yellowPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
}

void loop() {
  digitalWrite(redPin, HIGH);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, LOW);
  delay(1000);

  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, HIGH);
  digitalWrite(greenPin, LOW);
  delay(300);

  digitalWrite(redPin, LOW);
  digitalWrite(yellowPin, LOW);
  digitalWrite(greenPin, HIGH);
  delay(1000);
}
```

**Try next:** Add a short all-off interval between colors by setting all three pins LOW and delaying 100 ms.

---

## 3. Press-to-light button

**Learn:** Read a digital input and choose an output with `if`/`else`. `INPUT_PULLUP` makes the pin HIGH while the button is released and LOW while it is pressed to GND.

**Parts:** Uno, pushbutton, LED, resistor.

**Wire:** Button side 1 → D2; opposite side 2 → GND. LED ANODE → resistor → D8; LED CATHODE → GND. On the four-terminal pushbutton, terminals 1A/1B are one side and 2A/2B are the opposite side.

**Sketch:**

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

**Try next:** Swap HIGH and LOW in the two branches to make the LED on only when the button is released. Press the red cap to operate the button; drag its gray base to move it.

---

## 4. Knob threshold indicator

**Learn:** `analogRead()` returns a value from 0 to 1023. Compare that value to a threshold and make a digital output respond.

**Parts:** Uno, 10kΩ potentiometer, LED, resistor.

**Wire:** Potentiometer GND → board GND; potentiometer 5V → board 5V; WIPER → A0. LED ANODE → resistor → D8; CATHODE → GND.

**Sketch:**

```cpp
const int knobPin = A0;
const int ledPin = 8;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  if (analogRead(knobPin) > 512) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  delay(20);
}
```

**Try next:** Change 512 to 800, then 200. Move the potentiometer slider and see where the LED changes state. This is a threshold switch, not smooth brightness control.

---

## 5. Automatic night light

**Learn:** Use the LDR light-level control as an analog input. In this module dark maps to a low reading and bright maps to a high reading.

**Parts:** Uno, LDR Light Sensor module, LED, resistor.

**Wire:** LDR VCC → 5V; GND → board GND; AO → A0. LED ANODE → resistor → D8; CATHODE → GND.

**Sketch:**

```cpp
const int lightPin = A0;
const int lampPin = 8;

void setup() {
  pinMode(lampPin, OUTPUT);
}

void loop() {
  if (analogRead(lightPin) < 400) {
    digitalWrite(lampPin, HIGH);
  } else {
    digitalWrite(lampPin, LOW);
  }
  delay(20);
}
```

**Try next:** Adjust the threshold, then change the LDR slider from dark to bright. The slider is an idealized sensor model, not real light or divider physics.

---

## 6. RGB color signal

**Learn:** One RGB LED contains three separately controlled channels. Multiple HIGH channels combine to make a color; this lab models only fully off or fully on.

**Parts:** Uno, common-cathode RGB LED, three current-limiting resistors.

**Wire:** COMMON → GND. R → resistor → D9; G → resistor → D10; B → resistor → D11.

**Sketch:**

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
  delay(500);

  digitalWrite(redPin, LOW);
  digitalWrite(greenPin, HIGH);
  digitalWrite(bluePin, LOW);
  delay(500);

  digitalWrite(redPin, LOW);
  digitalWrite(greenPin, LOW);
  digitalWrite(bluePin, HIGH);
  delay(500);

  digitalWrite(redPin, HIGH);
  digitalWrite(greenPin, HIGH);
  digitalWrite(bluePin, HIGH);
  delay(500);
}
```

**Try next:** Set red and green HIGH together for yellow, or green and blue for cyan. For smooth mixing, wire R/G/B to PWM pins D9/D10/D11 and try `analogWrite(9, 64)`, `analogWrite(10, 128)`, and `analogWrite(11, 255)`; duty values 0–255 control modeled brightness.

---

## 7. Display digits 2 and 3

**Learn:** A number is made from a pattern of separate segments. The program must set each segment pin to the correct level.

**Parts:** Uno, common-cathode 7-segment display, one resistor per used segment.

**Wire:** COM1 and COM2 → GND. Connect A→D2, B→D3, C→D4, D→D5, E→D6, F→D7, G→D8, and DP→D9, with a resistor in series with each segment. DP is the optional decimal point.

**Sketch:**

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
  // Digit 2: A, B, D, E, G on
  digitalWrite(segA, HIGH);
  digitalWrite(segB, HIGH);
  digitalWrite(segC, LOW);
  digitalWrite(segD, HIGH);
  digitalWrite(segE, HIGH);
  digitalWrite(segF, LOW);
  digitalWrite(segG, HIGH);
  digitalWrite(segDP, LOW);
  delay(1000);

  // Digit 3: A, B, C, D, G on
  digitalWrite(segA, HIGH);
  digitalWrite(segB, HIGH);
  digitalWrite(segC, HIGH);
  digitalWrite(segD, HIGH);
  digitalWrite(segE, LOW);
  digitalWrite(segF, LOW);
  digitalWrite(segG, HIGH);
  digitalWrite(segDP, LOW);
  delay(1000);
}
```

**Try next:** Work out the A–G pattern for 0, 1, or 8 and change the pin levels. The lab does not model a decoder chip, multiplexing, or PWM.

---

## 8. Button-operated passive buzzer

**Learn:** Combine a digital input with sound output. A passive buzzer needs `tone()`; `noTone()` silences it.

**Parts:** Uno, pushbutton, passive buzzer.

**Wire:** Button side 1 → D2; opposite side 2 → GND. Passive buzzer `+` → D9; `−` → GND.

**Sketch:**

```cpp
const int buttonPin = 2;
const int buzzerPin = 9;

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(buttonPin) == LOW) {
    tone(buzzerPin, 880);
  } else {
    noTone(buzzerPin);
  }
  delay(20);
}
```

**Try next:** Change 880 to 440 or 1200 Hz. The browser may require a click/run gesture before it plays audio; the visual buzzer state still works if audio is muted.

---

## 9. Serial heartbeat

**Learn:** The Arduino can send text to the Serial Monitor. This simple sketch needs no extra circuit parts.

**Parts:** Uno.

**Wire:** None beyond the Arduino board.

**Sketch:**

```cpp
void setup() {
  Serial.begin(9600);
  Serial.println("Starting Arduino");
}

void loop() {
  Serial.println("Still running");
  delay(1000);
}
```

**Try next:** Change the messages and baud rate. This interpreter currently prints string literals or numeric constants; it does not evaluate and print arbitrary expressions such as `analogRead(A0)`.

---

## 10. Room-status indicator (capstone)

**Learn:** Combine sensor input, multiple digital outputs, a conditional, and a passive buzzer.

**Parts:** Uno, LDR module, common-cathode RGB LED, passive buzzer, four current-limiting resistors (one per RGB channel; no resistor is needed for the idealized LDR module).

**Wire:** LDR VCC→5V, GND→GND, AO→A0. RGB COMMON→GND; R→resistor→D9, G→resistor→D10, B→resistor→D11. Buzzer `+`→D12 and `−`→GND.

**Sketch:**

```cpp
const int lightPin = A0;
const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;
const int buzzerPin = 12;

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
}

void loop() {
  if (analogRead(lightPin) < 400) {
    digitalWrite(redPin, HIGH);
    digitalWrite(greenPin, LOW);
    digitalWrite(bluePin, LOW);
    tone(buzzerPin, 880);
  } else {
    digitalWrite(redPin, LOW);
    digitalWrite(greenPin, HIGH);
    digitalWrite(bluePin, LOW);
    noTone(buzzerPin);
  }
  delay(100);
}
```

**Try next:** Change the light threshold and decide what the two status colors should mean. This project is a learning model, not a real safety alarm.

---

## 11. Switch + joystick PWM color mixer

**Learn:** A slide switch enables the circuit; joystick X selects red or blue, Y adds green at half brightness, and the joystick's SW button overrides the color to white. PWM uses the modeled 0–255 levels on D9/D10/D11.

**Parts:** Uno, slide switch, joystick module, common-cathode RGB LED, and one current-limiting resistor per RGB channel.

**Wire:** Slide-switch A→D3 and B→GND. Joystick VCC→5V, GND→GND, VRX→A0, VRY→A1, SW→D2. RGB COMMON→GND; connect R/G/B through separate resistors to D9/D10/D11.

```cpp
const int enablePin = 3;
const int joyButtonPin = 2;
const int joyX = A0;
const int joyY = A1;
const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;

void setup() {
  pinMode(enablePin, INPUT_PULLUP);
  pinMode(joyButtonPin, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(enablePin) == LOW) {
    if (analogRead(joyX) > 700) {
      analogWrite(redPin, 255);
      analogWrite(bluePin, 0);
    } else {
      analogWrite(redPin, 0);
      analogWrite(bluePin, 255);
    }
    if (analogRead(joyY) > 700) {
      analogWrite(greenPin, 128);
    } else {
      analogWrite(greenPin, 0);
    }
    if (digitalRead(joyButtonPin) == LOW) {
      analogWrite(redPin, 255);
      analogWrite(greenPin, 255);
      analogWrite(bluePin, 255);
    }
  } else {
    analogWrite(redPin, 0);
    analogWrite(greenPin, 0);
    analogWrite(bluePin, 0);
  }
  delay(20);
}
```

**Try it:** Choose this project in the dropdown and press Run. Turn the slide switch ON; move X right past 700 for red or leave it left/center for blue. Push Y up past 700 to add green, and hold SW for white. Turn the switch OFF to turn all channels off. The simulator displays duty-cycle brightness but does not model PWM electrical waveforms or servo pulses.

## 12. Joystick Servo Controller

**Learn:** Convert joystick X/Y threshold regions into fixed 0°–180° servo positions; hold the joystick's SW button to center the arm.

**Parts:** Uno, joystick module, hobby servo.

**Wire:** Joystick VCC→5V, GND→GND, VRX→A0, VRY→A1, SW→D2. Servo VCC→5V, GND→GND, SIG→D9. The lab starts centered at 90°.

```cpp
#include <Servo.h>
Servo arm;
const int joyX = A0;
const int joyY = A1;
const int joyButtonPin = 2;
const int servoPin = 9;

void setup() {
  pinMode(joyButtonPin, INPUT_PULLUP);
  arm.attach(servoPin);
}

void loop() {
  if (digitalRead(joyButtonPin) == LOW) {
    arm.write(90);
  } else {
    if (analogRead(joyX) > 700) {
      arm.write(180);
    } else {
      if (analogRead(joyX) < 300) {
        arm.write(0);
      } else {
        if (analogRead(joyY) > 700) {
          arm.write(135);
        } else {
          if (analogRead(joyY) < 300) {
            arm.write(45);
          } else {
            arm.write(90);
          }
        }
      }
    }
  }
  delay(20);
}
```

**Try it:** Select this project and press Run. Move X right/left for 180°/0°; when X is centered, move Y up/down for 135°/45°. Return both axes near center for 90°, or hold SW to center immediately. The canvas displays the mapped pulse width and 50 Hz model. In a physical setup, supply servo power appropriately and share grounds; the simulator does not model current draw or generate a physical pulse waveform.

## 13. DC Motor Speed + Direction Control

**Learn:** Use a motor driver to set brushed DC motor direction with two digital outputs and modeled speed with PWM.

**Parts:** Arduino Uno, DC motor, L298N-style H-Bridge Driver.

**Wire:** Driver VCC→Uno 5V, VM→Uno 5V (for this idealized example), GND→Uno GND, ENA→D3, IN1→D4, IN2→D5; OUT1→motor M+, OUT2→motor M−. The model requires power, ground, both control signals, and both motor leads to be wired.

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

**Try it:** Load the project and press Run. The motor rotates clockwise, reverses, then stops; `analogWrite(3, 0..255)` controls the displayed speed. IN1/IN2 both LOW model coasting and both HIGH model braking; reversing M+/M− wiring reverses displayed direction. This is an animation, not electrical or mechanical simulation: current, torque, stall, voltage drop, thermal effects, and realistic external motor-supply behavior are absent. In real hardware, choose a motor driver and suitable motor supply, share grounds, and never connect a motor directly to an Uno GPIO.

## Bonus exercise (not in the thirteen-project dropdown): joystick-controlled LED

**Learn:** Use the joystick's X analog axis as an input threshold, then use the SW terminal as a momentary digital input.

**Parts and wiring:** Uno, joystick module, LED, resistor. Connect VCC→5V, GND→GND, VRX→A0, VRY→A1, SW→D2; connect LED ANODE through a resistor to D8 and CATHODE to GND.

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

Drag the joystick pad or change its X-axis slider. To use SW in a sketch, set D2 to `INPUT_PULLUP`; held reads LOW when the module GND is connected. The joystick is also used in the integrated project 11; this bonus LED exercise is a separate optional challenge.

## Where to go from here

After you can rebuild these projects, choose your own input (momentary button, latched slide switch, potentiometer, or LDR), define the condition that matters, and connect one or more outputs (LED, RGB channel, 7-segment segment, buzzer, or a motor through an H-bridge). Start by changing one thing at a time: a pin, threshold, output pattern, or delay. Save each working version under a new project name so you can return to it.
