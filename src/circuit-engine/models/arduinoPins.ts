/**
 * Arduino Uno R3 pin mapping — accurate to hardware
 * Digital D0-D13, Analog A0-A5, Power 5V/3.3V, GND(x3), RESET, VIN, IOREF, AREF
 * We use label as terminal label, not physical package pin numbers
 */

export interface ArduinoPin {
  label: string;
  type: "digital" | "analog" | "power" | "gnd" | "reset" | "other";
  number?: number;
  capabilities: string[];
  terminalId: (boardId: string) => string;
}

export const ARDUINO_UNO_PINS: ArduinoPin[] = [
  // Digital (right side)
  { label: "D0", type: "digital", number: 0, capabilities: ["RX", "digital", "interrupt"], terminalId: (id) => `${id}-D0` },
  { label: "D1", type: "digital", number: 1, capabilities: ["TX", "digital"], terminalId: (id) => `${id}-D1` },
  { label: "D2", type: "digital", number: 2, capabilities: ["digital", "interrupt", "PWM"], terminalId: (id) => `${id}-D2` },
  { label: "D3", type: "digital", number: 3, capabilities: ["digital", "PWM"], terminalId: (id) => `${id}-D3` },
  { label: "D4", type: "digital", number: 4, capabilities: ["digital"], terminalId: (id) => `${id}-D4` },
  { label: "D5", type: "digital", number: 5, capabilities: ["digital", "PWM"], terminalId: (id) => `${id}-D5` },
  { label: "D6", type: "digital", number: 6, capabilities: ["digital", "PWM"], terminalId: (id) => `${id}-D6` },
  { label: "D7", type: "digital", number: 7, capabilities: ["digital"], terminalId: (id) => `${id}-D7` },
  { label: "D8", type: "digital", number: 8, capabilities: ["digital"], terminalId: (id) => `${id}-D8` },
  { label: "D9", type: "digital", number: 9, capabilities: ["digital", "PWM"], terminalId: (id) => `${id}-D9` },
  { label: "D10", type: "digital", number: 10, capabilities: ["digital", "PWM", "SS"], terminalId: (id) => `${id}-D10` },
  { label: "D11", type: "digital", number: 11, capabilities: ["digital", "PWM", "MOSI"], terminalId: (id) => `${id}-D11` },
  { label: "D12", type: "digital", number: 12, capabilities: ["digital", "MISO"], terminalId: (id) => `${id}-D12` },
  { label: "D13", type: "digital", number: 13, capabilities: ["digital", "SCK", "LED"], terminalId: (id) => `${id}-D13` },
  // Analog
  { label: "A0", type: "analog", number: 0, capabilities: ["analog", "digital"], terminalId: (id) => `${id}-A0` },
  { label: "A1", type: "analog", number: 1, capabilities: ["analog", "digital"], terminalId: (id) => `${id}-A1` },
  { label: "A2", type: "analog", number: 2, capabilities: ["analog", "digital"], terminalId: (id) => `${id}-A2` },
  { label: "A3", type: "analog", number: 3, capabilities: ["analog", "digital"], terminalId: (id) => `${id}-A3` },
  { label: "A4", type: "analog", number: 4, capabilities: ["analog", "digital", "SDA"], terminalId: (id) => `${id}-A4` },
  { label: "A5", type: "analog", number: 5, capabilities: ["analog", "digital", "SCL"], terminalId: (id) => `${id}-A5` },
  // Power
  { label: "5V", type: "power", capabilities: ["power", "5V"], terminalId: (id) => `${id}-5V` },
  { label: "3.3V", type: "power", capabilities: ["power", "3.3V"], terminalId: (id) => `${id}-3.3V` },
  { label: "VIN", type: "power", capabilities: ["power", "VIN"], terminalId: (id) => `${id}-VIN` },
  { label: "IOREF", type: "other", capabilities: ["other"], terminalId: (id) => `${id}-IOREF` },
  { label: "RESET", type: "reset", capabilities: ["reset"], terminalId: (id) => `${id}-RESET` },
  // GND (two physical positions)
  { label: "GND-1", type: "gnd", capabilities: ["gnd"], terminalId: (id) => `${id}-GND-1` },
  { label: "GND-2", type: "gnd", capabilities: ["gnd"], terminalId: (id) => `${id}-GND-2` },
];

export function findPin(label: string) {
  return ARDUINO_UNO_PINS.find((p) => p.label === label);
}

export function isGND(label: string) {
  return label.startsWith("GND") || label === "GND";
}
export function isDigitalPin(label: string) {
  return /^D\d+$/.test(label);
}
