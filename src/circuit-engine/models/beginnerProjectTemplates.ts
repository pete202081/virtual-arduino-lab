import type { ComponentInstance, Wire } from "@/types/circuit";
import {
  createArduinoUno,
  createLED,
  createPushButton,
  createBuzzer,
  createPotentiometer,
  createLdrSensor,
  createPirSensor,
  createHcSr04Sensor,
  createTmp36Sensor,
  createRelayModule,
  createRGBLED,
  createSevenSegmentDisplay,
  createResistor,
  createSlideSwitch,
  createJoystickModule,
  createServoMotor,
  createDcMotor,
  createHBridgeDriver,
} from "@/circuit-engine/models/componentTemplates";
import { generateId } from "@/lib/utils";

export const BEGINNER_PROJECTS = [
  { id: "blink-led", name: "01 · Blink one LED", description: "First output: blink one LED on D8." },
  { id: "traffic-light", name: "02 · Traffic-light sequence", description: "Coordinate red, yellow, and green digital outputs." },
  { id: "button-lamp", name: "03 · Press-to-light button", description: "Read a pull-up button and control an LED." },
  { id: "pot-threshold", name: "04 · Knob threshold indicator", description: "Compare a potentiometer's analogRead value to a threshold." },
  { id: "night-light", name: "05 · Automatic night light", description: "Use an LDR value to switch an LED on in the dark." },
  { id: "rgb-signal", name: "06 · RGB color signal", description: "Sequence independent red, green, and blue channels." },
  { id: "seven-segment", name: "07 · Display digits 2 and 3", description: "Wire and control eight separate display outputs." },
  { id: "button-buzzer", name: "08 · Button-operated buzzer", description: "Use a button input to start and stop a passive buzzer." },
  { id: "serial-heartbeat", name: "09 · Serial heartbeat", description: "Send repeated status messages to the Serial Monitor." },
  { id: "room-status", name: "10 · Room-status indicator", description: "Capstone: combine an LDR, RGB LED, and passive buzzer." },
  { id: "switch-joystick-pwm", name: "11 · Switch + joystick PWM color mixer", description: "Use a slide switch to enable a joystick-controlled RGB LED; X/Y set color and the joystick button flashes white." },
  { id: "joystick-servo", name: "12 · Joystick Servo Controller", description: "Use joystick X thresholds to select servo angles and press SW to center the arm." },
  { id: "dc-motor-hbridge", name: "13 · DC Motor Speed + Direction Control", description: "Drive a brushed DC motor through an H-bridge using PWM speed and digital direction inputs." },
  { id: "pir-motion-light", name: "14 · PIR Motion-Triggered Light", description: "Turn an LED on when the simulated PIR motion output goes HIGH." },
  { id: "ultrasonic-distance-alarm", name: "15 · Ultrasonic Distance Alarm", description: "Use an HC-SR04-style echo duration threshold to warn when an object is nearby." },
  { id: "tmp36-temperature-alarm", name: "16 · TMP36 Temperature Alarm", description: "Read an analog TMP36 model and turn on an LED above a warm-temperature threshold." },
  { id: "relay-controlled-lamp", name: "17 · Relay-Controlled Lamp", description: "Switch a low-voltage LED load through the modeled relay COM/NO contacts." },
] as const;

export type BeginnerProjectId = (typeof BEGINNER_PROJECTS)[number]["id"];

export interface BeginnerProjectTemplate {
  id: BeginnerProjectId;
  name: string;
  description: string;
  components: ComponentInstance[];
  wires: Wire[];
  code: string;
  focusComponentId: string;
}

