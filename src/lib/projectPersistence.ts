import type { ComponentInstance, ComponentProperties, ComponentPropertyValue, Terminal, Wire } from "@/types/circuit";

export const PROJECT_FORMAT = "virtual-arduino-lab" as const;
export const PROJECT_SCHEMA_VERSION = 1;
export const MAX_PROJECT_BYTES = 5 * 1024 * 1024;
export const MAX_PROJECT_CODE_LENGTH = 100_000;
const DB_NAME = "virtual-arduino-lab-projects";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const FALLBACK_KEY = "val-project-current-v1";
const LEGACY_KEY = "val-project-m1";

export interface ProjectSettings {
  wireColor: string;
}
export interface ProjectDocument {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  components: ComponentInstance[];
  wires: Wire[];
  code: string;
  settings: ProjectSettings;
}
export interface ProjectFile {
  format: typeof PROJECT_FORMAT;
  schemaVersion: number;
  project: ProjectDocument;
}
export type StorageLocation = "IndexedDB" | "localStorage";
export interface SavedProjectSummary { id: string; name: string; updatedAt: string; componentCount: number; wireCount: number }
export type ParseResult = { success: true; file: ProjectFile; migrated: boolean } | { success: false; error: string };

const componentTypes = new Set(["arduino-uno", "breadboard", "led", "rgb-led", "seven-segment", "resistor", "pushbutton", "slide-switch", "joystick", "servo", "potentiometer", "ldr", "buzzer", "wire"]);
const terminalTypes = new Set(["digital", "analog", "power", "gnd", "led-anode", "led-cathode", "resistor", "breadboard-hole", "generic", "other"]);
const safeId = /^[a-zA-Z0-9_+.:\-]{1,160}$/;
const hexColor = /^#[0-9a-fA-F]{6}$/;
const isPrimitive = (value: unknown): value is ComponentPropertyValue => value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value));
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

function normalizeProperties(value: unknown): ComponentProperties | null {
  if (!isRecord(value) || Object.keys(value).length > 100) return null;
  const out: ComponentProperties = {};
  for (const [key, item] of Object.entries(value)) {
    if (!key || key.length > 100 || ["__proto__", "prototype", "constructor"].includes(key) || !isPrimitive(item)) return null;
    out[key] = item;
  }
  return out;
}

function normalizeTerminal(value: unknown, componentId: string, ids: Set<string>): Terminal | null {
  if (!isRecord(value)) return null;
  const { id, label, type, dx, dy } = value;
  if (typeof id !== "string" || !safeId.test(id) || ids.has(id)) return null;
  if (typeof label !== "string" || label.length > 100 || !terminalTypes.has(String(type))) return null;
  if (value.componentId !== componentId || typeof dx !== "number" || !Number.isFinite(dx) || Math.abs(dx) > 10_000 || typeof dy !== "number" || !Number.isFinite(dy) || Math.abs(dy) > 10_000) return null;
  ids.add(id);
  // `connected` is derived from graph topology; don't trust imported/transient values.
  return { id, componentId, label, type: type as Terminal["type"], dx, dy, connected: false };
}

