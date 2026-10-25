/** M3 limited Arduino sketch validator. It does not compile or execute C++. */
export interface CompileError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}
export interface CompileResult {
  success: boolean;
  errors: CompileError[];
  warnings: CompileError[];
  usedApis: string[];
}

export const SUPPORTED_APIS = [
  "pinMode", "digitalWrite", "analogWrite", "digitalRead", "analogRead", "delay", "delayMicroseconds", "tone", "noTone",
  "Serial.begin", "Serial.println", "Serial.print", "Serial.available", "Serial.read", "Servo.attach", "Servo.write",
];

const unsupported: Record<string, string> = {
  interrupts: "interrupts() is not supported in the MVP adapter.",
  noInterrupts: "noInterrupts() is not supported in the MVP adapter.",
  attachInterrupt: "attachInterrupt() is not supported in the MVP adapter.",
  detachInterrupt: "detachInterrupt() is not supported in the MVP adapter.",
  pulseIn: "pulseIn() is not supported in the MVP adapter.",
  shiftIn: "shiftIn() is not supported in the MVP adapter.",
  shiftOut: "shiftOut() is not supported in the MVP adapter.",
};

const allowedCalls = new Set([
  ...SUPPORTED_APIS, "setup", "loop", "if", "for", "while", "switch", "sizeof",
  "min", "max", "abs", "constrain", "map",
]);

// Strip comments and quoted literals before structural checks; preserve line count.
function codeOnly(line: string): string {
  return line.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, " ").replace(/\/\/.*$/, "");
}

export function validateSketch(code: string): CompileResult {
  const lines = code.split("\n");
  const errors: CompileError[] = [];
  const warnings: CompileError[] = [];
  const usedApis: string[] = [];
  const addError = (line: number, message: string) => errors.push({ line, column: 0, message, severity: "error" });

  if (!/\bvoid\s+setup\s*\(/.test(code)) addError(1, "Missing setup() — Arduino requires void setup() {}.");
  if (!/\bvoid\s+loop\s*\(/.test(code)) addError(1, "Missing loop() — Arduino requires void loop() {}.");

  let braceDepth = 0;
  let inBlockComment = false;
  lines.forEach((raw, index) => {
    let line = raw;
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end < 0) line = "";
      else { line = line.slice(end + 2); inBlockComment = false; }
    }
    line = line.replace(/\/\*[\s\S]*?\*\//g, " ");
    if (line.includes("/*")) { line = line.slice(0, line.indexOf("/*")); inBlockComment = true; }
    const clean = codeOnly(line);
    for (const ch of clean) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth < 0) {
      addError(index + 1, "Unexpected closing brace }.");
      braceDepth = 0;
    }

    const trimmed = clean.trim();
    if (!trimmed) return;

    // Supported and explicitly unsupported function calls.
    const calls = [...clean.matchAll(/\b([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*\(/g)];
    for (const match of calls) {
      const name = match[1];
      if (name === "void" || name === "int" || name === "long" || name === "bool" || name === "float" || name === "char") continue;
      if (name in unsupported) {
        addError(index + 1, unsupported[name]);
        continue;
      }
      // User-defined function declarations are not API calls; this adapter only supports setup/loop.
      const isDefinition = /\)\s*\{/.test(clean.slice(match.index ?? 0));
      const servoMethod = /^[A-Za-z_]\w*\.(attach|write)$/.exec(name);
      if (!allowedCalls.has(name) && !isDefinition && !servoMethod) {
        addError(index + 1, `Unsupported function ${name}() — supported APIs: ${SUPPORTED_APIS.join(", ")}.`);
      }
      if (servoMethod) {
        const api = `Servo.${servoMethod[1]}`;
        if (!usedApis.includes(api)) usedApis.push(api);
      } else if (SUPPORTED_APIS.includes(name) && !usedApis.includes(name)) usedApis.push(name);
    }

    const delayMatch = clean.match(/\bdelay(?:Microseconds)?\s*\(\s*([^)]*)\)/);
    if (delayMatch && delayMatch[1].trim() && !/^[\w]+$/.test(delayMatch[1].trim())) {
      warnings.push({ line: index + 1, column: 0, message: "delay() argument should be a number or simple variable in this MVP.", severity: "warning" });
    }
    if (/\bpinMode\s*\(/.test(clean) && !trimmed.endsWith(";") && !trimmed.endsWith("{")) {
      warnings.push({ line: index + 1, column: 0, message: "Possible missing semicolon after pinMode().", severity: "warning" });
    }
  });

  if (braceDepth !== 0) addError(lines.length, `Unbalanced braces: ${braceDepth > 0 ? "missing }" : "unexpected }"}.`);
  return { success: errors.length === 0, errors, warnings, usedApis };
}

export function getCompileStatusMessage(result: CompileResult): string {
  if (result.success && !result.warnings.length) return "✓ Ready — no errors";
  if (result.success) return `✓ Compiled with ${result.warnings.length} warning(s)`;
  return `✗ ${result.errors.length} error(s) — fix before running`;
}