const SKETCHES: Record<BeginnerProjectId, string> = {
  "blink-led": `const int ledPin = 8;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(ledPin, HIGH);\n  delay(1000);\n  digitalWrite(ledPin, LOW);\n  delay(1000);\n}` ,
  "traffic-light": `const int redPin = 8;\nconst int yellowPin = 9;\nconst int greenPin = 10;\n\nvoid setup() {\n  pinMode(redPin, OUTPUT);\n  pinMode(yellowPin, OUTPUT);\n  pinMode(greenPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(redPin, HIGH);\n  digitalWrite(yellowPin, LOW);\n  digitalWrite(greenPin, LOW);\n  delay(1000);\n  digitalWrite(redPin, LOW);\n  digitalWrite(yellowPin, HIGH);\n  digitalWrite(greenPin, LOW);\n  delay(300);\n  digitalWrite(redPin, LOW);\n  digitalWrite(yellowPin, LOW);\n  digitalWrite(greenPin, HIGH);\n  delay(1000);\n}`,
  "button-lamp": `const int buttonPin = 2;\nconst int ledPin = 8;\n\nvoid setup() {\n  pinMode(buttonPin, INPUT_PULLUP);\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  if (digitalRead(buttonPin) == LOW) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(20);\n}`,
  "pot-threshold": `const int knobPin = A0;\nconst int ledPin = 8;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  if (analogRead(knobPin) > 512) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n  delay(20);\n}`,
  "night-light": `const int lightPin = A0;\nconst int lampPin = 8;\n\nvoid setup() {\n  pinMode(lampPin, OUTPUT);\n}\n\nvoid loop() {\n  if (analogRead(lightPin) < 400) {\n    digitalWrite(lampPin, HIGH);\n  } else {\n    digitalWrite(lampPin, LOW);\n  }\n  delay(20);\n}`,
  "rgb-signal": `const int redPin = 9;\nconst int greenPin = 10;\nconst int bluePin = 11;\n\nvoid setup() {\n  pinMode(redPin, OUTPUT);\n  pinMode(greenPin, OUTPUT);\n  pinMode(bluePin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(redPin, HIGH);\n  digitalWrite(greenPin, LOW);\n  digitalWrite(bluePin, LOW);\n  delay(500);\n  digitalWrite(redPin, LOW);\n  digitalWrite(greenPin, HIGH);\n  digitalWrite(bluePin, LOW);\n  delay(500);\n  digitalWrite(redPin, LOW);\n  digitalWrite(greenPin, LOW);\n  digitalWrite(bluePin, HIGH);\n  delay(500);\n  digitalWrite(redPin, HIGH);\n  digitalWrite(greenPin, HIGH);\n  digitalWrite(bluePin, HIGH);\n  delay(500);\n}`,
  "seven-segment": `const int segA = 2;\nconst int segB = 3;\nconst int segC = 4;\nconst int segD = 5;\nconst int segE = 6;\nconst int segF = 7;\nconst int segG = 8;\nconst int segDP = 9;\n\nvoid setup() {\n  pinMode(segA, OUTPUT);\n  pinMode(segB, OUTPUT);\n  pinMode(segC, OUTPUT);\n  pinMode(segD, OUTPUT);\n  pinMode(segE, OUTPUT);\n  pinMode(segF, OUTPUT);\n  pinMode(segG, OUTPUT);\n  pinMode(segDP, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(segA, HIGH);\n  digitalWrite(segB, HIGH);\n  digitalWrite(segC, LOW);\n  digitalWrite(segD, HIGH);\n  digitalWrite(segE, HIGH);\n  digitalWrite(segF, LOW);\n  digitalWrite(segG, HIGH);\n  digitalWrite(segDP, LOW);\n  delay(1000);\n  digitalWrite(segA, HIGH);\n  digitalWrite(segB, HIGH);\n  digitalWrite(segC, HIGH);\n  digitalWrite(segD, HIGH);\n  digitalWrite(segE, LOW);\n  digitalWrite(segF, LOW);\n  digitalWrite(segG, HIGH);\n  digitalWrite(segDP, LOW);\n  delay(1000);\n}`,
  "button-buzzer": `const int buttonPin = 2;\nconst int buzzerPin = 9;\n\nvoid setup() {\n  pinMode(buttonPin, INPUT_PULLUP);\n}\n\nvoid loop() {\n  if (digitalRead(buttonPin) == LOW) {\n    tone(buzzerPin, 880);\n  } else {\n    noTone(buzzerPin);\n  }\n  delay(20);\n}`,
  "serial-heartbeat": `void setup() {\n  Serial.begin(9600);\n  Serial.println("Starting Arduino");\n}\n\nvoid loop() {\n  Serial.println("Still running");\n  delay(1000);\n}`,
  "room-status": `const int lightPin = A0;\nconst int redPin = 9;\nconst int greenPin = 10;\nconst int bluePin = 11;\nconst int buzzerPin = 12;\n\nvoid setup() {\n  pinMode(redPin, OUTPUT);\n  pinMode(greenPin, OUTPUT);\n  pinMode(bluePin, OUTPUT);\n}\n\nvoid loop() {\n  if (analogRead(lightPin) < 400) {\n    digitalWrite(redPin, HIGH);\n    digitalWrite(greenPin, LOW);\n    digitalWrite(bluePin, LOW);\n    tone(buzzerPin, 880);\n  } else {\n    digitalWrite(redPin, LOW);\n    digitalWrite(greenPin, HIGH);\n    digitalWrite(bluePin, LOW);\n    noTone(buzzerPin);\n  }\n  delay(100);\n}`,
  "switch-joystick-pwm": `const int enablePin = 3;\nconst int joyButtonPin = 2;\nconst int joyX = A0;\nconst int joyY = A1;\nconst int redPin = 9;\nconst int greenPin = 10;\nconst int bluePin = 11;\n\nvoid setup() {\n  pinMode(enablePin, INPUT_PULLUP);\n  pinMode(joyButtonPin, INPUT_PULLUP);\n}\n\nvoid loop() {\n  if (digitalRead(enablePin) == LOW) {\n    if (analogRead(joyX) > 700) {\n      analogWrite(redPin, 255);\n      analogWrite(bluePin, 0);\n    } else {\n      analogWrite(redPin, 0);\n      analogWrite(bluePin, 255);\n    }\n    if (analogRead(joyY) > 700) {\n      analogWrite(greenPin, 128);\n    } else {\n      analogWrite(greenPin, 0);\n    }\n    if (digitalRead(joyButtonPin) == LOW) {\n      analogWrite(redPin, 255);\n      analogWrite(greenPin, 255);\n      analogWrite(bluePin, 255);\n    }\n  } else {\n    analogWrite(redPin, 0);\n    analogWrite(greenPin, 0);\n    analogWrite(bluePin, 0);\n  }\n  delay(20);\n}`,

  "joystick-servo": `#include <Servo.h>\nServo arm;\nconst int joyX = A0;\nconst int joyY = A1;\nconst int joyButtonPin = 2;\nconst int servoPin = 9;\n\nvoid setup() {\n  pinMode(joyButtonPin, INPUT_PULLUP);\n  arm.attach(servoPin);\n}\n\nvoid loop() {\n  if (digitalRead(joyButtonPin) == LOW) {\n    arm.write(90);\n  } else {\n    if (analogRead(joyX) > 700) {\n      arm.write(180);\n    } else {\n      if (analogRead(joyX) < 300) {\n        arm.write(0);\n      } else {\n        if (analogRead(joyY) > 700) {\n          arm.write(135);\n        } else {\n          if (analogRead(joyY) < 300) {\n            arm.write(45);\n          } else {\n            arm.write(90);\n          }\n        }\n      }\n    }\n  }\n  delay(20);\n}`,

  "relay-controlled-lamp": `const int relayPin = 7;\n\nvoid setup() {\n  pinMode(relayPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(relayPin, LOW);\n  delay(1000);\n  digitalWrite(relayPin, HIGH);\n  delay(1000);\n}`,
  "tmp36-temperature-alarm": `const int tempPin = A0;\nconst int lampPin = 8;\n\nvoid setup() {\n  pinMode(lampPin, OUTPUT);\n}\n\nvoid loop() {\n  if (analogRead(tempPin) > 164) {\n    digitalWrite(lampPin, HIGH);\n  } else {\n    digitalWrite(lampPin, LOW);\n  }\n  delay(100);\n}`,
  "ultrasonic-distance-alarm": `const int trigPin = 3;\nconst int echoPin = 2;\nconst int lampPin = 8;\n\nvoid setup() {\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  pinMode(lampPin, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n  if (pulseIn(echoPin, HIGH, 30000) < 1160) {\n    digitalWrite(lampPin, HIGH);\n  } else {\n    digitalWrite(lampPin, LOW);\n  }\n  delay(50);\n}`,
  "pir-motion-light": `const int motionPin = 2;\nconst int lampPin = 8;\n\nvoid setup() {\n  pinMode(motionPin, INPUT);\n  pinMode(lampPin, OUTPUT);\n}\n\nvoid loop() {\n  if (digitalRead(motionPin) == HIGH) {\n    digitalWrite(lampPin, HIGH);\n  } else {\n    digitalWrite(lampPin, LOW);\n  }\n  delay(20);\n}`,
  "dc-motor-hbridge": `const int enablePin = 3;\nconst int in1Pin = 4;\nconst int in2Pin = 5;\n\nvoid setup() {\n  pinMode(in1Pin, OUTPUT);\n  pinMode(in2Pin, OUTPUT);\n}\n\nvoid loop() {\n  analogWrite(enablePin, 128);\n  digitalWrite(in1Pin, HIGH);\n  digitalWrite(in2Pin, LOW);\n  delay(1000);\n  digitalWrite(in1Pin, LOW);\n  digitalWrite(in2Pin, HIGH);\n  delay(1000);\n  analogWrite(enablePin, 0);\n  digitalWrite(in1Pin, LOW);\n  digitalWrite(in2Pin, LOW);\n  delay(500);\n}`,

};

