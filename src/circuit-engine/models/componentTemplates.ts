import { BuzzerType, ComponentInstance, Terminal, TerminalType } from "@/types/circuit";
import { generateId } from "@/lib/utils";

// Helper to create terminal
function t(componentId: string, label: string, type: TerminalType, dx: number, dy: number): Terminal {
  return {
    id: `${componentId}-${label}`,
    componentId,
    label,
    type,
    dx,
    dy,
    connected: false,
  };
}

export function createArduinoUno(x = 100, y = 100): ComponentInstance {
  const id = generateId("arduino");
  const w = 280;
  const h = 180;
  const terminals: Terminal[] = [];

  // Digital pins D0-D13 (right side)
  for (let i = 0; i <= 13; i++) {
    terminals.push(t(id, `D${i}`, "digital", w - 8, 20 + i * 10.5));
  }
  // Analog A0-A5 (left bottom)
  for (let i = 0; i <= 5; i++) {
    terminals.push(t(id, `A${i}`, "analog", 8, 20 + i * 10.5));
  }
  // Power pins
  terminals.push(t(id, "5V", "power", 8, 100));
  terminals.push(t(id, "3.3V", "power", 8, 115));
  terminals.push(t(id, "VIN", "power", 8, 130));
  terminals.push(t(id, "GND-1", "gnd", 40, h - 8));
  terminals.push(t(id, "GND-2", "gnd", 80, h - 8));
  terminals.push(t(id, "RESET", "other", w - 40, h - 8));
  terminals.push(t(id, "IOREF", "other", 8, 145));

  return {
    id,
    type: "arduino-uno",
    x,
    y,
    rotation: 0,
    width: w,
    height: h,
    label: "Arduino Uno R3",
    terminals,
    properties: {
      board: "Arduino Uno R3",
      mcu: "ATmega328P",
      digitalPins: "D0–D13",
      analogPins: "A0–A5",
      power: "5V / 3.3V / GND",
    },
  };
}

export function createBreadboard(x = 100, y = 320): ComponentInstance {
  const id = generateId("breadboard");
  const w = 360;
  const h = 160;
  const terminals: Terminal[] = [];

  // Breadboard holes: simplified - 30 columns x 10 rows (5 per side x2) + power rails
  // Left side terminal strips: 30 columns * 5 rows (top half)
  // We'll create terminals for each hole for visual wiring, but logically grouped in strips
  // For M1 visual, we expose each hole as terminal
  const cols = 30;
  const holeSpacing = 10;
  const offsetX = 18;
  const offsetYT1 = 26;
  const offsetYT2 = 86; // second half after trench

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < 5; row++) {
      // Top half
      const label = `T-${col}-${row}`;
      terminals.push(t(id, label, "breadboard-hole", offsetX + col * holeSpacing, offsetYT1 + row * holeSpacing));
      // Bottom half
      const label2 = `B-${col}-${row}`;
      terminals.push(t(id, label2, "breadboard-hole", offsetX + col * holeSpacing, offsetYT2 + row * holeSpacing));
    }
  }
  // Power rails top and bottom: 2 rails each with 30 holes
  for (let col = 0; col < 30; col++) {
    terminals.push(t(id, `R_TOP+_${col}`, "breadboard-hole", offsetX + col * holeSpacing, 8));
    terminals.push(t(id, `R_TOP-_${col}`, "breadboard-hole", offsetX + col * holeSpacing, 18));
    terminals.push(t(id, `R_BOT+_${col}`, "breadboard-hole", offsetX + col * holeSpacing, h - 18));
    terminals.push(t(id, `R_BOT-_${col}`, "breadboard-hole", offsetX + col * holeSpacing, h - 8));
  }

  return {
    id,
    type: "breadboard",
    x,
    y,
    rotation: 0,
    width: w,
    height: h,
    label: "830-Point Breadboard",
    terminals,
    properties: {
      model: "MB-102 / 830-point",
      strips: "30 x 5-hole groups per side",
      rails: "2x power rails (split)",
      trench: "Center隔离, not connected",
    },
  };
}

export function createLED(x = 200, y = 200, color: string = "red"): ComponentInstance {
  const id = generateId("led");
  const w = 44;
  const h = 64;
  // For breadboard LED, we use two leg terminals
  // Actually LED as discrete: two terminals at bottom
  // We'll keep two terminals
  return {
    id,
    type: "led",
    x,
    y,
    rotation: 0,
    width: w,
    height: h,
    label: `${color.toUpperCase()} LED`,
    terminals: [
      { id: `${id}-ANODE`, componentId: id, label: "ANODE", type: "led-anode", dx: 12, dy: h - 8, connected: false },
      { id: `${id}-CATHODE`, componentId: id, label: "CATHODE", type: "led-cathode", dx: 32, dy: h - 8, connected: false },
    ],
    properties: {
      color,
      anode: "Long leg (+)",
      cathode: "Short leg / flat (-)",
      forwardVoltage: "1.8–2.2V",
    },
  };
}

