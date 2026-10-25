"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ComponentPalette } from "@/components/layout/ComponentPalette";
import { CircuitWorkspace } from "@/components/circuit/CircuitWorkspace";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel";
import { Console } from "@/components/layout/Console";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ComponentInstance, ComponentType, Wire, ConsoleTab, SimulationState, SimulationEvent, STARTER_CODE } from "@/types/circuit";
import { createArduinoUno, createBreadboard, createLED, createResistor, createPushButton, createBuzzer, createPotentiometer, createLdrSensor, createPirSensor, createHcSr04Sensor, createRGBLED, createSevenSegmentDisplay, createSlideSwitch, createJoystickModule, createServoMotor, createDcMotor, createHBridgeDriver } from "@/circuit-engine/models/componentTemplates";
import { generateId, formatTime } from "@/lib/utils";
import { validateCircuit } from "@/circuit-engine/validation/validator";
import { buildCircuitGraph } from "@/circuit-engine/graph/netGraph";
import { validateSketch, CompileResult } from "@/simulation/interfaces/compileAdapter";
import { compileSimulationProgram, getLedBrightnesses, getBuzzerSignals, getRGBLedStates, getSevenSegmentStates, getServoStates, getDcMotorStates, readDigitalPin, readAnalogPin, readUltrasonicPulseDuration, RuntimeSnapshot, RGBLedState, SevenSegmentState, ServoState, DcMotorState, SimulationRuntime } from "@/simulation/interfaces/simulationAdapter";
import { createStarterCircuit } from "@/circuit-engine/models/starterCircuit";
import { createBeginnerProject } from "@/circuit-engine/models/beginnerProjectTemplates";
import type { BeginnerProjectId } from "@/circuit-engine/models/beginnerProjectTemplates";
import { createProjectFile, listSavedProjects, loadMostRecentProject, loadProjectById, makeProjectFilename, MAX_PROJECT_BYTES, parseProjectFile, ProjectFile, SavedProjectSummary, saveProjectFile } from "@/lib/projectPersistence";