function normalizeProject(value: unknown, migrated = false): ParseResult {
  if (!isRecord(value) || value.format !== PROJECT_FORMAT) return { success: false, error: "Not a Virtual Arduino Lab project file." };
  if (value.schemaVersion !== PROJECT_SCHEMA_VERSION) return { success: false, error: `Unsupported project schema version: ${String(value.schemaVersion)}.` };
  const raw = value.project;
  if (!isRecord(raw)) return { success: false, error: "Project data is missing or malformed." };
  if (typeof raw.id !== "string" || !safeId.test(raw.id)) return { success: false, error: "Project ID is invalid." };
  if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.trim().length > 120) return { success: false, error: "Project name must be 1–120 characters." };
  if (typeof raw.code !== "string" || raw.code.length > MAX_PROJECT_CODE_LENGTH) return { success: false, error: `Sketch is missing or exceeds ${MAX_PROJECT_CODE_LENGTH} characters.` };
  if (!Array.isArray(raw.components) || raw.components.length > 200) return { success: false, error: "Components must be an array containing at most 200 items." };
  if (!Array.isArray(raw.wires) || raw.wires.length > 2_000) return { success: false, error: "Wires must be an array containing at most 2000 items." };
  if (!isRecord(raw.settings) || typeof raw.settings.wireColor !== "string" || !hexColor.test(raw.settings.wireColor)) return { success: false, error: "Project settings are invalid (wireColor must be a hex color)." };

  const componentIds = new Set<string>();
  const terminalIds = new Set<string>();
  let terminalCount = 0;
  const components: ComponentInstance[] = [];
  for (const item of raw.components) {
    if (!isRecord(item)) return { success: false, error: "A component entry is malformed." };
    const { id, type, x, y, rotation, width, height, terminals } = item;
    if (typeof id !== "string" || !safeId.test(id) || componentIds.has(id)) return { success: false, error: "Component IDs must be valid and unique." };
    if (!componentTypes.has(String(type))) return { success: false, error: `Unsupported component type: ${String(type)}.` };
    if (![x, y, width, height].every((number) => typeof number === "number" && Number.isFinite(number) && Math.abs(number) <= 10_000)) return { success: false, error: `Component ${id} has invalid dimensions or position.` };
    if ((width as number) <= 0 || (height as number) <= 0 || ![0, 90, 180, 270].includes(Number(rotation))) return { success: false, error: `Component ${id} has invalid dimensions or rotation.` };
    if (!Array.isArray(terminals) || terminals.length > 1_000) return { success: false, error: `Component ${id} has invalid terminals.` };
    const properties = normalizeProperties(item.properties);
    if (!properties) return { success: false, error: `Component ${id} has invalid properties.` };
    if (item.label !== undefined && (typeof item.label !== "string" || item.label.length > 120)) return { success: false, error: `Component ${id} has an invalid label.` };
    const normalizedTerminals: Terminal[] = [];
    for (const terminal of terminals) {
      const normalized = normalizeTerminal(terminal, id, terminalIds);
      if (!normalized) return { success: false, error: `Component ${id} has an invalid or duplicate terminal.` };
      normalizedTerminals.push(normalized);
      terminalCount++;
      if (terminalCount > 5_000) return { success: false, error: "Project has too many terminals (limit 5000)." };
    }
    componentIds.add(id);
    components.push({
      id,
      type: type as ComponentInstance["type"],
      x: x as number,
      y: y as number,
      rotation: rotation as number,
      width: width as number,
      height: height as number,
      label: typeof item.label === "string" ? item.label : undefined,
      terminals: normalizedTerminals,
      properties,
    });
  }

  const wires: Wire[] = [];
  const wireIds = new Set<string>();
  for (const item of raw.wires) {
    if (!isRecord(item)) return { success: false, error: "A wire entry is malformed." };
    const { id, startTerminalId, endTerminalId, startComponentId, endComponentId, color } = item;
    if (typeof id !== "string" || !safeId.test(id) || wireIds.has(id)) return { success: false, error: "Wire IDs must be valid and unique." };
    if (typeof startTerminalId !== "string" || typeof endTerminalId !== "string" || startTerminalId === endTerminalId) return { success: false, error: `Wire ${id} has invalid endpoints.` };
    if (!terminalIds.has(startTerminalId) || !terminalIds.has(endTerminalId)) return { success: false, error: `Wire ${id} references a missing terminal.` };
    if (typeof startComponentId !== "string" || typeof endComponentId !== "string" || !componentIds.has(startComponentId) || !componentIds.has(endComponentId)) return { success: false, error: `Wire ${id} references a missing component.` };
    if (!hexColor.test(String(color))) return { success: false, error: `Wire ${id} has an invalid color.` };
    const startTerminal = components.find((component) => component.id === startComponentId)?.terminals.find((terminal) => terminal.id === startTerminalId);
    const endTerminal = components.find((component) => component.id === endComponentId)?.terminals.find((terminal) => terminal.id === endTerminalId);
    if (!startTerminal || !endTerminal || startTerminal.componentId !== startComponentId || endTerminal.componentId !== endComponentId) return { success: false, error: `Wire ${id} endpoint/component mapping does not match.` };
    wireIds.add(id);
    wires.push({ id, startTerminalId, endTerminalId, startComponentId, endComponentId, color: String(color) });
  }

  const createdAt = typeof raw.createdAt === "string" && Number.isFinite(Date.parse(raw.createdAt)) ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : createdAt;
  return {
    success: true,
    migrated,
    file: {
      format: PROJECT_FORMAT,
      schemaVersion: PROJECT_SCHEMA_VERSION,
      project: {
        id: raw.id,
        name: raw.name.trim(),
        createdAt,
        updatedAt,
        components,
        wires,
        code: raw.code,
        settings: { wireColor: raw.settings.wireColor },
      },
    },
  };
}

