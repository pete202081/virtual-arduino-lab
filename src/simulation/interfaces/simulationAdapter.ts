/**
 * Safe, intentionally small Arduino sketch interpreter for the M4 hero path.
 * It parses a bounded subset of C-like statements and never evaluates user code.
 */
import { ComponentInstance, Wire } from "@/types/circuit";
import { buildCircuitGraph } from "@/circuit-engine/graph/netGraph";

export type PinLevel = "HIGH" | "LOW";
export type PinMode = "OUTPUT" | "INPUT" | "INPUT_PULLUP";
export type Instruction =
  | { kind: "pinMode"; pin: number; mode: PinMode; line: number }
  | { kind: "digitalWrite"; pin: number; level: PinLevel; line: number }
  | { kind: "analogWrite"; pin: number; value: number; line: number }
  | { kind: "servoAttach"; servo: string; pin: number; line: number }
  | { kind: "servoWrite"; servo: string; angle: number; line: number }
  | { kind: "delay"; milliseconds: number; line: number }
  | { kind: "serialBegin"; baud: number; line: number }
  | { kind: "serialPrint"; text: string; newline: boolean; line: number }
  | { kind: "tone"; pin: number; frequency: number; duration?: number; line: number }
  | { kind: "noTone"; pin: number; line: number }
  | { kind: "conditional"; sensor: "digital"; pin: number; operator: "==" | "!="; value: PinLevel; whenTrue: Instruction[]; whenFalse: Instruction[]; line: number }
  | { kind: "conditional"; sensor: "analog" | "pulse"; pin: number; operator: "==" | "!=" | ">" | "<" | ">=" | "<="; value: number; timeoutMicroseconds?: number; whenTrue: Instruction[]; whenFalse: Instruction[]; line: number };

export interface SimulationProgram {
  setup: Instruction[];
  loop: Instruction[];
}
export interface AdapterError { line: number; message: string }
export interface SimulationCompileResult { success: boolean; program?: SimulationProgram; errors: AdapterError[] }

function removeComments(source: string): string {
  let out = "";
  let quote = "";
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === "\"" || ch === "'") { quote = ch; out += ch; continue; }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") { out += " "; i++; }
      if (i < source.length) out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      out += "  "; i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) { out += source[i] === "\n" ? "\n" : " "; i++; }
      if (i < source.length) { out += "  "; i++; }
      continue;
    }
    out += ch;
  }
  return out;
}
function splitArguments(input: string): string[] {
  const args: string[] = [];
  let start = 0;
  let quote = "";
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
    } else if (ch === "\"" || ch === "'") quote = ch;
    else if (ch === ",") { args.push(input.slice(start, i).trim()); start = i + 1; }
  }
  args.push(input.slice(start).trim());
  return args;
}
function findFunctionBody(source: string, name: "setup" | "loop"): { body: string; start: number } | null {
  const match = new RegExp(`\\bvoid\\s+${name}\\s*\\(\\s*\\)\\s*\\{`).exec(source);
  if (!match) return null;
  const open = source.indexOf("{", match.index);
  let depth = 1;
  let quote = "";
  let escaped = false;
  for (let i = open + 1; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === "\"" || ch === "'") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return { body: source.slice(open + 1, i), start: open + 1 };
  }
  return null;
}
function lineAt(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}
function resolveValue(token: string, constants: Map<string, number>): number | undefined {
  const value = token.trim();
  if (/^\d+$/.test(value)) return Number(value);
  if (/^A[0-5]$/.test(value)) return Number(value.slice(1));
  return constants.get(value);
}