export default function Home() {
  const [projectName, setProjectName] = useState("Blink LED — Pin 8");
  const [activeBeginnerProjectId, setActiveBeginnerProjectId] = useState<BeginnerProjectId | "">("");
  const [projectId, setProjectId] = useState("");
  const [projectCreatedAt, setProjectCreatedAt] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState(STARTER_CODE);
  const [simulationState, setSimulationState] = useState<SimulationState>("IDLE");
  const [logs, setLogs] = useState<SimulationEvent[]>([]);
  const [activeTab, setActiveTab] = useState<ConsoleTab>("validation");
  const [pendingWire, setPendingWire] = useState<{ startTerminalId: string; startComponentId: string } | null>(null);
  const [wireColor, setWireColor] = useState("#EF4444");
  const [wireToolActive, setWireToolActive] = useState(false);
  const [litLedIds, setLitLedIds] = useState<string[]>([]);
  const [ledBrightnesses, setLedBrightnesses] = useState<Record<string, number>>({});
  const [pressedButtonIds, setPressedButtonIds] = useState<string[]>([]);
  const [slideSwitchOnIds, setSlideSwitchOnIds] = useState<string[]>([]);
  const [buzzerFrequencies, setBuzzerFrequencies] = useState<Record<string, number>>({});
  const [rgbLedStates, setRgbLedStates] = useState<Record<string, RGBLedState>>({});
  const [sevenSegmentStates, setSevenSegmentStates] = useState<Record<string, SevenSegmentState>>({});
  const [servoStates, setServoStates] = useState<Record<string, ServoState>>({});
  const [motorStates, setMotorStates] = useState<Record<string, DcMotorState>>({});
  const [serialBaud, setSerialBaud] = useState(9600);
  const [showGuide, setShowGuide] = useState(false);
  const [openProjectsDialog, setOpenProjectsDialog] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProjectSummary[]>([]);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const runtimeRef = useRef<SimulationRuntime | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const componentsRef = useRef(components);
  const wiresRef = useRef(wires);
  const pressedButtonIdsRef = useRef<Set<string>>(new Set());
  const slideSwitchOnIdsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Map<string, { oscillator: OscillatorNode; gain: GainNode; frequency: number }>>(new Map());
  componentsRef.current = components;
  wiresRef.current = wires;

  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined" || !window.AudioContext) return;
    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") audioContextRef.current = new window.AudioContext();
      if (audioContextRef.current.state === "suspended") void audioContextRef.current.resume().catch(() => undefined);
    } catch {
      // Visual buzzer state still works in browsers that block Web Audio.
    }
  }, []);

  const stopBuzzerAudio = useCallback(() => {
    for (const node of oscillatorsRef.current.values()) {
      try { node.gain.gain.setTargetAtTime(0, audioContextRef.current?.currentTime ?? 0, 0.01); node.oscillator.stop(); } catch { /* already stopped */ }
      node.oscillator.disconnect();
      node.gain.disconnect();
    }
    oscillatorsRef.current.clear();
    setBuzzerFrequencies({});
  }, []);

  const syncBuzzerAudio = useCallback((signals: Array<{ componentId: string; frequency: number }>) => {
    const next = new Map(signals.map((signal) => [signal.componentId, signal.frequency]));
    for (const [id, node] of oscillatorsRef.current) {
      if (next.has(id)) continue;
      try { node.gain.gain.setTargetAtTime(0, audioContextRef.current?.currentTime ?? 0, 0.01); node.oscillator.stop(); } catch { /* already stopped */ }
      node.oscillator.disconnect();
      node.gain.disconnect();
      oscillatorsRef.current.delete(id);
    }
    const context = audioContextRef.current;
    for (const [id, frequency] of next) {
      const existing = oscillatorsRef.current.get(id);
      if (existing) {
        if (existing.frequency !== frequency && context) {
          existing.oscillator.frequency.setTargetAtTime(frequency, context.currentTime, 0.01);
          existing.frequency = frequency;
        }
        continue;
      }
      if (!context || context.state === "closed") continue;
      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.025, context.currentTime + 0.02);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillatorsRef.current.set(id, { oscillator, gain, frequency });
      } catch {
        // Keep the visual indicator even if the browser cannot start audio.
      }
    }
    setBuzzerFrequencies(Object.fromEntries(next));
  }, []);

  const setButtonPressed = (id: string, pressed: boolean) => {
    const next = new Set(pressedButtonIdsRef.current);
    if (pressed) next.add(id);
    else next.delete(id);
    pressedButtonIdsRef.current = next;
    setPressedButtonIds(Array.from(next));
  };
  const handleToggleSlideSwitch = (id: string) => {
    const next = new Set(slideSwitchOnIdsRef.current);
    const isOn = !next.has(id);
    if (isOn) next.add(id);
    else next.delete(id);
    slideSwitchOnIdsRef.current = next;
    setSlideSwitchOnIds(Array.from(next));
    setComponents((current) => current.map((component) => component.id === id
      ? { ...component, properties: { ...component.properties, isOn } }
      : component));
  };
  const releaseAllButtons = useCallback(() => {
    pressedButtonIdsRef.current = new Set();
    setPressedButtonIds([]);
  }, []);
  const syncSlideSwitches = (items: ComponentInstance[]) => {
    const ids = items.filter((component) => component.type === "slide-switch" && component.properties.isOn === true).map((component) => component.id);
    slideSwitchOnIdsRef.current = new Set(ids);
    setSlideSwitchOnIds(ids);
  };

  const syncOutputVisuals = (snapshot: RuntimeSnapshot) => {
    const brightnesses = getLedBrightnesses(componentsRef.current, wiresRef.current, snapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current);
    setLedBrightnesses(Object.fromEntries(brightnesses.map(({ componentId, brightness }) => [componentId, brightness])));
    const lit = brightnesses.filter((led) => led.brightness > 0).map((led) => led.componentId);
    setLitLedIds(lit);
    const rgbStates = getRGBLedStates(componentsRef.current, wiresRef.current, snapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current);
    setRgbLedStates(Object.fromEntries(rgbStates.map((state) => [state.componentId, state])));
    const displayStates = getSevenSegmentStates(componentsRef.current, wiresRef.current, snapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current);
    setSevenSegmentStates(Object.fromEntries(displayStates.map((state) => [state.componentId, state])));
    const servoOutputStates = getServoStates(componentsRef.current, wiresRef.current, snapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current);
    setServoStates(Object.fromEntries(servoOutputStates.map((state) => [state.componentId, state])));
    const motorOutputStates = getDcMotorStates(componentsRef.current, wiresRef.current, snapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current);
    setMotorStates(Object.fromEntries(motorOutputStates.map((state) => [state.componentId, state])));
    return lit;
  };

  const applyProjectFile = useCallback((file: ProjectFile) => {
    const project = file.project;
    setProjectId(project.id);
    setProjectCreatedAt(project.createdAt);
    setProjectName(project.name);
    setActiveBeginnerProjectId("");
    setComponents(project.components);
    syncSlideSwitches(project.components);
    setWires(project.wires);
    setCode(project.code);
    setWireColor(project.settings.wireColor);
    setSelectedId(null);
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    releaseAllButtons();
    stopBuzzerAudio();
    setSerialBaud(9600);
    setCompileResult(null);
    setSimulationState("IDLE");
  }, [releaseAllButtons, stopBuzzerAudio]);

  // Load the latest IndexedDB project (localStorage/legacy fallback handled by persistence service).
  useEffect(() => {
    let active = true;
    setLogs([
      { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Virtual Arduino Lab ready. Projects are saved locally in this browser." },
      { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Use Save, Export JSON, or Import JSON from the project menu." },
    ]);
    loadMostRecentProject().then((saved) => {
      if (!active) return;
      if (saved?.success) {
        applyProjectFile(saved.file);
        setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Opened saved project “${saved.file.project.name}”.` }]);
        if (saved.migrated) saveProjectFile(saved.file).catch(() => undefined);
        return;
      }
      const starter = createStarterCircuit();
      const now = new Date().toISOString();
      setProjectId(generateId("project"));
      setProjectCreatedAt(now);
      setProjectName(starter.name);
      setCode(starter.code);
      setComponents(starter.components);
      setWires(starter.wires);
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Loaded the pre-wired Blink LED starter circuit — ready to Run." }]);
    }).catch(() => {
      if (!active) return;
      const starter = createStarterCircuit();
      const now = new Date().toISOString();
      setProjectId(generateId("project"));
      setProjectCreatedAt(now);
      setProjectName(starter.name);
      setCode(starter.code);
      setComponents(starter.components);
      setWires(starter.wires);
    });
    return () => { active = false; };
  }, [applyProjectFile]);

  useEffect(() => () => {
    runtimeRef.current?.stop();
    stopBuzzerAudio();
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (audioContextRef.current?.state !== "closed") void audioContextRef.current?.close().catch(() => undefined);
  }, [stopBuzzerAudio]);

  const makeCurrentProjectFile = useCallback(() => {
    const now = new Date().toISOString();
    return createProjectFile({
      id: projectId || generateId("project"),
      name: projectName,
      createdAt: projectCreatedAt || now,
      updatedAt: now,
      components,
      wires,
      code,
      settings: { wireColor },
    });
  }, [projectId, projectName, projectCreatedAt, components, wires, code, wireColor]);

  const saveProject = useCallback(async () => {
    try {
      const file = makeCurrentProjectFile();
      const location = await saveProjectFile(file);
      setProjectId(file.project.id);
      setProjectCreatedAt(file.project.createdAt);
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Saved “${projectName}” to ${location} (${components.length} components, ${wires.length} wires).` }]);
    } catch (error) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: `Save failed: ${error instanceof Error ? error.message : "Unknown storage error."}` }]);
    }
    setActiveTab("logs");
  }, [components, wires, projectName, makeCurrentProjectFile]);

  const handleExportProject = () => {
    try {
      const file = makeCurrentProjectFile();
      const text = JSON.stringify(file, null, 2);
      if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) throw new Error("Project exceeds the 5 MB export limit.");
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = makeProjectFilename(projectName);
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Exported ${anchor.download} as a versioned JSON project.` }]);
      setActiveTab("logs");
    } catch (error) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: `Export failed: ${error instanceof Error ? error.message : "Unknown export error."}` }]);
      setActiveTab("logs");
    }
  };

  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_PROJECT_BYTES) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: "Import rejected: file exceeds the 5 MB limit." }]);
      setActiveTab("logs");
      return;
    }
    try {
      const result = parseProjectFile(await file.text());
      if (!result.success) throw new Error(result.error);
      runtimeRef.current?.stop();
      runtimeRef.current = null;
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      applyProjectFile(result.file);
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Imported and validated “${result.file.project.name}”. Save it locally or export a copy.` }]);
    } catch (error) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: `Import rejected safely: ${error instanceof Error ? error.message : "Invalid project file."}` }]);
    }
    setActiveTab("logs");
  };

  const handleDuplicateProject = async () => {
    const now = new Date().toISOString();
    const copyName = `${projectName} (copy)`.slice(0, 120);
    const duplicate = createProjectFile({
      id: generateId("project"), name: copyName, createdAt: now, updatedAt: now,
      components, wires, code, settings: { wireColor },
    });
    applyProjectFile(duplicate);
    try {
      const location = await saveProjectFile(duplicate);
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Duplicated as “${copyName}” and saved to ${location}.` }]);
    } catch (error) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: `Duplicate created in workspace but could not save: ${error instanceof Error ? error.message : "Storage error."}` }]);
    }
    setActiveTab("logs");
  };

  const handleResetStarter = () => {
    if (!confirm("Replace the current workspace with the pre-wired Blink starter?")) return;
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    const starter = createStarterCircuit();
    const now = new Date().toISOString();
    setProjectId(generateId("project"));
    setProjectCreatedAt(now);
    setProjectName(starter.name);
    setActiveBeginnerProjectId("");
    setComponents(starter.components);
    syncSlideSwitches(starter.components);
    setWires(starter.wires);
    setCode(starter.code);
    setWireColor("#EF4444");
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    releaseAllButtons();
    stopBuzzerAudio();
    setCompileResult(null);
    setSimulationState("IDLE");
    setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Reset to the pre-wired Blink LED starter example. Use Save to keep it." }]);
    setActiveTab("logs");
  };

  const handleAddComponent = (type: ComponentType, extra?: string) => {
    let comp: ComponentInstance | null = null;
    const randX = type === "pushbutton" || type === "slide-switch" || type === "buzzer" || type === "potentiometer" || type === "ldr" || type === "pir" || type === "hc-sr04" || type === "joystick" || type === "servo" || type === "dc-motor" || type === "h-bridge" || type === "rgb-led" || type === "seven-segment" ? 440 + Math.random() * 60 : 80 + Math.random() * 200;
    const randY = type === "potentiometer" || type === "ldr" || type === "pir" || type === "hc-sr04" || type === "joystick" ? 250 + Math.random() * 60 : type === "pushbutton" || type === "slide-switch" || type === "buzzer" || type === "servo" || type === "dc-motor" || type === "h-bridge" ? 130 + Math.random() * 100 : 80 + Math.random() * 120;
    if (type === "arduino-uno") comp = createArduinoUno(randX, randY);
    if (type === "breadboard") comp = createBreadboard(randX, randY + 80);
    if (type === "led") comp = createLED(randX, randY, extra || "red");
    if (type === "rgb-led") comp = createRGBLED(randX, randY);
    if (type === "seven-segment") comp = createSevenSegmentDisplay(randX, randY);
    if (type === "resistor") comp = createResistor(randX, randY, 220);
    if (type === "pushbutton") comp = createPushButton(randX, randY);
    if (type === "slide-switch") comp = createSlideSwitch(randX, randY);
    if (type === "buzzer") comp = createBuzzer(randX, randY, extra === "passive" ? "passive" : "active");
    if (type === "potentiometer") comp = createPotentiometer(randX, randY);
    if (type === "ldr") comp = createLdrSensor(randX, randY);
    if (type === "pir") comp = createPirSensor(randX, randY);
    if (type === "hc-sr04") comp = createHcSr04Sensor(randX, randY);
    if (type === "joystick") comp = createJoystickModule(randX, randY);
    if (type === "servo") comp = createServoMotor(randX, randY);
    if (type === "dc-motor") comp = createDcMotor(randX, randY);
    if (type === "h-bridge") comp = createHBridgeDriver(randX, randY);
    if (comp) {
      setComponents((c) => [...c, comp!]);
      setSelectedId(comp!.id);
      setLogs((l) => [...l, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Added ${comp!.label} at (${Math.round(comp!.x)}, ${Math.round(comp!.y)})` }]);
    }
  };

  const handleMove = (id: string, x: number, y: number) => {
    setComponents((cs) => cs.map((c) => (c.id === id ? { ...c, x, y } : c)));
    // Update wires' connected status is visual; graph in M2 will recompute nets
  };

  const handleDeleteComponent = (id: string) => {
    if (components.some((component) => component.id === id && component.type === "buzzer")) stopBuzzerAudio();
    const nextSwitches = new Set(slideSwitchOnIdsRef.current);
    nextSwitches.delete(id);
    slideSwitchOnIdsRef.current = nextSwitches;
    setSlideSwitchOnIds(Array.from(nextSwitches));
    setButtonPressed(id, false);
    setComponents((cs) => cs.filter((c) => c.id !== id));
    // Remove wires attached to this component
    setWires((ws) => ws.filter((w) => w.startComponentId !== id && w.endComponentId !== id));
    setSelectedId(null);
    setLogs((l) => [...l, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Deleted component ${id.slice(0, 12)}` }]);
  };

  const handleDeleteWire = (id: string) => {
    setWires((ws) => ws.filter((w) => w.id !== id));
    setSelectedId(null);
    setLogs((l) => [...l, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Deleted wire ${id.slice(0, 12)}` }]);
  };

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
  };
  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode);
    setCompileResult(null);
  };
  const handleCodeReset = () => {
    setCode(STARTER_CODE);
    setCompileResult(null);
  };

  const handleUpdateComponent = (id: string, updates: Partial<ComponentInstance>) => {
    setComponents((cs) => cs.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handlePotentiometerChange = (id: string, value: number) => {
    setComponents((current) => current.map((component) => component.id === id
      ? { ...component, properties: { ...component.properties, value: Math.max(0, Math.min(1023, Math.round(value))) } }
      : component));
  };

  const handleLdrLightLevelChange = (id: string, level: number) => {
    setComponents((current) => current.map((component) => component.id === id
      ? { ...component, properties: { ...component.properties, lightLevel: Math.max(0, Math.min(100, Math.round(level))) } }
      : component));
  };

  const handleUltrasonicDistanceChange = (id: string, distance: number) => {
    setComponents((current) => current.map((component) => component.id === id
      ? { ...component, properties: { ...component.properties, distanceCm: Math.max(2, Math.min(400, Math.round(distance))) } }
      : component));
  };

  const handlePirMotionToggle = (id: string) => {
    setComponents((current) => current.map((component) => component.id === id
      ? { ...component, properties: { ...component.properties, motionDetected: component.properties.motionDetected !== true } }
      : component));
  };

  const handleJoystickAxisChange = (id: string, axis: "xValue" | "yValue", value: number) => {
    setComponents((current) => current.map((component) => component.id === id
      ? { ...component, properties: { ...component.properties, [axis]: Math.max(0, Math.min(1023, Math.round(value))) } }
      : component));
  };

  const handleUpdateWire = (id: string, updates: Partial<Wire>) => {
    setWires((ws) => ws.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const handleRotate = (id: string) => {
    setComponents((cs) => cs.map((c) => (c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c)));
  };

  const handleWireStart = (tid: string, compId: string) => {
    setPendingWire({ startTerminalId: tid, startComponentId: compId });
    setWireToolActive(true);
    setLogs((l) => [...l, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Wire start: ${tid} — now click destination terminal` }]);
    setActiveTab("logs");
  };
  const handleWireEnd = (tid: string, compId: string) => {
    if (!pendingWire) return;
    if (pendingWire.startTerminalId === tid) {
      setPendingWire(null);
      return;
    }
    // Check duplicate wire
    const exists = wires.some(
      (w) =>
        (w.startTerminalId === pendingWire.startTerminalId && w.endTerminalId === tid) ||
        (w.startTerminalId === tid && w.endTerminalId === pendingWire.startTerminalId)
    );
    if (exists) {
      setLogs((l) => [...l, { id: generateId("log"), timestamp: formatTime(), type: "warning", message: `Wire already exists between those terminals.` }]);
      setPendingWire(null);
      setWireToolActive(false);
      return;
    }
    const newWire: Wire = {
      id: generateId("wire"),
      startTerminalId: pendingWire.startTerminalId,
      endTerminalId: tid,
      startComponentId: pendingWire.startComponentId,
      endComponentId: compId,
      color: wireColor,
    };
    setWires((ws) => [...ws, newWire]);
    // Mark terminals as connected
    setComponents((cs) =>
      cs.map((c) => ({
        ...c,
        terminals: c.terminals.map((t) => (t.id === pendingWire.startTerminalId || t.id === tid ? { ...t, connected: true } : t)),
      }))
    );
    setLogs((l) => [
      ...l,
      { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Wire created: ${pendingWire.startTerminalId} → ${tid} (${wireColor})` },
    ]);
    setPendingWire(null);
    setWireToolActive(false);
  };
  const handleCancelWire = () => {
    setPendingWire(null);
    setWireToolActive(false);
  };

  // M4 safe interpreter: supported sketch statements drive virtual pin state and circuit nets.
  const handleRun = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    releaseAllButtons();
    stopBuzzerAudio();
    const sketchCheck = validateSketch(code);
    const interpreted = compileSimulationProgram(code);
    const errors = [
      ...sketchCheck.errors.map((error) => ({ line: error.line, column: error.column, message: error.message, severity: "error" as const })),
      ...interpreted.errors.map((error) => ({ line: error.line, column: 0, message: error.message, severity: "error" as const })),
    ];
    setCompileResult({ ...sketchCheck, success: errors.length === 0, errors });
    if (!sketchCheck.success || !interpreted.success || !interpreted.program) {
      setSimulationState("ERROR");
      setLogs((current) => [
        ...current,
        { id: generateId("log"), timestamp: formatTime(), type: "error", message: `Simulation rejected: ${errors.length} compile/adapter error(s).` },
        ...errors.map((error) => ({ id: generateId("log"), timestamp: formatTime(), type: "error" as const, message: `Line ${error.line}: ${error.message}` })),
      ]);
      setActiveTab("logs");
      transitionTimerRef.current = setTimeout(() => setSimulationState("IDLE"), 2500);
      return;
    }
    if (!components.some((component) => component.type === "arduino-uno")) {
      setSimulationState("ERROR");
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: "Cannot run: add an Arduino Uno R3 to the workspace." }]);
      setActiveTab("validation");
      transitionTimerRef.current = setTimeout(() => setSimulationState("IDLE"), 2000);
      return;
    }

    ensureAudioContext();
    syncBuzzerAudio(getBuzzerSignals(components, wires, { modes: new Map(), levels: new Map(), tones: new Map() }, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current));
    const circuitIssues = validateCircuit(components, wires, code).filter((message) => message.severity !== "info");
    setSimulationState("VALIDATING");
    setActiveTab("logs");
    setLogs((current) => [
      ...current,
      { id: generateId("log"), timestamp: formatTime(), type: "info", message: "M4: validating sketch and circuit connectivity…" },
      ...sketchCheck.warnings.map((warning) => ({ id: generateId("log"), timestamp: formatTime(), type: "warning" as const, message: `Line ${warning.line}: ${warning.message}` })),
      ...circuitIssues.map((issue) => ({ id: generateId("log"), timestamp: formatTime(), type: issue.severity === "error" ? "error" as const : "warning" as const, message: `[${issue.code}] ${issue.message}` })),
    ]);

    transitionTimerRef.current = setTimeout(() => {
      setSimulationState("COMPILING");
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "M4 adapter compiled supported setup()/loop() instructions — no native AVR binary." }]);
      transitionTimerRef.current = setTimeout(() => {
        setSimulationState("RUNNING");
        setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Simulation running: sketch statements, delay timing, serial output, and connected LED pin state are active." }]);
        const runtime = new SimulationRuntime(interpreted.program!, {
          onPinChange: (pin, level, snapshot: RuntimeSnapshot) => {
            const lit = syncOutputVisuals(snapshot);
            syncBuzzerAudio(getBuzzerSignals(componentsRef.current, wiresRef.current, snapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current));
            setLogs((current) => [
              ...current,
              { id: generateId("log"), timestamp: formatTime(), type: "pin-change", message: `D${pin} → ${level}${lit.length ? ` • ${lit.length} connected LED(s) ON` : " • no forward-biased LED path"}` },
            ]);
          },
          onPwmChange: (pin, value, snapshot) => {
            const lit = syncOutputVisuals(snapshot);
            setLogs((current) => [
              ...current,
              { id: generateId("log"), timestamp: formatTime(), type: "pin-change", message: `D${pin} PWM → ${value}/255${lit.length ? ` • ${lit.length} connected LED(s) ON` : " • no forward-biased LED path"}` },
            ]);
          },
          onServoChange: (pin, angle, snapshot) => {
            syncOutputVisuals(snapshot);
            setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "pin-change", message: `D${pin} servo → ${angle}° (${Math.round(1000 + (angle / 180) * 1000)} µs @ 50 Hz)` }]);
          },
          onDigitalRead: (pin, runtimeSnapshot) => readDigitalPin(pin, runtimeSnapshot.modes, componentsRef.current, wiresRef.current, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current),
          onPulseIn: (pin, timeout, runtimeSnapshot) => readUltrasonicPulseDuration(pin, timeout, componentsRef.current, wiresRef.current, runtimeSnapshot),
          onAnalogRead: (pin) => readAnalogPin(pin, componentsRef.current, wiresRef.current),
          onToneChange: (_pin, _frequency, runtimeSnapshot) => syncBuzzerAudio(getBuzzerSignals(componentsRef.current, wiresRef.current, runtimeSnapshot, pressedButtonIdsRef.current, slideSwitchOnIdsRef.current)),
          onSerial: (text) => setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "serial", message: text }]),
          onBaud: (baud) => setSerialBaud(baud),
          onError: (message) => {
            setSimulationState("ERROR");
            setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message }]);
          },
        });
        runtimeRef.current = runtime;
        runtime.start();
      }, 180);
    }, 180);
  };

  const handleStop = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    setSimulationState("STOPPED");
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    releaseAllButtons();
    stopBuzzerAudio();
    setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Simulation stopped; timers cancelled, buttons released, and LEDs turned off." }]);
    transitionTimerRef.current = setTimeout(() => setSimulationState("IDLE"), 800);
  };
  const handleReset = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    setSimulationState("RESET");
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    releaseAllButtons();
    stopBuzzerAudio();
    setSerialBaud(9600);
    setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Reset: interpreter stopped, pins cleared, buttons released, LED off, serial baud restored to 9600." }]);
    transitionTimerRef.current = setTimeout(() => setSimulationState("IDLE"), 500);
  };

  const handleLoadBeginnerProject = (id: BeginnerProjectId) => {
    const template = createBeginnerProject(id);
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    releaseAllButtons();
    stopBuzzerAudio();
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    setSimulationState("IDLE");
    setProjectId(generateId("project"));
    const now = new Date().toISOString();
    setProjectCreatedAt(now);
    setProjectName(template.name);
    setActiveBeginnerProjectId(template.id);
    setComponents(template.components);
    syncSlideSwitches(template.components);
    setWires(template.wires);
    setCode(template.code);
    setSelectedId(template.focusComponentId);
    setPendingWire(null);
    setWireToolActive(false);
    setWireColor("#EF4444");
    setSerialBaud(9600);
    setCompileResult(null);
    setLogs([{ id: generateId("log"), timestamp: formatTime(), type: "info", message: `Loaded “${template.name}”. ${template.description} Review the selected component’s Properties panel, then Run or edit the sketch.` }]);
    setActiveTab("logs");
  };

  const handleNew = () => {
    if (confirm("Create a blank project? Unsaved changes will be lost.")) {
      runtimeRef.current?.stop();
      runtimeRef.current = null;
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      const now = new Date().toISOString();
      setProjectId(generateId("project"));
      setProjectCreatedAt(now);
      setLitLedIds([]);
    setLedBrightnesses({});
      setRgbLedStates({});
      setSevenSegmentStates({});
      setServoStates({});
      setMotorStates({});
      releaseAllButtons();
      stopBuzzerAudio();
      setSimulationState("IDLE");
      setComponents([]);
      syncSlideSwitches([]);
      setWires([]);
      setCode(STARTER_CODE);
      setCompileResult(null);
      setWireColor("#EF4444");
      setProjectName("New Project");
      setActiveBeginnerProjectId("");
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: "Blank project created. Add components, then save or export." }]);
      setSelectedId(null);
    }
  };
  const handleOpen = async () => {
    const projects = await listSavedProjects().catch(() => []);
    if (projects.length === 0) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "warning", message: "No saved project was found in this browser. Use Import JSON to open a project file." }]);
      setActiveTab("logs");
      return;
    }
    setSavedProjects(projects);
    setOpenProjectsDialog(true);
  };
  const handleChooseProject = async (id: string) => {
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setLitLedIds([]);
    setLedBrightnesses({});
    setRgbLedStates({});
    setSevenSegmentStates({});
    setServoStates({});
    setMotorStates({});
    setSimulationState("IDLE");
    const result = await loadProjectById(id).catch(() => null);
    if (!result?.success) {
      setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "error", message: "Could not open this saved project; its record may be corrupt." }]);
      setActiveTab("logs");
      return;
    }
    applyProjectFile(result.file);
    setOpenProjectsDialog(false);
    setLogs((current) => [...current, { id: generateId("log"), timestamp: formatTime(), type: "info", message: `Opened saved project “${result.file.project.name}”.` }]);
    setActiveTab("logs");
  };

  const selectedComponent = components.find((c) => c.id === selectedId) || null;
  const selectedWire = wires.find((w) => w.id === selectedId) || null;

  // M2: Real circuit validation via graph + breadboard
  const validationMessages = validateCircuit(components, wires, code);
  const circuitGraph = buildCircuitGraph(components, wires);

  // Update terminal connected flags based on graph (breadboard internal nets + wires)
  // We compute connected state: terminal is connected if its net has >1 terminal
  useEffect(() => {
    setComponents((prev) => {
      let changed = false;
      const next = prev.map((comp) => {
        const updatedTerms = comp.terminals.map((t) => {
          const net = circuitGraph.getNetForTerminal(t.id);
          const shouldBeConnected = net ? net.terminals.length > 1 : false;
          if (t.connected !== shouldBeConnected) {
            changed = true;
            return { ...t, connected: shouldBeConnected };
          }
          return t;
        });
        if (changed) return { ...comp, terminals: updatedTerms };
        return comp;
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wires, components.length]); // only recompute when wires change or component count changes to avoid loop

  // Preserve connections on move is already handled: wires reference terminal IDs, not positions

  return (
    <div className="h-screen flex flex-col bg-[#F1F3F6] overflow-hidden">
      <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" aria-label="Import Virtual Arduino Lab project" onChange={handleImportProject} />
      <TopBar
        projectName={projectName}
        onNew={handleNew}
        onSave={saveProject}
        onOpen={handleOpen}
        onDuplicate={handleDuplicateProject}
        onExport={handleExportProject}
        onImport={() => importInputRef.current?.click()}
        onResetStarter={handleResetStarter}
        simulationState={simulationState}
        onRun={handleRun}
        onStop={handleStop}
        onReset={handleReset}
        onRename={setProjectName}
        activeBeginnerProjectId={activeBeginnerProjectId}
        onLoadBeginnerProject={handleLoadBeginnerProject}
      />

      <div className="flex-1 flex overflow-hidden">
        <ComponentPalette onAddComponent={handleAddComponent} onSelectWireTool={() => setWireToolActive((v) => !v)} wireToolActive={wireToolActive || !!pendingWire} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <CircuitWorkspace
            key={projectId}
            components={components}
            wires={wires}
            selectedId={selectedId}
            onSelect={handleSelect}
            onMoveComponent={handleMove}
            onDeleteComponent={handleDeleteComponent}
            onDeleteWire={handleDeleteWire}
            onWireStart={handleWireStart}
            onWireEnd={handleWireEnd}
            pendingWire={pendingWire}
            onCancelWire={handleCancelWire}
            wireColor={wireColor}
            setWireColor={setWireColor}
            litLedIds={simulationState === "RUNNING" ? litLedIds : []}
            ledBrightnesses={simulationState === "RUNNING" ? ledBrightnesses : {}}
            pressedButtonIds={pressedButtonIds}
            slideSwitchOnIds={slideSwitchOnIds}
            onSlideSwitchToggle={handleToggleSlideSwitch}
            buzzerFrequencies={simulationState === "RUNNING" ? buzzerFrequencies : {}}
            onPotentiometerChange={handlePotentiometerChange}
            onLdrLightLevelChange={handleLdrLightLevelChange}
            onPirMotionToggle={handlePirMotionToggle}
            onUltrasonicDistanceChange={handleUltrasonicDistanceChange}
            onJoystickAxisChange={handleJoystickAxisChange}
            rgbLedStates={simulationState === "RUNNING" ? rgbLedStates : {}}
            sevenSegmentStates={simulationState === "RUNNING" ? sevenSegmentStates : {}}
            servoStates={simulationState === "RUNNING" ? servoStates : {}}
            motorStates={simulationState === "RUNNING" ? motorStates : {}}
            fitToComponents={Boolean(activeBeginnerProjectId)}
            onButtonPressStart={(id) => setButtonPressed(id, true)}
            onButtonPressEnd={(id) => setButtonPressed(id, false)}
          />
          <Console activeTab={activeTab} onChangeTab={setActiveTab} logs={logs} onClear={() => setLogs([])} validationMessages={validationMessages} serialBaud={serialBaud} />
        </div>

        <CodeEditor code={code} onChange={handleCodeChange} onReset={handleCodeReset} compileResult={compileResult || undefined} />

        <PropertiesPanel
          selectedComponent={selectedComponent}
          selectedWire={selectedWire}
          onUpdateComponent={handleUpdateComponent}
          onUpdateWire={handleUpdateWire}
          onDelete={() => {
            if (selectedComponent) handleDeleteComponent(selectedComponent.id);
            if (selectedWire) handleDeleteWire(selectedWire.id);
          }}
          onRotate={handleRotate}
          onToggleSlideSwitch={handleToggleSlideSwitch}
          pressedButtonIds={pressedButtonIds}
          onJoystickButtonPressStart={(id) => setButtonPressed(id, true)}
          onJoystickButtonPressEnd={(id) => setButtonPressed(id, false)}
          onJoystickAxisChange={handleJoystickAxisChange}
        />
      </div>

      {/* Footer status */}
      <div className="h-5 bg-[#0F2142] text-white flex items-center px-3 gap-3 text-[10px] shrink-0 border-t border-[#1a345f]">
        <span>M5 Ready: local persistence + JSON import/export ✓ ({circuitGraph.nets.length} nets)</span>
        <span className="opacity-50">|</span>
        <span>
          {components.length} components • {wires.length} wires • {validationMessages.filter((m) => m.severity === "error").length} errors
        </span>
        <span className="opacity-50">|</span>
        <span className="hidden md:inline">Validated: {validationMessages.find((m) => m.code === "VALID") ? "Valid ✓" : validationMessages.some((m) => m.severity === "error") ? "Errors" : "WIP"}</span>
        <button onClick={() => setShowGuide(true)} className="ml-auto px-2 py-0.5 bg-[#0E9A8B] hover:bg-[#0b8a7c] rounded text-white font-bold">
          How to use this lab →
        </button>
      </div>

      {/* Saved project picker */}
      {openProjectsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setOpenProjectsDialog(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="open-project-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between bg-[#0F2142] p-4 text-white">
              <div><h2 id="open-project-title" className="font-extrabold">Open a saved project</h2><p className="text-xs text-white/70">Stored locally in this browser — nothing is uploaded.</p></div>
              <button onClick={() => setOpenProjectsDialog(false)} className="rounded px-2 py-1 text-white/80 hover:bg-white/10" aria-label="Close project picker">✕</button>
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-auto p-4">
              {savedProjects.map((project) => (
                <button key={project.id} onClick={() => void handleChooseProject(project.id)} className="w-full rounded-xl border border-slate-200 p-3 text-left hover:border-[#0E9A8B] hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-[#0E9A8B]">
                  <span className="block text-sm font-bold text-slate-800">{project.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{project.componentCount} components · {project.wireCount} wires · Saved {new Date(project.updatedAt).toLocaleString()}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-200 p-3 text-right"><button onClick={() => setOpenProjectsDialog(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button></div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGuide(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#0F2142] text-white p-4">
              <div className="font-extrabold">How to use this lab</div>
              <div className="text-xs text-white/70">Follow these 7 steps to build the hero circuit</div>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                <li>
                  <b>Add Arduino Uno R3</b> from left palette (click or drag)
                </li>
                <li>
                  <b>Add Breadboard</b> underneath
                </li>
                <li>
                  <b>Add LED</b> (choose color) and <b>220Ω Resistor</b>
                </li>
                <li>
                  <b>Select Wire Tool</b> → click <b>Arduino D8</b> → click <b>Resistor A</b>
                </li>
                <li>Wire <b>Resistor B → LED Anode (A)</b></li>
                <li>Wire <b>LED Cathode (C) → Arduino GND</b></li>
                <li>
                  <b>Click Run</b> on top bar — supported sketch instructions now drive output pins; LED lights only when wiring, polarity, and pin state form a forward path
                </li>
              </ol>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                <b>Beginner tip:</b> Breadboard center trench is not connected — top 5-hole columns ≠ bottom. Power rails are separate.
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full h-9 bg-[#0E9A8B] hover:bg-[#0b8a7c] text-white rounded-lg font-bold">
                Got it — start building
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