/** Build an export/storage document and drop transient component, editor, and simulation UI state. */
export function createProjectFile(input: Omit<ProjectDocument, "components"> & { components: ComponentInstance[] }): ProjectFile {
  const components = input.components.map((component) => ({
    ...component,
    selected: undefined,
    terminals: component.terminals.map(({ id, componentId, label, type, dx, dy }) => ({ id, componentId, label, type, dx, dy, connected: false })),
  }));
  const wires = input.wires.map(({ id, startTerminalId, endTerminalId, startComponentId, endComponentId, color }) => ({ id, startTerminalId, endTerminalId, startComponentId, endComponentId, color }));
  return {
    format: PROJECT_FORMAT,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    project: { ...input, components, wires, settings: { wireColor: input.settings.wireColor } },
  };
}

export function parseProjectFile(text: string): ParseResult {
  if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) return { success: false, error: `Project file exceeds the ${MAX_PROJECT_BYTES / 1024 / 1024} MB limit.` };
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { success: false, error: "Project file is not valid JSON." }; }
  return parseProjectData(parsed);
}

export function parseProjectData(value: unknown): ParseResult {
  const direct = normalizeProject(value);
  if (direct.success) return direct;
  // M1-M3 localStorage format migration: {components,wires,projectName,code,savedAt}.
  if (isRecord(value) && Array.isArray(value.components) && Array.isArray(value.wires)) {
    const timestamp = typeof value.savedAt === "string" && Number.isFinite(Date.parse(value.savedAt)) ? value.savedAt : new Date().toISOString();
    const legacy = {
      format: PROJECT_FORMAT,
      schemaVersion: PROJECT_SCHEMA_VERSION,
      project: {
        id: `migrated_${Date.parse(timestamp).toString(36)}`, 
        name: typeof value.projectName === "string" && value.projectName.trim() ? value.projectName : "Imported Legacy Project",
        createdAt: timestamp,
        updatedAt: timestamp,
        components: value.components,
        wires: value.wires,
        code: typeof value.code === "string" ? value.code : "",
        settings: { wireColor: typeof value.wireColor === "string" && hexColor.test(value.wireColor) ? value.wireColor : "#EF4444" },
      },
    };
    const converted = normalizeProject(legacy, true);
    if (converted.success) return converted;
    return { success: false, error: `Legacy project could not be migrated: ${converted.error}` };
  }
  return direct;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB unavailable")); return; }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "project.id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open project database"));
    request.onblocked = () => reject(new Error("Project database upgrade is blocked"));
  });
}