function getTerminal(component: ComponentInstance, label: string) {
  const terminal = component.terminals.find((item) => item.label === label);
  if (!terminal) throw new Error(`Template error: ${component.type} is missing terminal ${label}`);
  return terminal;
}

function createWire(wires: Wire[], start: ComponentInstance, startLabel: string, end: ComponentInstance, endLabel: string, color = "#EF4444") {
  const startTerminal = getTerminal(start, startLabel);
  const endTerminal = getTerminal(end, endLabel);
  wires.push({
    id: generateId("wire"),
    startTerminalId: startTerminal.id,
    endTerminalId: endTerminal.id,
    startComponentId: start.id,
    endComponentId: end.id,
    color,
  });
}

function createLedBranch(board: ComponentInstance, pin: number, color: string, index = 0) {
  const y = 90 + index * 100;
  const resistor = createResistor(355, y + 15, 220);
  const led = createLED(485, y, color);
  const wires: Wire[] = [];
  createWire(wires, board, `D${pin}`, resistor, "A");
  createWire(wires, resistor, "B", led, "ANODE");
  createWire(wires, led, "CATHODE", board, "GND-1", "#1F2937");
  return { resistor, led, wires };
}

function addProject(id: BeginnerProjectId, name: string, description: string, components: ComponentInstance[], wires: Wire[], focusComponentId: string): BeginnerProjectTemplate {
  return { id, name, description, components, wires, code: SKETCHES[id], focusComponentId };
}