export function createRGBLED(x = 300, y = 180): ComponentInstance {
  const id = generateId("rgb-led");
  return {
    id,
    type: "rgb-led",
    x,
    y,
    rotation: 0,
    width: 80,
    height: 76,
    label: "RGB LED",
    terminals: [
      t(id, "R", "led-anode", 12, 68),
      t(id, "G", "led-anode", 31, 68),
      t(id, "B", "led-anode", 50, 68),
      t(id, "COMMON", "led-cathode", 69, 68),
    ],
    properties: { common: "cathode", polarity: "Common cathode (to GND)" },
  };
}

export function createSevenSegmentDisplay(x = 300, y = 180): ComponentInstance {
  const id = generateId("seven-segment");
  const labels = ["A", "B", "C", "D", "E", "F", "G", "DP", "COM1", "COM2"];
  return {
    id,
    type: "seven-segment",
    x,
    y,
    rotation: 0,
    width: 190,
    height: 170,
    label: "7-Segment Display",
    terminals: labels.map((label, index) => t(id, label, label.startsWith("COM") ? "led-cathode" : "led-anode", 10 + index * 18, 160)),
    properties: { displayType: "single digit", common: "cathode", segments: "A–G + DP" },
  };
}

export function createResistor(x = 200, y = 250, resistance = 220): ComponentInstance {
  const id = generateId("resistor");
  const w = 60;
  const h = 18;
  return {
    id,
    type: "resistor",
    x,
    y,
    rotation: 0,
    width: w,
    height: h,
    label: `${resistance}Ω Resistor`,
    terminals: [
      { id: `${id}-A`, componentId: id, label: "A", type: "resistor", dx: 4, dy: h / 2, connected: false },
      { id: `${id}-B`, componentId: id, label: "B", type: "resistor", dx: w - 4, dy: h / 2, connected: false },
    ],
    properties: {
      resistance: `${resistance} Ω`,
      tolerance: "±5%",
      power: "0.25W",
      bands: resistance === 220 ? "Red-Red-Brown-Gold" : "—",
    },
  };
}

export function createPushButton(x = 200, y = 280): ComponentInstance {
  const id = generateId("btn");
  const w = 48;
  const h = 48;
  return {
    id,
    type: "pushbutton",
    x,
    y,
    rotation: 0,
    width: w,
    height: h,
    label: "Pushbutton",
    terminals: [
      t(id, "1A", "generic", 8, 8),
      t(id, "1B", "generic", 8, 40),
      t(id, "2A", "generic", 40, 8),
      t(id, "2B", "generic", 40, 40),
    ],
    properties: { kind: "Normally open momentary", pressed: false },
  };
}

export function createSlideSwitch(x = 220, y = 320): ComponentInstance {
  const id = generateId("switch");
  return {
    id,
    type: "slide-switch",
    x,
    y,
    rotation: 0,
    width: 78,
    height: 48,
    label: "Slide Switch",
    terminals: [
      t(id, "A", "generic", 5, 24),
      t(id, "B", "generic", 73, 24),
    ],
    properties: { switchType: "SPST latched", isOn: false },
  };
}

export function createJoystickModule(x = 420, y = 280): ComponentInstance {
  const id = generateId("joystick");
  return {
    id,
    type: "joystick",
    x,
    y,
    rotation: 0,
    width: 116,
    height: 148,
    label: "XY Joystick Module",
    terminals: [
      t(id, "VCC", "power", 12, 136),
      t(id, "GND", "gnd", 35, 136),
      t(id, "VRX", "analog", 58, 136),
      t(id, "VRY", "analog", 81, 136),
      t(id, "SW", "generic", 104, 136),
    ],
    properties: { xValue: 512, yValue: 512 },
  };
}

export function createServoMotor(x = 420, y = 300): ComponentInstance {
  const id = generateId("servo");
  return {
    id,
    type: "servo",
    x,
    y,
    rotation: 0,
    width: 116,
    height: 112,
    label: "Micro Servo Motor",
    terminals: [
      t(id, "VCC", "power", 16, 96),
      t(id, "GND", "gnd", 48, 96),
      t(id, "SIG", "digital", 100, 96),
    ],
    properties: { angle: 90, pulseMicroseconds: 1500, refreshHz: 50 },
  };
}