export async function saveProjectFile(file: ProjectFile): Promise<StorageLocation> {
  const valid = normalizeProject(file);
  if (!valid.success) throw new Error(valid.error);
  const serialized = JSON.stringify(valid.file);
  if (new TextEncoder().encode(serialized).byteLength > MAX_PROJECT_BYTES) throw new Error("Project is too large to save (5 MB maximum).");
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(valid.file);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB save failed"));
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB save was cancelled"));
    });
    db.close();
    return "IndexedDB";
  } catch {
    if (typeof localStorage === "undefined") throw new Error("Browser storage is unavailable; project was not saved.");
    try {
      localStorage.setItem(FALLBACK_KEY, serialized);
      return "localStorage";
    } catch {
      throw new Error("Browser storage is full or unavailable; project was not saved.");
    }
  }
}

export async function loadMostRecentProject(): Promise<ParseResult | null> {
  try {
    const db = await openDatabase();
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
      request.onerror = () => reject(request.error || new Error("Project read failed"));
    });
    db.close();
    const validRecords = records.map((record) => normalizeProject(record)).filter((result): result is Extract<ParseResult, { success: true }> => result.success);
    validRecords.sort((a, b) => Date.parse(b.file.project.updatedAt) - Date.parse(a.file.project.updatedAt));
    if (validRecords.length) return validRecords[0];
  } catch {
    // Fall through to localStorage compatibility and storage fallback.
  }

  if (typeof localStorage !== "undefined") {
    for (const key of [FALLBACK_KEY, LEGACY_KEY]) {
      const text = localStorage.getItem(key);
      if (!text) continue;
      const parsed = parseProjectFile(text);
      if (parsed.success) return parsed;
      try {
        const migrated = parseProjectData(JSON.parse(text));
        if (migrated.success) {
          try { await saveProjectFile(migrated.file); } catch { /* keep usable legacy data even if migration save fails */ }
          return migrated;
        }
      } catch { /* ignore corrupt local data and let the app start fresh */ }
    }
  }
  return null;
}

export async function listSavedProjects(): Promise<SavedProjectSummary[]> {
  try {
    const db = await openDatabase();
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as unknown[]);
      request.onerror = () => reject(request.error || new Error("Project list failed"));
    });
    db.close();
    const result = records.map((record) => normalizeProject(record)).filter((entry): entry is Extract<ParseResult, { success: true }> => entry.success);
    result.sort((a, b) => Date.parse(b.file.project.updatedAt) - Date.parse(a.file.project.updatedAt));
    if (result.length) return result.map(({ file }) => ({ id: file.project.id, name: file.project.name, updatedAt: file.project.updatedAt, componentCount: file.project.components.length, wireCount: file.project.wires.length }));
  } catch {
    // Use the browser fallback if IndexedDB is not available.
  }
  if (typeof localStorage !== "undefined") {
    for (const key of [FALLBACK_KEY, LEGACY_KEY]) {
      const text = localStorage.getItem(key);
      if (!text) continue;
      let parsed: ParseResult;
      try { parsed = parseProjectData(JSON.parse(text)); } catch { continue; }
      if (parsed.success) {
        const project = parsed.file.project;
        return [{ id: project.id, name: project.name, updatedAt: project.updatedAt, componentCount: project.components.length, wireCount: project.wires.length }];
      }
    }
  }
  return [];
}

export async function loadProjectById(id: string): Promise<ParseResult | null> {
  try {
    const db = await openDatabase();
    const record = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Project load failed"));
    });
    db.close();
    if (record !== undefined) {
      const result = normalizeProject(record);
      if (result.success) return result;
    }
  } catch {
    // Fall through to the localStorage fallback.
  }
  if (typeof localStorage !== "undefined") {
    for (const key of [FALLBACK_KEY, LEGACY_KEY]) {
      const text = localStorage.getItem(key);
      if (!text) continue;
      try {
        const parsed = parseProjectData(JSON.parse(text));
        if (parsed.success && parsed.file.project.id === id) return parsed;
      } catch { /* skip malformed fallback record */ }
    }
  }
  return null;
}

export function makeProjectFilename(name: string): string {
  const base = name.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "arduino-project";
  return `${base}.valab.json`;
}