/** Create a fresh, fully wired beginner project for the dropdown. */
export function createBeginnerProject(id: BeginnerProjectId): BeginnerProjectTemplate {
  const meta = BEGINNER_PROJECTS.find((project) => project.id === id);
  if (!meta) throw new Error(`Unknown beginner project: ${id}`);
  const board = createArduinoUno(35, 45);
  const components: ComponentInstance[] = [board];
  const wires: Wire[] = [];
  let focusComponentId = board.id;

  if (id === "blink-led") {
    const branch = createLedBranch(board, 8, "red");
    components.push(branch.resistor, branch.led);
    wires.push(...branch.wires);
    focusComponentId = branch.led.id;
  } else if (id === "traffic-light") {
    for (const [index, item] of [[8, "red"], [9, "yellow"], [10, "green"]] as const) {
      const branch = createLedBranch(board, index, item, item === "red" ? 0 : item === "yellow" ? 1 : 2);
      components.push(branch.resistor, branch.led);
      wires.push(...branch.wires);
      if (item === "red") focusComponentId = branch.led.id;
    }
  } else if (id === "button-lamp") {
    const button = createPushButton(460, 245);
    const branch = createLedBranch(board, 8, "red");
    components.push(button, branch.resistor, branch.led);
    wires.push(...branch.wires);
    createWire(wires, board, "D2", button, "1A");
    createWire(wires, button, "2A", board, "GND-1", "#1F2937");
    focusComponentId = button.id;
  } else if (id === "pot-threshold") {
    const pot = createPotentiometer(465, 240);
    const branch = createLedBranch(board, 8, "green");
    components.push(pot, branch.resistor, branch.led);
    wires.push(...branch.wires);
    createWire(wires, board, "GND-2", pot, "GND", "#1F2937");
    createWire(wires, board, "5V", pot, "5V", "#EF4444");
    createWire(wires, pot, "WIPER", board, "A0", "#2563EB");
    focusComponentId = pot.id;
  } else if (id === "night-light") {
    const ldr = createLdrSensor(465, 240);
    const branch = createLedBranch(board, 8, "yellow");
    components.push(ldr, branch.resistor, branch.led);
    wires.push(...branch.wires);
    createWire(wires, board, "5V", ldr, "VCC", "#EF4444");
    createWire(wires, board, "GND-2", ldr, "GND", "#1F2937");
    createWire(wires, ldr, "AO", board, "A0", "#2563EB");
    focusComponentId = ldr.id;
  } else if (id === "rgb-signal") {
    const rgb = createRGBLED(475, 150);
    components.push(rgb);
    for (const [index, channel] of ["R", "G", "B"].entries()) {
      const resistor = createResistor(350, 135 + index * 30, 220);
      components.push(resistor);
      createWire(wires, rgb, channel, resistor, "A", channel === "R" ? "#EF4444" : channel === "G" ? "#10B981" : "#2563EB");
      createWire(wires, resistor, "B", board, `D${9 + index}`, channel === "R" ? "#EF4444" : channel === "G" ? "#10B981" : "#2563EB");
    }
    createWire(wires, rgb, "COMMON", board, "GND-1", "#1F2937");
    focusComponentId = rgb.id;
  } else if (id === "seven-segment") {
    const display = createSevenSegmentDisplay(420, 90);
    components.push(display);
    const segmentLabels = ["A", "B", "C", "D", "E", "F", "G", "DP"];
    segmentLabels.forEach((label, index) => {
      const resistor = createResistor(335, 250 + index * 25, 220);
      components.push(resistor);
      createWire(wires, display, label, resistor, "A", label === "DP" ? "#2563EB" : "#EF4444");
      createWire(wires, resistor, "B", board, `D${index + 2}`, label === "DP" ? "#2563EB" : "#EF4444");
    });
    createWire(wires, display, "COM1", board, "GND-1", "#1F2937");
    createWire(wires, display, "COM2", board, "GND-2", "#1F2937");
    focusComponentId = display.id;
  } else if (id === "button-buzzer") {
    const button = createPushButton(445, 235);
    const buzzer = createBuzzer(480, 125, "passive");
    components.push(button, buzzer);
    createWire(wires, board, "D2", button, "1A");
    createWire(wires, button, "2A", board, "GND-1", "#1F2937");
    createWire(wires, board, "D9", buzzer, "+");
    createWire(wires, buzzer, "-", board, "GND-2", "#1F2937");
    focusComponentId = button.id;
  } else if (id === "serial-heartbeat") {
    focusComponentId = board.id;
  } else if (id === "room-status") {
    const ldr = createLdrSensor(455, 330);
    const rgb = createRGBLED(465, 115);
    const buzzer = createBuzzer(650, 315, "passive");
    components.push(ldr, rgb, buzzer);
    createWire(wires, board, "5V", ldr, "VCC", "#EF4444");
    createWire(wires, board, "GND-2", ldr, "GND", "#1F2937");
    createWire(wires, ldr, "AO", board, "A0", "#2563EB");
    for (const [index, channel] of ["R", "G", "B"].entries()) {
      const resistor = createResistor(345, 140 + index * 28, 220);
      components.push(resistor);
      createWire(wires, rgb, channel, resistor, "A", channel === "R" ? "#EF4444" : channel === "G" ? "#10B981" : "#2563EB");
      createWire(wires, resistor, "B", board, `D${9 + index}`, channel === "R" ? "#EF4444" : channel === "G" ? "#10B981" : "#2563EB");
    }
    createWire(wires, rgb, "COMMON", board, "GND-1", "#1F2937");
    createWire(wires, board, "D12", buzzer, "+");
    createWire(wires, buzzer, "-", board, "GND-1", "#1F2937");
    focusComponentId = ldr.id;
  } else if (id === "switch-joystick-pwm") {
    const slideSwitch = createSlideSwitch(455, 240);
    const joystick = createJoystickModule(470, 365);
    const rgb = createRGBLED(515, 100);
    components.push(slideSwitch, joystick, rgb);
    createWire(wires, board, "D3", slideSwitch, "A", "#F59E0B");
    createWire(wires, slideSwitch, "B", board, "GND-1", "#1F2937");
    createWire(wires, board, "5V", joystick, "VCC", "#EF4444");
    createWire(wires, board, "GND-2", joystick, "GND", "#1F2937");
    createWire(wires, joystick, "VRX", board, "A0", "#2563EB");
    createWire(wires, joystick, "VRY", board, "A1", "#10B981");
    createWire(wires, joystick, "SW", board, "D2", "#F59E0B");
    for (const [index, channel] of ["R", "G", "B"].entries()) {
      const color = channel === "R" ? "#EF4444" : channel === "G" ? "#10B981" : "#2563EB";
      const resistor = createResistor(350, 115 + index * 32, 220);
      components.push(resistor);
      createWire(wires, rgb, channel, resistor, "A", color);
      createWire(wires, resistor, "B", board, `D${9 + index}`, color);
    }
    createWire(wires, rgb, "COMMON", board, "GND-1", "#1F2937");
    focusComponentId = joystick.id;
  } else if (id === "joystick-servo") {
    const joystick = createJoystickModule(440, 320);
    const servo = createServoMotor(560, 180);
    components.push(joystick, servo);
    createWire(wires, board, "5V", joystick, "VCC", "#EF4444");
    createWire(wires, board, "GND-1", joystick, "GND", "#1F2937");
    createWire(wires, joystick, "VRX", board, "A0", "#2563EB");
    createWire(wires, joystick, "VRY", board, "A1", "#10B981");
    createWire(wires, joystick, "SW", board, "D2", "#F59E0B");
    createWire(wires, board, "5V", servo, "VCC", "#EF4444");
    createWire(wires, board, "GND-2", servo, "GND", "#1F2937");
    createWire(wires, servo, "SIG", board, "D9", "#F59E0B");
    focusComponentId = servo.id;
  } else if (id === "relay-controlled-lamp") {
    const relay = createRelayModule(400, 225);
    const resistor = createResistor(565, 255, 220);
    const led = createLED(675, 245, "green");
    components.push(relay, resistor, led);
    createWire(wires, board, "5V", relay, "VCC", "#EF4444");
    createWire(wires, board, "GND-1", relay, "GND", "#1F2937");
    createWire(wires, board, "D7", relay, "IN", "#F59E0B");
    createWire(wires, board, "5V", relay, "COM", "#EF4444");
    createWire(wires, relay, "NO", resistor, "A", "#10B981");
    createWire(wires, resistor, "B", led, "ANODE", "#10B981");
    createWire(wires, led, "CATHODE", board, "GND-2", "#1F2937");
    focusComponentId = relay.id;
  } else if (id === "tmp36-temperature-alarm") {
    const sensor = createTmp36Sensor(430, 260);
    const branch = createLedBranch(board, 8, "red");
    components.push(sensor, branch.resistor, branch.led);
    wires.push(...branch.wires);
    createWire(wires, board, "5V", sensor, "VCC", "#EF4444");
    createWire(wires, board, "GND-1", sensor, "GND", "#1F2937");
    createWire(wires, sensor, "VOUT", board, "A0", "#F97316");
    focusComponentId = sensor.id;
  } else if (id === "ultrasonic-distance-alarm") {
    const sensor = createHcSr04Sensor(405, 225);
    const branch = createLedBranch(board, 8, "yellow");
    components.push(sensor, branch.resistor, branch.led);
    wires.push(...branch.wires);
    createWire(wires, board, "5V", sensor, "VCC", "#EF4444");
    createWire(wires, board, "GND-1", sensor, "GND", "#1F2937");
    createWire(wires, board, "D3", sensor, "TRIG", "#F59E0B");
    createWire(wires, sensor, "ECHO", board, "D2", "#2563EB");
    focusComponentId = sensor.id;
  } else if (id === "pir-motion-light") {
    const pir = createPirSensor(445, 235);
    const branch = createLedBranch(board, 8, "green");
    components.push(pir, branch.resistor, branch.led);
    wires.push(...branch.wires);
    createWire(wires, board, "5V", pir, "VCC", "#EF4444");
    createWire(wires, board, "GND-1", pir, "GND", "#1F2937");
    createWire(wires, pir, "OUT", board, "D2", "#8B5CF6");
    focusComponentId = pir.id;
  } else if (id === "dc-motor-hbridge") {
    const driver = createHBridgeDriver(370, 210);
    const motor = createDcMotor(600, 230);
    components.push(driver, motor);
    createWire(wires, board, "5V", driver, "VCC", "#EF4444");
    createWire(wires, board, "5V", driver, "VM", "#EF4444");
    createWire(wires, board, "GND-1", driver, "GND", "#1F2937");
    createWire(wires, board, "D3", driver, "ENA", "#2563EB");
    createWire(wires, board, "D4", driver, "IN1", "#10B981");
    createWire(wires, board, "D5", driver, "IN2", "#F59E0B");
    createWire(wires, driver, "OUT1", motor, "M+", "#EF4444");
    createWire(wires, driver, "OUT2", motor, "M-", "#1F2937");
    focusComponentId = driver.id;
  }

  return addProject(id, meta.name, meta.description, components, wires, focusComponentId);
}