export function createDcMotor(x = 500, y = 300): ComponentInstance {
  const id = generateId("motor");
  return {
    id,
    type: "dc-motor",
    x,
    y,
    rotation: 0,
    width: 104,
    height: 92,
    label: "DC Motor",
    terminals: [
      t(id, "M+", "generic", 30, 82),
      t(id, "M-", "generic", 74, 82),
    ],
    properties: { nominalSpeedRpm: 3000 },
  };
}

export function createHBridgeDriver(x = 330, y = 250): ComponentInstance {
  const id = generateId("hbridge");
  return {
    id,
    type: "h-bridge",
    x,
    y,
    rotation: 0,
    width: 168,
    height: 116,
    label: "L298N H-Bridge Driver",
    terminals: [
      t(id, "VCC", "power", 8, 20),
      t(id, "VM", "power", 8, 42),
      t(id, "GND", "gnd", 8, 68),
      t(id, "ENA", "digital", 60, 8),
      t(id, "IN1", "digital", 84, 8),
      t(id, "IN2", "digital", 108, 8),
      t(id, "OUT1", "generic", 160, 38),
      t(id, "OUT2", "generic", 160, 68),
    ],
    properties: { driverModel: "L298N", channel: "A", enablePinSupportsPwm: true },
  };
}

export function createPotentiometer(x = 200, y = 360): ComponentInstance {
  const id = generateId("pot");
  return {
    id,
    type: "potentiometer",
    x,
    y,
    rotation: 0,
    width: 78,
    height: 88,
    label: "10kΩ Potentiometer",
    terminals: [
      t(id, "GND", "gnd", 12, 80),
      t(id, "WIPER", "analog", 39, 80),
      t(id, "5V", "power", 66, 80),
    ],
    properties: { resistance: "10 kΩ", value: 512 },
  };
}

export function createLdrSensor(x = 220, y = 360): ComponentInstance {
  const id = generateId("ldr");
  return {
    id,
    type: "ldr",
    x,
    y,
    rotation: 0,
    width: 88,
    height: 94,
    label: "LDR Light Sensor",
    terminals: [
      t(id, "VCC", "power", 15, 85),
      t(id, "GND", "gnd", 44, 85),
      t(id, "AO", "analog", 73, 85),
    ],
    properties: { lightLevel: 50 },
  };
}

export function createBuzzer(x = 200, y = 300, buzzerType: BuzzerType = "active"): ComponentInstance {
  const id = generateId("buzzer");
  const label = `${buzzerType === "active" ? "Active" : "Passive"} Buzzer`;
  return {
    id,
    type: "buzzer",
    x,
    y,
    rotation: 0,
    width: 56,
    height: 64,
    label,
    terminals: [
      t(id, "+", "power", 16, 58),
      t(id, "-", "gnd", 40, 58),
    ],
    properties: { buzzerType, frequency: 2300 },
  };
}

export const COMPONENT_META = {
  "arduino-uno": { name: "Arduino Uno R3", category: "Microcontrollers", color: "#0F2142", icon: "🖥️" },
  breadboard: { name: "Breadboard 830", category: "Prototyping", color: "#374151", icon: "▦" },
  led: { name: "LED", category: "Basic Components", color: "#EF4444", icon: "💡" },
  "rgb-led": { name: "RGB LED", category: "Basic Components", color: "#7C3AED", icon: "🌈" },
  "seven-segment": { name: "7-Segment Display", category: "Basic Components", color: "#B91C1C", icon: "🔢" },
  resistor: { name: "Resistor 220Ω", category: "Basic Components", color: "#D97706", icon: "〰️" },
  pushbutton: { name: "Pushbutton", category: "Basic Components", color: "#6B7280", icon: "🔘" },
  "slide-switch": { name: "Slide Switch", category: "Basic Components", color: "#0E7490", icon: "↔" },
  joystick: { name: "XY Joystick Module", category: "Sensors", color: "#2563EB", icon: "🎮" },
  potentiometer: { name: "Potentiometer 10kΩ", category: "Basic Components", color: "#0E9A8B", icon: "🎛️" },
  ldr: { name: "LDR Light Sensor", category: "Sensors", color: "#D97706", icon: "☀️" },
  buzzer: { name: "Buzzer", category: "Basic Components", color: "#4B5563", icon: "🔊" },
  wire: { name: "Jumper Wire", category: "Wiring", color: "#3B82F6", icon: "〰" },
};