function parseFunctionBody(
  source: string,
  body: string,
  bodyStart: number,
  constants: Map<string, number>,
  servoObjects: ReadonlySet<string>,
): { instructions: Instruction[]; errors: AdapterError[] } {
  const errors: AdapterError[] = [];
  let statementCount = 0;

  const parseSimple = (raw: string, offset: number): Instruction | null => {
    const line = lineAt(source, bodyStart + offset);
    const servoCall = /^([A-Za-z_]\w*)\.(attach|write)\s*\((.*)\)$/.exec(raw);
    if (servoCall) {
      const [, servo, method, argumentText] = servoCall;
      if (!servoObjects.has(servo)) {
        errors.push({ line, message: `${servo}.${method}() requires a declared Servo object, for example: Servo arm;` });
        return null;
      }
      const servoArgs = splitArguments(argumentText);
      if (servoArgs.length !== 1) {
        errors.push({ line, message: `${servo}.${method}() requires exactly one argument.` });
        return null;
      }
      const value = resolveValue(servoArgs[0], constants);
      if (method === "attach") {
        if (value === undefined || value < 2 || value > 13) errors.push({ line, message: `${servo}.attach() supports a numeric or constant digital pin from D2 to D13.` });
        else return { kind: "servoAttach", servo, pin: value, line };
      } else {
        if (value === undefined || value < 0 || value > 180) errors.push({ line, message: `${servo}.write() angle must resolve to an integer from 0 to 180 degrees.` });
        else return { kind: "servoWrite", servo, angle: value, line };
      }
      return null;
    }
    const call = /^(pinMode|digitalWrite|analogWrite|delay|delayMicroseconds|tone|noTone|Serial\.begin|Serial\.print|Serial\.println)\s*\((.*)\)$/.exec(raw);
    if (!call) {
      errors.push({ line, message: `M4 adapter cannot execute this statement: ${raw.slice(0, 80)}. Supported: pinMode, digitalWrite, digitalRead conditions, delay, Serial.print/println.` });
      return null;
    }
    const fn = call[1];
    const args = splitArguments(call[2]);
    const arity = (expected: number) => {
      if (args.length !== expected) errors.push({ line, message: `${fn}() requires ${expected} argument(s).` });
      return args.length === expected;
    };
    if (fn === "pinMode") {
      if (!arity(2)) return null;
      const pin = resolveValue(args[0], constants);
      const mode = args[1];
      if (pin === undefined || pin < 0 || pin > 13) errors.push({ line, message: `pinMode() pin must resolve to a digital pin from 0 to 13; got ${args[0]}.` });
      else if (mode !== "OUTPUT" && mode !== "INPUT" && mode !== "INPUT_PULLUP") errors.push({ line, message: `Unsupported pinMode value ${mode}; use OUTPUT, INPUT, or INPUT_PULLUP.` });
      else return { kind: "pinMode", pin, mode, line };
    } else if (fn === "digitalWrite") {
      if (!arity(2)) return null;
      const pin = resolveValue(args[0], constants);
      const level = args[1];
      if (pin === undefined || pin < 0 || pin > 13) errors.push({ line, message: `digitalWrite() pin must resolve to a digital pin from 0 to 13; got ${args[0]}.` });
      else if (level !== "HIGH" && level !== "LOW") errors.push({ line, message: `digitalWrite() value must be HIGH or LOW; got ${level}.` });
      else return { kind: "digitalWrite", pin, level, line };
    } else if (fn === "analogWrite") {
      if (!arity(2)) return null;
      const pin = resolveValue(args[0], constants);
      const value = /^A[0-5]$/.test(args[1]) ? undefined : resolveValue(args[1], constants);
      if (pin === undefined || ![3, 5, 6, 9, 10, 11].includes(pin)) errors.push({ line, message: `analogWrite() supports only Uno PWM pins 3, 5, 6, 9, 10, and 11; got ${args[0]}.` });
      else if (value === undefined || value < 0 || value > 255) errors.push({ line, message: `analogWrite() value must resolve to an integer from 0 to 255; got ${args[1]}.` });
      else return { kind: "analogWrite", pin, value, line };
    } else if (fn === "tone") {
      if (args.length !== 2 && args.length !== 3) {
        errors.push({ line, message: "tone() requires a pin, frequency, and optional duration in milliseconds." });
        return null;
      }
      const pin = resolveValue(args[0], constants);
      const frequency = resolveValue(args[1], constants);
      const duration = args.length === 3 ? resolveValue(args[2], constants) : undefined;
      if (pin === undefined || pin < 0 || pin > 13) errors.push({ line, message: `tone() pin must resolve to a digital pin from 0 to 13; got ${args[0]}.` });
      else if (frequency === undefined || frequency < 20 || frequency > 20_000) errors.push({ line, message: "tone() frequency must be a numeric value from 20 to 20000 Hz." });
      else if (args.length === 3 && (duration === undefined || duration < 1 || duration > 60_000)) errors.push({ line, message: "tone() duration must resolve to a value from 1 to 60000 ms." });
      else return { kind: "tone", pin, frequency, duration, line };
    } else if (fn === "noTone") {
      if (!arity(1)) return null;
      const pin = resolveValue(args[0], constants);
      if (pin === undefined || pin < 0 || pin > 13) errors.push({ line, message: `noTone() pin must resolve to a digital pin from 0 to 13; got ${args[0]}.` });
      else return { kind: "noTone", pin, line };
    } else if (fn === "delay" || fn === "delayMicroseconds") {
      if (!arity(1)) return null;
      const value = resolveValue(args[0], constants);
      const milliseconds = fn === "delayMicroseconds" ? (value ?? -1) / 1000 : value;
      if (milliseconds === undefined || milliseconds < 0 || milliseconds > 60_000) errors.push({ line, message: `${fn}() must resolve to a value between 0 and 60000 ms.` });
      else return { kind: "delay", milliseconds, line };
    } else if (fn === "Serial.begin") {
      if (!arity(1)) return null;
      const baud = resolveValue(args[0], constants);
      if (!baud || baud < 300 || baud > 2_000_000) errors.push({ line, message: "Serial.begin() baud must be a numeric value from 300 to 2000000." });
      else return { kind: "serialBegin", baud, line };
    } else {
      if (!arity(1)) return null;
      const textArg = args[0];
      const stringMatch = /^"((?:\\.|[^"\\])*)"$/.exec(textArg);
      const numericOrConstant = resolveValue(textArg, constants);
      if (!stringMatch && numericOrConstant === undefined) errors.push({ line, message: `${fn}() currently accepts a string literal or numeric constant.` });
      else return { kind: "serialPrint", text: stringMatch ? stringMatch[1].replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"') : String(numericOrConstant), newline: fn === "Serial.println", line };
    }
    return null;
  };

  const parseBlock = (initial: number, nested = false, depth = 0): { instructions: Instruction[]; index: number } => {
    const instructions: Instruction[] = [];
    let index = initial;
    if (depth > 12) {
      errors.push({ line: lineAt(source, bodyStart + index), message: "M4 adapter conditional nesting limit is 12." });
      return { instructions, index };
    }
    while (index < body.length) {
      while (/\s/.test(body[index] ?? "")) index++;
      if (body[index] === "}") return { instructions, index: nested ? index + 1 : index };
      if (index >= body.length) break;
      const pulseConditional = /^if\s*\(\s*pulseIn\s*\(\s*([A-Za-z_]\w*|\d+)\s*,\s*HIGH(?:\s*,\s*([A-Za-z_]\w*|\d+))?\s*\)\s*(==|!=|>=|<=|>|<)\s*([A-Za-z_]\w*|\d+)\s*\)\s*\{/.exec(body.slice(index));
      const readConditional = /^if\s*\(\s*(digitalRead|analogRead)\s*\(\s*([A-Za-z_]\w*|\d+)\s*\)\s*(==|!=|>=|<=|>|<)\s*(HIGH|LOW|\d+)\s*\)\s*\{/.exec(body.slice(index));
      const conditional = pulseConditional ?? readConditional;
      if (conditional) {
        const line = lineAt(source, bodyStart + index);
        const sensor = pulseConditional ? "pulse" : readConditional![1] === "analogRead" ? "analog" : "digital";
        const pin = resolveValue(conditional[pulseConditional ? 1 : 2], constants);
        const operator = conditional[pulseConditional ? 3 : 3] as "==" | "!=" | ">" | "<" | ">=" | "<=";
        const rawValue = conditional[pulseConditional ? 4 : 4];
        const timeoutMicroseconds = pulseConditional ? resolveValue(pulseConditional[2] ?? "30000", constants) : undefined;
        const open = index + conditional[0].length - 1;
        const thenBlock = parseBlock(open + 1, true, depth + 1);
        index = thenBlock.index;
        let elseInstructions: Instruction[] = [];
        const afterWhitespace = index + (body.slice(index).match(/^\s*/)?.[0].length ?? 0);
        if (/^else\b/.test(body.slice(afterWhitespace))) {
          const elseOpen = body.indexOf("{", afterWhitespace + 4);
          if (elseOpen >= 0) {
            const elseBlock = parseBlock(elseOpen + 1, true, depth + 1);
            elseInstructions = elseBlock.instructions;
            index = elseBlock.index;
          } else {
            errors.push({ line: lineAt(source, bodyStart + afterWhitespace), message: "M4 adapter requires braces around an else block." });
          }
        }
        if (sensor === "digital") {
          if (pin === undefined || pin < 0 || pin > 13 || !["==", "!="].includes(operator) || !["HIGH", "LOW"].includes(rawValue)) {
            errors.push({ line, message: "digitalRead() conditions support digital pins 0–13 compared with == or != HIGH/LOW." });
          } else {
            instructions.push({ kind: "conditional", sensor, pin, operator: operator as "==" | "!=", value: rawValue as PinLevel, whenTrue: thenBlock.instructions, whenFalse: elseInstructions, line });
          }
        } else if (sensor === "analog") {
          const value = resolveValue(rawValue, constants);
          if (pin === undefined || pin < 0 || pin > 5 || value === undefined || value < 0 || value > 1023) {
            errors.push({ line, message: "analogRead() conditions support analog pins A0–A5 compared with a numeric threshold from 0 to 1023." });
          } else {
            instructions.push({ kind: "conditional", sensor, pin, operator, value, whenTrue: thenBlock.instructions, whenFalse: elseInstructions, line });
          }
        } else {
          const value = resolveValue(rawValue, constants);
          if (pin === undefined || pin < 0 || pin > 13 || value === undefined || value < 0 || value > 30_000 || timeoutMicroseconds === undefined || timeoutMicroseconds < 1 || timeoutMicroseconds > 30_000) {
            errors.push({ line, message: "pulseIn() conditions support a digital echo pin, HIGH pulse, and numeric threshold/optional timeout from 1 to 30000 microseconds." });
          } else {
            instructions.push({ kind: "conditional", sensor, pin, operator, value, timeoutMicroseconds, whenTrue: thenBlock.instructions, whenFalse: elseInstructions, line });
          }
        }
        statementCount++;
        continue;
      }
      const statementStart = index;
      let quote = "";
      let escaped = false;
      while (index < body.length) {
        const ch = body[index++];
        if (quote) {
          if (escaped) escaped = false;
          else if (ch === "\\") escaped = true;
          else if (ch === quote) quote = "";
        } else if (ch === '"' || ch === "'") quote = ch;
        else if (ch === ";") break;
        else if (ch === "}") {
          errors.push({ line: lineAt(source, bodyStart + index - 1), message: "Missing semicolon before closing brace." });
          index--;
          break;
        }
      }
      const raw = body.slice(statementStart, index).trim();
      if (!raw) break;
      if (!raw.endsWith(";")) {
        errors.push({ line: lineAt(source, bodyStart + statementStart), message: `M4 adapter found unsupported code without a semicolon: ${raw.slice(0, 60)}.` });
        break;
      }
      const instruction = parseSimple(raw.slice(0, -1).trim(), statementStart);
      if (instruction) instructions.push(instruction);
      statementCount++;
      if (statementCount > 500) {
        errors.push({ line: lineAt(source, bodyStart + statementStart), message: "M4 adapter limit: at most 500 executable statements per function." });
        break;
      }
    }
    return { instructions, index };
  };

  const parsed = parseBlock(0);
  if (body.slice(parsed.index).replace(/[{}\s]/g, "")) errors.push({ line: lineAt(source, bodyStart + parsed.index), message: "M4 adapter found unsupported code after the function body." });
  return { instructions: parsed.instructions, errors };
}

export function compileSimulationProgram(code: string): SimulationCompileResult {
  const clean = removeComments(code);
  const constants = new Map<string, number>();
  const constantRegex = /(?:\bconst\s+)?(?:unsigned\s+)?(?:int|byte|long)\s+([A-Za-z_]\w*)\s*=\s*(\d+|A[0-5])\s*;/g;
  for (const match of clean.matchAll(constantRegex)) constants.set(match[1], /^A[0-5]$/.test(match[2]) ? Number(match[2].slice(1)) : Number(match[2]));
  const setup = findFunctionBody(clean, "setup");
  const loop = findFunctionBody(clean, "loop");
  const errors: AdapterError[] = [];
  if (!setup) errors.push({ line: 1, message: "M4 adapter needs a complete void setup() { ... } function." });
  if (!loop) errors.push({ line: 1, message: "M4 adapter needs a complete void loop() { ... } function." });
  if (!setup || !loop) return { success: false, errors };

  const servoObjects = new Set(Array.from(clean.matchAll(/\bServo\s+([A-Za-z_]\w*)\s*;/g), (match) => match[1]));
  const setupParsed = parseFunctionBody(clean, setup.body, setup.start, constants, servoObjects);
  const loopParsed = parseFunctionBody(clean, loop.body, loop.start, constants, servoObjects);
  errors.push(...setupParsed.errors, ...loopParsed.errors);
  if (!loopParsed.instructions.some((instruction) => instruction.kind === "delay" && instruction.milliseconds > 0)) {
    errors.push({ line: lineAt(clean, loop.start), message: "loop() needs a positive delay() so the browser simulation can yield safely." });
  }
  if (setupParsed.instructions.length + loopParsed.instructions.length > 500) errors.push({ line: 1, message: "M4 adapter limit: at most 500 executable statements per sketch." });
  return errors.length
    ? { success: false, errors }
    : { success: true, errors: [], program: { setup: setupParsed.instructions, loop: loopParsed.instructions } };
}

export interface RuntimeSnapshot {
  modes: ReadonlyMap<number, PinMode>;
  levels: ReadonlyMap<number, PinLevel>;
  pwmLevels?: ReadonlyMap<number, number>;
  servoAngles?: ReadonlyMap<number, number>;
  tones?: ReadonlyMap<number, number>;
  triggeredPins?: ReadonlySet<number>;
}
export interface RuntimeCallbacks {
  onPinChange: (pin: number, level: PinLevel, snapshot: RuntimeSnapshot) => void;
  onPwmChange?: (pin: number, value: number, snapshot: RuntimeSnapshot) => void;
  onServoChange?: (pin: number, angle: number, snapshot: RuntimeSnapshot) => void;
  onDigitalRead: (pin: number, snapshot: RuntimeSnapshot) => PinLevel;
  onPulseIn?: (pin: number, timeoutMicroseconds: number, snapshot: RuntimeSnapshot) => number;
  onAnalogRead: (pin: number, snapshot: RuntimeSnapshot) => number;
  onToneChange: (pin: number, frequency: number | null, snapshot: RuntimeSnapshot) => void;
  onSerial: (text: string) => void;
  onBaud: (baud: number) => void;
  onError: (message: string) => void;
}
export type Schedule = (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
export type CancelSchedule = (timer: ReturnType<typeof setTimeout>) => void;

/** Timer-driven runner with injectable scheduling for deterministic tests. */
export class SimulationRuntime {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private active = false;
  private phase: "setup" | "loop" = "setup";
  private index = 0;
  private activeInstructions: Instruction[] = [];
  private baud = 9600;
  private readonly modes = new Map<number, PinMode>();
  private readonly levels = new Map<number, PinLevel>();
  private readonly pwmLevels = new Map<number, number>();
  private readonly servoAttachments = new Map<string, number>();
  private readonly servoAngles = new Map<number, number>();
  private readonly tones = new Map<number, number>();
  private readonly highPinsSinceLow = new Set<number>();
  private readonly triggeredPins = new Set<number>();
  private readonly toneTimers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly program: SimulationProgram,
    private readonly callbacks: RuntimeCallbacks,
    private readonly schedule: Schedule = (callback, ms) => setTimeout(callback, ms),
    private readonly cancel: CancelSchedule = (timer) => clearTimeout(timer),
  ) {}

  start(): void {
    if (this.active) return;
    this.active = true;
    this.phase = "setup";
    this.index = 0;
    this.activeInstructions = [...this.program.setup];
    this.step();
  }

  stop(): void {
    this.active = false;
    if (this.timer) this.cancel(this.timer);
    this.timer = null;
    for (const timer of this.toneTimers.values()) this.cancel(timer);
    this.toneTimers.clear();
    const soundingPins = Array.from(this.tones.keys());
    this.tones.clear();
    for (const pin of soundingPins) this.callbacks.onToneChange(pin, null, this.snapshot());
  }

  get isRunning(): boolean { return this.active; }

  private snapshot(): RuntimeSnapshot {
    return { modes: new Map(this.modes), levels: new Map(this.levels), pwmLevels: new Map(this.pwmLevels), servoAngles: new Map(this.servoAngles), tones: new Map(this.tones), triggeredPins: new Set(this.triggeredPins) };
  }

  private step = (): void => {
    if (!this.active) return;
    if (this.index >= this.activeInstructions.length) {
      if (this.phase === "setup") {
        this.phase = "loop";
        this.index = 0;
        this.activeInstructions = [...this.program.loop];
      } else {
        this.index = 0;
        this.activeInstructions = [...this.program.loop];
      }
    }
    const instruction = this.activeInstructions[this.index++];
    if (!instruction) { this.timer = this.schedule(this.step, 0); return; }

    if (instruction.kind === "pinMode") {
      this.modes.set(instruction.pin, instruction.mode);
    } else if (instruction.kind === "digitalWrite") {
      this.pwmLevels.delete(instruction.pin);
      if (instruction.level === "HIGH") {
        this.highPinsSinceLow.add(instruction.pin);
        this.triggeredPins.delete(instruction.pin);
      } else if (this.highPinsSinceLow.delete(instruction.pin)) {
        this.triggeredPins.add(instruction.pin);
      }
      this.levels.set(instruction.pin, instruction.level);
      this.callbacks.onPinChange(instruction.pin, instruction.level, this.snapshot());
    } else if (instruction.kind === "analogWrite") {
      this.modes.set(instruction.pin, "OUTPUT");
      const changed = this.pwmLevels.get(instruction.pin) !== instruction.value || this.levels.has(instruction.pin);
      this.levels.delete(instruction.pin);
      this.pwmLevels.set(instruction.pin, instruction.value);
      if (changed) this.callbacks.onPwmChange?.(instruction.pin, instruction.value, this.snapshot());
    } else if (instruction.kind === "servoAttach") {
      const previousPin = this.servoAttachments.get(instruction.servo);
      if (previousPin !== undefined && previousPin !== instruction.pin && !Array.from(this.servoAttachments).some(([name, pin]) => name !== instruction.servo && pin === previousPin)) this.servoAngles.delete(previousPin);
      this.servoAttachments.set(instruction.servo, instruction.pin);
      this.modes.set(instruction.pin, "OUTPUT");
      const changed = this.servoAngles.get(instruction.pin) !== 90;
      this.servoAngles.set(instruction.pin, 90);
      if (changed || previousPin !== instruction.pin) this.callbacks.onServoChange?.(instruction.pin, 90, this.snapshot());
    } else if (instruction.kind === "servoWrite") {
      const pin = this.servoAttachments.get(instruction.servo);
      if (pin === undefined) {
        this.callbacks.onError(`${instruction.servo}.write() was called before ${instruction.servo}.attach(pin).`);
      } else if (this.servoAngles.get(pin) !== instruction.angle) {
        this.servoAngles.set(pin, instruction.angle);
        this.callbacks.onServoChange?.(pin, instruction.angle, this.snapshot());
      }
    } else if (instruction.kind === "delay") {
      this.timer = this.schedule(this.step, Math.max(0, instruction.milliseconds));
      return;
    } else if (instruction.kind === "serialBegin") {
      this.baud = instruction.baud;
      this.callbacks.onBaud(this.baud);
    } else if (instruction.kind === "serialPrint") {
      this.callbacks.onSerial(instruction.text + (instruction.newline ? "\n" : ""));
    } else if (instruction.kind === "tone") {
      const previousTimer = this.toneTimers.get(instruction.pin);
      if (previousTimer) this.cancel(previousTimer);
      this.toneTimers.delete(instruction.pin);
      this.tones.set(instruction.pin, instruction.frequency);
      this.callbacks.onToneChange(instruction.pin, instruction.frequency, this.snapshot());
      if (instruction.duration !== undefined) {
        const timer = this.schedule(() => {
          this.toneTimers.delete(instruction.pin);
          if (!this.active || !this.tones.has(instruction.pin)) return;
          this.tones.delete(instruction.pin);
          this.callbacks.onToneChange(instruction.pin, null, this.snapshot());
        }, instruction.duration);
        this.toneTimers.set(instruction.pin, timer);
      }
    } else if (instruction.kind === "noTone") {
      const timer = this.toneTimers.get(instruction.pin);
      if (timer) this.cancel(timer);
      this.toneTimers.delete(instruction.pin);
      if (this.tones.delete(instruction.pin)) this.callbacks.onToneChange(instruction.pin, null, this.snapshot());
    } else if (instruction.kind === "conditional") {
      const snapshot = this.snapshot();
      let matches: boolean;
      if (instruction.sensor === "digital") {
        const actual = this.callbacks.onDigitalRead(instruction.pin, snapshot);
        matches = instruction.operator === "==" ? actual === instruction.value : actual !== instruction.value;
      } else {
        let actual: number;
        if (instruction.sensor === "analog") actual = this.callbacks.onAnalogRead(instruction.pin, snapshot);
        else {
          actual = this.callbacks.onPulseIn?.(instruction.pin, instruction.timeoutMicroseconds ?? 30_000, snapshot) ?? (instruction.timeoutMicroseconds ?? 30_000);
          this.triggeredPins.clear();
        }
        switch (instruction.operator) {
          case "==": matches = actual === instruction.value; break;
          case "!=": matches = actual !== instruction.value; break;
          case ">": matches = actual > instruction.value; break;
          case "<": matches = actual < instruction.value; break;
          case ">=": matches = actual >= instruction.value; break;
          case "<=": matches = actual <= instruction.value; break;
        }
      }
      this.activeInstructions.splice(this.index, 0, ...(matches ? instruction.whenTrue : instruction.whenFalse));
    }
    this.timer = this.schedule(this.step, 0);
  };

}

/** Read a modeled Uno digital input using active switch nets and the input pull-up model. */
export function readDigitalPin(
  pin: number,
  modes: ReadonlyMap<number, PinMode>,
  components: ComponentInstance[],
  wires: Wire[],
  pressedButtonIds: ReadonlySet<string> = new Set(),
  closedSwitchIds: ReadonlySet<string> = new Set(),
): PinLevel {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const mode = modes.get(pin);
  const boards = components.filter((component) => component.type === "arduino-uno");
  for (const board of boards) {
    const input = board.terminals.find((terminal) => terminal.label === `D${pin}`);
    if (!input) continue;
    const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V");
    const grounds = board.terminals.filter((terminal) => terminal.type === "gnd");
    for (const pir of components.filter((component) => component.type === "pir")) {
      const output = pir.terminals.find((terminal) => terminal.label === "OUT");
      const sensorVcc = pir.terminals.find((terminal) => terminal.label === "VCC");
      const sensorGround = pir.terminals.find((terminal) => terminal.label === "GND");
      if (!output || !sensorVcc || !sensorGround || !fiveVolt || !graph.hasConnection(output.id, input.id)) continue;
      const powered = graph.hasConnection(sensorVcc.id, fiveVolt.id) && grounds.some((terminal) => graph.hasConnection(sensorGround.id, terminal.id));
      if (powered) return pir.properties.motionDetected === true ? "HIGH" : "LOW";
      return mode === "INPUT_PULLUP" ? "HIGH" : "LOW";
    }
    const grounded = grounds.some((terminal) => terminal.type === "gnd" && graph.hasConnection(input.id, terminal.id));
    const powered = board.terminals.some((terminal) => terminal.label === "5V" && graph.hasConnection(input.id, terminal.id));
    if (grounded) return "LOW";
    if (powered) return "HIGH";
  }
  return mode === "INPUT_PULLUP" ? "HIGH" : "LOW";
}

/** Read a modeled Uno analog input from a wired potentiometer, joystick axis, LDR, or TMP36 output. */
export function readAnalogPin(pin: number, components: ComponentInstance[], wires: Wire[]): number {
  if (!Number.isInteger(pin) || pin < 0 || pin > 5) return 0;
  const graph = buildCircuitGraph(components, wires);
  for (const board of components.filter((component) => component.type === "arduino-uno")) {
    const input = board.terminals.find((terminal) => terminal.label === `A${pin}`);
    if (!input) continue;
    const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V");
    const grounds = board.terminals.filter((terminal) => terminal.type === "gnd");
    for (const potentiometer of components.filter((component) => component.type === "potentiometer")) {
      const wiper = potentiometer.terminals.find((terminal) => terminal.label === "WIPER");
      const highEnd = potentiometer.terminals.find((terminal) => terminal.label === "5V");
      const lowEnd = potentiometer.terminals.find((terminal) => terminal.label === "GND");
      if (!wiper || !highEnd || !lowEnd || !fiveVolt) continue;
      const wiperConnected = graph.hasConnection(wiper.id, input.id);
      const highConnected = graph.hasConnection(highEnd.id, fiveVolt.id);
      const lowConnected = grounds.some((ground) => graph.hasConnection(lowEnd.id, ground.id));
      if (!wiperConnected || !highConnected || !lowConnected) continue;
      const value = Number(potentiometer.properties.value);
      return Math.max(0, Math.min(1023, Math.round(Number.isFinite(value) ? value : 0)));
    }
    for (const joystick of components.filter((component) => component.type === "joystick")) {
      const xOutput = joystick.terminals.find((terminal) => terminal.label === "VRX");
      const yOutput = joystick.terminals.find((terminal) => terminal.label === "VRY");
      const moduleVcc = joystick.terminals.find((terminal) => terminal.label === "VCC");
      const moduleGround = joystick.terminals.find((terminal) => terminal.label === "GND");
      if (!xOutput || !yOutput || !moduleVcc || !moduleGround || !fiveVolt) continue;
      const powered = graph.hasConnection(moduleVcc.id, fiveVolt.id);
      const grounded = grounds.some((ground) => graph.hasConnection(moduleGround.id, ground.id));
      if (!powered || !grounded) continue;
      const xConnected = graph.hasConnection(xOutput.id, input.id);
      const yConnected = graph.hasConnection(yOutput.id, input.id);
      if (!xConnected && !yConnected) continue;
      const rawValue = Number(joystick.properties[xConnected ? "xValue" : "yValue"]);
      return Math.max(0, Math.min(1023, Math.round(Number.isFinite(rawValue) ? rawValue : 512)));
    }
    for (const ldr of components.filter((component) => component.type === "ldr")) {
      const output = ldr.terminals.find((terminal) => terminal.label === "AO");
      const sensorVcc = ldr.terminals.find((terminal) => terminal.label === "VCC");
      const sensorGround = ldr.terminals.find((terminal) => terminal.label === "GND");
      if (!output || !sensorVcc || !sensorGround || !fiveVolt) continue;
      const outputConnected = graph.hasConnection(output.id, input.id);
      const vccConnected = graph.hasConnection(sensorVcc.id, fiveVolt.id);
      const groundConnected = grounds.some((ground) => graph.hasConnection(sensorGround.id, ground.id));
      if (!outputConnected || !vccConnected || !groundConnected) continue;
      const lightLevel = Number(ldr.properties.lightLevel);
      const boundedLightLevel = Math.max(0, Math.min(100, Number.isFinite(lightLevel) ? lightLevel : 0));
      return Math.round((boundedLightLevel / 100) * 1023);
    }
    for (const sensor of components.filter((component) => component.type === "tmp36")) {
      const output = sensor.terminals.find((terminal) => terminal.label === "VOUT");
      const sensorVcc = sensor.terminals.find((terminal) => terminal.label === "VCC");
      const sensorGround = sensor.terminals.find((terminal) => terminal.label === "GND");
      if (!output || !sensorVcc || !sensorGround || !fiveVolt) continue;
      const outputConnected = graph.hasConnection(output.id, input.id);
      const vccConnected = graph.hasConnection(sensorVcc.id, fiveVolt.id);
      const groundConnected = grounds.some((ground) => graph.hasConnection(sensorGround.id, ground.id));
      if (!outputConnected || !vccConnected || !groundConnected) continue;
      const rawTemperature = Number(sensor.properties.temperatureC ?? 25);
      const temperatureC = Math.max(-40, Math.min(125, Number.isFinite(rawTemperature) ? rawTemperature : 25));
      const outputMillivolts = Math.max(0, 500 + temperatureC * 10);
      return Math.round((outputMillivolts / 5000) * 1023);
    }
  }
  return 0;
}

/** Resolve an HC-SR04-style echo duration from powered wiring and a fresh modeled TRIG pulse. */
export function readUltrasonicPulseDuration(pin: number, timeoutMicroseconds: number, components: ComponentInstance[], wires: Wire[], snapshot: RuntimeSnapshot): number {
  const timeout = Math.max(1, Math.min(30_000, Math.round(timeoutMicroseconds)));
  if (!Number.isInteger(pin) || pin < 0 || pin > 13) return timeout;
  if (snapshot.modes.get(pin) !== "INPUT" && snapshot.modes.get(pin) !== "INPUT_PULLUP") return timeout;
  const graph = buildCircuitGraph(components, wires);
  for (const board of components.filter((component) => component.type === "arduino-uno")) {
    const echoPin = board.terminals.find((terminal) => terminal.label === `D${pin}`);
    const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V");
    const grounds = board.terminals.filter((terminal) => terminal.type === "gnd");
    if (!echoPin || !fiveVolt) continue;
    for (const sensor of components.filter((component) => component.type === "hc-sr04")) {
      const vcc = sensor.terminals.find((terminal) => terminal.label === "VCC");
      const trig = sensor.terminals.find((terminal) => terminal.label === "TRIG");
      const echo = sensor.terminals.find((terminal) => terminal.label === "ECHO");
      const ground = sensor.terminals.find((terminal) => terminal.label === "GND");
      if (!vcc || !trig || !echo || !ground || !graph.hasConnection(echo.id, echoPin.id)) continue;
      const powered = graph.hasConnection(vcc.id, fiveVolt.id) && grounds.some((terminal) => graph.hasConnection(ground.id, terminal.id));
      if (!powered) continue;
      const triggerPin = board.terminals.find((terminal) => /^D\d+$/.test(terminal.label) && graph.hasConnection(trig.id, terminal.id));
      const triggerNumber = triggerPin ? Number(triggerPin.label.slice(1)) : -1;
      if (triggerNumber < 0 || snapshot.modes.get(triggerNumber) !== "OUTPUT" || !snapshot.triggeredPins?.has(triggerNumber)) continue;
      const rawDistance = Number(sensor.properties.distanceCm ?? 100);
      const distance = Math.max(2, Math.min(400, Number.isFinite(rawDistance) ? rawDistance : 100));
      return Math.min(timeout, Math.round(distance * 58));
    }
  }
  return timeout;
}

export interface BuzzerSignal { componentId: string; frequency: number }

/** Compute audible buzzer state from modeled power/output nets and passive tone commands. */
export function getBuzzerSignals(components: ComponentInstance[], wires: Wire[], snapshot: RuntimeSnapshot, pressedButtonIds: ReadonlySet<string> = new Set(), closedSwitchIds: ReadonlySet<string> = new Set()): BuzzerSignal[] {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const boards = components.filter((component) => component.type === "arduino-uno");
  const signals: BuzzerSignal[] = [];
  for (const buzzer of components.filter((component) => component.type === "buzzer")) {
    const positive = buzzer.terminals.find((terminal) => terminal.label === "+")?.id;
    const negative = buzzer.terminals.find((terminal) => terminal.label === "-")?.id;
    if (!positive || !negative) continue;
    const passive = buzzer.properties.buzzerType === "passive";
    let frequency = 0;
    for (const board of boards) {
      const groundIds = board.terminals.filter((terminal) => terminal.type === "gnd").map((terminal) => terminal.id);
      const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V")?.id;
      if (!passive && fiveVolt && graph.hasConnection(positive, fiveVolt) && groundIds.some((ground) => graph.hasConnection(negative, ground))) {
        frequency = Number(buzzer.properties.frequency) || 2300;
        break;
      }
      for (const terminal of board.terminals) {
        const match = /^D(\d+)$/.exec(terminal.label);
        if (!match) continue;
        const pin = Number(match[1]);
        if (passive) {
          const tone = snapshot.tones?.get(pin);
          if (tone && graph.hasConnection(positive, terminal.id) && groundIds.some((ground) => graph.hasConnection(negative, ground))) frequency = tone;
        } else if (snapshot.modes.get(pin) === "OUTPUT") {
          const level = snapshot.levels.get(pin);
          if (level === "HIGH" && graph.hasConnection(positive, terminal.id) && groundIds.some((ground) => graph.hasConnection(negative, ground))) frequency = Number(buzzer.properties.frequency) || 2300;
          if (level === "LOW" && fiveVolt && graph.hasConnection(positive, fiveVolt) && graph.hasConnection(negative, terminal.id)) frequency = Number(buzzer.properties.frequency) || 2300;
        }
      }
    }
    if (frequency > 0) signals.push({ componentId: buzzer.id, frequency });
  }
  return signals;
}

/** Return modeled 0–255 brightness for LEDs with a forward-biased output path. */
export function getLedBrightnesses(
  components: ComponentInstance[],
  wires: Wire[],
  snapshot: RuntimeSnapshot,
  pressedButtonIds: ReadonlySet<string> = new Set(),
  closedSwitchIds: ReadonlySet<string> = new Set(),
): Array<{ componentId: string; brightness: number }> {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const arduinos = components.filter((component) => component.type === "arduino-uno");
  const results: Array<{ componentId: string; brightness: number }> = [];
  for (const led of components.filter((component) => component.type === "led")) {
    const anode = led.terminals.find((terminal) => terminal.label === "ANODE")?.id;
    const cathode = led.terminals.find((terminal) => terminal.label === "CATHODE")?.id;
    if (!anode || !cathode || graph.hasConnection(anode, cathode)) continue;
    let brightness = 0;
    for (const arduino of arduinos) {
      const pins = arduino.terminals;
      const grounds = pins.filter((terminal) => terminal.type === "gnd");
      const fiveVolt = pins.find((terminal) => terminal.label === "5V");
      for (const pin of pins) {
        const match = /^D(\d+)$/.exec(pin.label);
        if (!match) continue;
        const number = Number(match[1]);
        if (snapshot.modes.get(number) !== "OUTPUT") continue;
        const pwm = snapshot.pwmLevels?.get(number);
        const output = pwm ?? (snapshot.levels.get(number) === "HIGH" ? 255 : 0);
        if (graph.hasConnection(anode, pin.id) && grounds.some((ground) => graph.hasConnection(cathode, ground.id))) {
          brightness = Math.max(brightness, output);
        }
        if (fiveVolt && graph.hasConnection(anode, fiveVolt.id) && graph.hasConnection(cathode, pin.id)) {
          brightness = Math.max(brightness, 255 - output);
        }
      }
    }
    results.push({ componentId: led.id, brightness });
  }
  return results;
}

/** Return IDs of LEDs receiving nonzero current from a modeled Arduino output. */
export function getLitLedIds(
  components: ComponentInstance[],
  wires: Wire[],
  snapshot: RuntimeSnapshot,
  pressedButtonIds: ReadonlySet<string> = new Set(),
  closedSwitchIds: ReadonlySet<string> = new Set(),
): string[] {
  return getLedBrightnesses(components, wires, snapshot, pressedButtonIds, closedSwitchIds)
    .filter((led) => led.brightness > 0)
    .map((led) => led.componentId);
}

export interface RGBLedState {
  componentId: string;
  red: boolean;
  green: boolean;
  blue: boolean;
  redLevel: number;
  greenLevel: number;
  blueLevel: number;
}

/** Determine modeled 0–255 channel brightness for a common-cathode RGB LED. */
export function getRGBLedStates(components: ComponentInstance[], wires: Wire[], snapshot: RuntimeSnapshot, pressedButtonIds: ReadonlySet<string> = new Set(), closedSwitchIds: ReadonlySet<string> = new Set()): RGBLedState[] {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const boards = components.filter((component) => component.type === "arduino-uno");
  const states: RGBLedState[] = [];
  for (const led of components.filter((component) => component.type === "rgb-led")) {
    const common = led.terminals.find((terminal) => terminal.label === "COMMON")?.id;
    const state: RGBLedState = { componentId: led.id, red: false, green: false, blue: false, redLevel: 0, greenLevel: 0, blueLevel: 0 };
    if (!common) { states.push(state); continue; }
    for (const board of boards) {
      const grounded = board.terminals.some((terminal) => terminal.type === "gnd" && graph.hasConnection(common, terminal.id));
      if (!grounded) continue;
      for (const pin of board.terminals) {
        const match = /^D(\d+)$/.exec(pin.label);
        if (!match) continue;
        const number = Number(match[1]);
        if (snapshot.modes.get(number) !== "OUTPUT") continue;
        const level = snapshot.pwmLevels?.get(number) ?? (snapshot.levels.get(number) === "HIGH" ? 255 : 0);
        for (const channel of ["R", "G", "B"] as const) {
          const terminal = led.terminals.find((item) => item.label === channel);
          if (!terminal || !graph.hasConnection(terminal.id, pin.id)) continue;
          if (channel === "R") state.redLevel = Math.max(state.redLevel, level);
          if (channel === "G") state.greenLevel = Math.max(state.greenLevel, level);
          if (channel === "B") state.blueLevel = Math.max(state.blueLevel, level);
        }
      }
    }
    state.red = state.redLevel > 0;
    state.green = state.greenLevel > 0;
    state.blue = state.blueLevel > 0;
    states.push(state);
  }
  return states;
}

export interface ServoState {
  componentId: string;
  signalPin?: number;
  angle: number;
  pulseMicroseconds: number;
  refreshHz: 50;
}

/** Convert a Servo.write() angle into the modeled 1–2 ms command pulse. */
export function servoPulseWidthMicroseconds(angle: number): number {
  const bounded = Math.max(0, Math.min(180, Math.round(angle)));
  return Math.round(1000 + (bounded / 180) * 1000);
}

/** Resolve an attached servo signal to a powered, wired Uno servo module. */
export function getServoStates(components: ComponentInstance[], wires: Wire[], snapshot: RuntimeSnapshot, pressedButtonIds: ReadonlySet<string> = new Set(), closedSwitchIds: ReadonlySet<string> = new Set()): ServoState[] {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const boards = components.filter((component) => component.type === "arduino-uno");
  const results: ServoState[] = [];
  for (const servo of components.filter((component) => component.type === "servo")) {
    const vcc = servo.terminals.find((terminal) => terminal.label === "VCC");
    const ground = servo.terminals.find((terminal) => terminal.label === "GND");
    const signal = servo.terminals.find((terminal) => terminal.label === "SIG");
    if (!vcc || !ground || !signal) continue;
    for (const board of boards) {
      const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V");
      const grounds = board.terminals.filter((terminal) => terminal.type === "gnd");
      if (!fiveVolt || !graph.hasConnection(vcc.id, fiveVolt.id) || !grounds.some((terminal) => graph.hasConnection(ground.id, terminal.id))) continue;
      for (const terminal of board.terminals) {
        const match = /^D(\d+)$/.exec(terminal.label);
        if (!match || !graph.hasConnection(signal.id, terminal.id)) continue;
        const signalPin = Number(match[1]);
        const angle = snapshot.servoAngles?.get(signalPin);
        if (angle === undefined) continue;
        results.push({ componentId: servo.id, signalPin, angle, pulseMicroseconds: servoPulseWidthMicroseconds(angle), refreshHz: 50 });
      }
    }
  }
  return results;
}

export type MotorDirection = "CLOCKWISE" | "COUNTERCLOCKWISE" | "STOPPED" | "BRAKED";

export interface DcMotorState {
  componentId: string;
  driverId: string;
  direction: MotorDirection;
  duty: number;
  speedPercent: number;
}

/** Resolve an H-bridge's modeled direction and PWM enable to a wired DC motor. */
export function getDcMotorStates(components: ComponentInstance[], wires: Wire[], snapshot: RuntimeSnapshot, pressedButtonIds: ReadonlySet<string> = new Set(), closedSwitchIds: ReadonlySet<string> = new Set()): DcMotorState[] {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const boards = components.filter((component) => component.type === "arduino-uno");
  const results: DcMotorState[] = [];
  for (const driver of components.filter((component) => component.type === "h-bridge")) {
    const vcc = driver.terminals.find((terminal) => terminal.label === "VCC");
    const motorSupply = driver.terminals.find((terminal) => terminal.label === "VM");
    const ground = driver.terminals.find((terminal) => terminal.label === "GND");
    const enable = driver.terminals.find((terminal) => terminal.label === "ENA");
    const in1 = driver.terminals.find((terminal) => terminal.label === "IN1");
    const in2 = driver.terminals.find((terminal) => terminal.label === "IN2");
    const out1 = driver.terminals.find((terminal) => terminal.label === "OUT1");
    const out2 = driver.terminals.find((terminal) => terminal.label === "OUT2");
    if (!vcc || !motorSupply || !ground || !enable || !in1 || !in2 || !out1 || !out2) continue;

    for (const motor of components.filter((component) => component.type === "dc-motor")) {
      const positive = motor.terminals.find((terminal) => terminal.label === "M+");
      const negative = motor.terminals.find((terminal) => terminal.label === "M-");
      if (!positive || !negative) continue;
      const outputOrder = graph.hasConnection(out1.id, positive.id) && graph.hasConnection(out2.id, negative.id)
        ? 1
        : graph.hasConnection(out1.id, negative.id) && graph.hasConnection(out2.id, positive.id) ? -1 : 0;
      if (!outputOrder) continue;

      for (const board of boards) {
        const fiveVolt = board.terminals.find((terminal) => terminal.label === "5V");
        const grounds = board.terminals.filter((terminal) => terminal.type === "gnd");
        if (!fiveVolt || !graph.hasConnection(vcc.id, fiveVolt.id) || !graph.hasConnection(motorSupply.id, fiveVolt.id) || !grounds.some((terminal) => graph.hasConnection(ground.id, terminal.id))) continue;
        const readOutputPin = (moduleTerminalId: string) => {
          for (const boardPin of board.terminals) {
            const match = /^D(\d+)$/.exec(boardPin.label);
            if (!match || !graph.hasConnection(moduleTerminalId, boardPin.id)) continue;
            const pin = Number(match[1]);
            if (snapshot.modes.get(pin) !== "OUTPUT") return null;
            return {
              pin,
              duty: snapshot.pwmLevels?.get(pin) ?? (snapshot.levels.get(pin) === "HIGH" ? 255 : 0),
              high: snapshot.pwmLevels?.has(pin) ? (snapshot.pwmLevels.get(pin) ?? 0) >= 128 : snapshot.levels.get(pin) === "HIGH",
            };
          }
          return null;
        };
        const enableOutput = readOutputPin(enable.id);
        const input1 = readOutputPin(in1.id);
        const input2 = readOutputPin(in2.id);
        if (!enableOutput || !input1 || !input2) continue;
        const duty = Math.max(0, Math.min(255, enableOutput.duty));
        let direction: MotorDirection = "STOPPED";
        if (duty > 0) {
          if (input1.high && input2.high) direction = "BRAKED";
          else if (input1.high !== input2.high) {
            const clockwise = input1.high && !input2.high;
            direction = (clockwise === (outputOrder === 1)) ? "CLOCKWISE" : "COUNTERCLOCKWISE";
          }
        }
        results.push({ componentId: motor.id, driverId: driver.id, direction, duty, speedPercent: Math.round((duty / 255) * 100) });
      }
    }
  }
  return results;
}

export interface SevenSegmentChannels {
  A: boolean;
  B: boolean;
  C: boolean;
  D: boolean;
  E: boolean;
  F: boolean;
  G: boolean;
}

export interface SevenSegmentState {
  componentId: string;
  segments: SevenSegmentChannels;
  decimalPoint: boolean;
  digit: number | null;
}

const DIGIT_SEGMENTS: Record<number, string[]> = {
  0: ["A", "B", "C", "D", "E", "F"],
  1: ["B", "C"],
  2: ["A", "B", "D", "E", "G"],
  3: ["A", "B", "C", "D", "G"],
  4: ["B", "C", "F", "G"],
  5: ["A", "C", "D", "F", "G"],
  6: ["A", "C", "D", "E", "F", "G"],
  7: ["A", "B", "C"],
  8: ["A", "B", "C", "D", "E", "F", "G"],
  9: ["A", "B", "C", "D", "F", "G"],
};

/** Compute independently driven common-cathode 7-segment channels from digital HIGH outputs. */
export function getSevenSegmentStates(components: ComponentInstance[], wires: Wire[], snapshot: RuntimeSnapshot, pressedButtonIds: ReadonlySet<string> = new Set(), closedSwitchIds: ReadonlySet<string> = new Set()): SevenSegmentState[] {
  const graph = buildCircuitGraph(components, wires, pressedButtonIds, closedSwitchIds);
  const boards = components.filter((component) => component.type === "arduino-uno");
  const results: SevenSegmentState[] = [];
  for (const display of components.filter((component) => component.type === "seven-segment")) {
    const segments: SevenSegmentChannels = { A: false, B: false, C: false, D: false, E: false, F: false, G: false };
    const state: SevenSegmentState = { componentId: display.id, segments, decimalPoint: false, digit: null };
    const commons = display.terminals.filter((terminal) => terminal.label === "COM1" || terminal.label === "COM2");
    if (commons.length === 0) { results.push(state); continue; }
    for (const board of boards) {
      const grounded = commons.some((common) => board.terminals.some((terminal) => terminal.type === "gnd" && graph.hasConnection(common.id, terminal.id)));
      if (!grounded) continue;
      for (const pin of board.terminals) {
        const match = /^D(\d+)$/.exec(pin.label);
        if (!match || snapshot.modes.get(Number(match[1])) !== "OUTPUT" || snapshot.levels.get(Number(match[1])) !== "HIGH") continue;
        for (const terminal of display.terminals) {
          if (!graph.hasConnection(terminal.id, pin.id)) continue;
          if (terminal.label in segments) segments[terminal.label as keyof SevenSegmentChannels] = true;
          if (terminal.label === "DP") state.decimalPoint = true;
        }
      }
    }
    const active = Object.entries(segments).filter(([, on]) => on).map(([label]) => label).sort().join("");
    const matchedDigit = Object.entries(DIGIT_SEGMENTS).find(([, pattern]) => pattern.slice().sort().join("") === active);
    state.digit = matchedDigit ? Number(matchedDigit[0]) : null;
    results.push(state);
  }
  return results;
}
