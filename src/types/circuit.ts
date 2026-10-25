export type BuzzerType = "active" | "passive";

export type ComponentType =
  | "arduino-uno"
  | "breadboard"
  | "led"
  | "rgb-led"
  | "seven-segment"
  | "resistor"
  | "pushbutton"
  | "slide-switch"
  | "joystick"
  | "servo"
  | "dc-motor"
  | "h-bridge"
  | "potentiometer"
  | "ldr"
  | "buzzer"
  | "wire";

export type TerminalType = "digital" | "analog" | "power" | "gnd" | "led-anode" | "led-cathode" | "resistor" | "breadboard-hole" | "generic" | "other";

export type ComponentPropertyValue = string | number | boolean | null;
export type ComponentProperties = Record<string, ComponentPropertyValue>;

export interface Terminal {
  id: string;
  componentId: string;
  label: string;
  type: TerminalType;
  // position relative to component (0-1 normalized or pixel offset)
  dx: number;
  dy: number;
  // computed world position (component x + dx, y + dy) - updated on move
  x?: number;
  y?: number;
  connected: boolean;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
  label?: string;
  terminals: Terminal[];
  properties: ComponentProperties;
  selected?: boolean;
}

export interface Wire {
  id: string;
  startTerminalId: string;
  endTerminalId: string;
  startComponentId: string;
  endComponentId: string;
  color: string;
  selected?: boolean;
}

export interface Project {
  id: string;
  name: string;
  components: ComponentInstance[];
  wires: Wire[];
  code: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type SimulationState = "IDLE" | "VALIDATING" | "COMPILING" | "RUNNING" | "STOPPED" | "ERROR" | "RESET";

export interface SimulationEvent {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "pin-change" | "serial";
  message: string;
}

export type ConsoleTab = "serial" | "logs" | "validation" | "events";

export const STARTER_CODE = `const int ledPin = 8;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);

  digitalWrite(ledPin, LOW);
  delay(1000);
}
`;

export const SERIAL_DEMO_CODE = `void setup() {
  Serial.begin(9600);
  Serial.println("Virtual Arduino Lab ready");
}

void loop() {
  Serial.println("Running");
  delay(1000);
}
`;

export type WireColor = "red" | "black" | "blue" | "green" | "yellow" | "orange" | "purple";

export const WIRE_COLORS: Record<WireColor, string> = {
  red: "#EF4444",
  black: "#1F2937",
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#EAB308",
  orange: "#F97316",
  purple: "#8B5CF6",
};

export interface BreadboardHole {
  id: string;
  x: number;
  y: number;
  row: number;
  col: number;
  side: "left" | "right" | "top-rail" | "bottom-rail";
  stripId: string;
}

export interface ArduinoPinDef {
  id: string;
  label: string;
  type: "digital" | "analog" | "power" | "gnd" | "reset" | "other";
  number?: number;
  capability: string[];
}
