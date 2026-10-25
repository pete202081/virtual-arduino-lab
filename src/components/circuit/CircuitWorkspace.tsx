"use client";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ComponentInstance, Wire } from "@/types/circuit";
import { ArduinoUno } from "./ArduinoUno";
import { Breadboard } from "./Breadboard";
import { LED } from "./LED";
import { Resistor } from "./Resistor";
import { Pushbutton } from "./Pushbutton";
import { SlideSwitch } from "./SlideSwitch";
import { JoystickModule } from "./JoystickModule";
import { ServoMotor } from "./ServoMotor";
import { DcMotor } from "./DcMotor";
import { HBridgeDriver } from "./HBridgeDriver";
import { Buzzer } from "./Buzzer";
import { Potentiometer } from "./Potentiometer";
import { LdrSensor } from "./LdrSensor";
import { PirSensor } from "./PirSensor";
import { HcSr04Sensor } from "./HcSr04Sensor";
import { Tmp36Sensor } from "./Tmp36Sensor";
import { RelayModule } from "./RelayModule";
import { RGBLED } from "./RGBLED";
import { SevenSegmentDisplay } from "./SevenSegmentDisplay";
import type { RGBLedState, SevenSegmentState, ServoState, DcMotorState } from "@/simulation/interfaces/simulationAdapter";
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Trash2, Cable, MousePointer2 } from "lucide-react";
import { buildCircuitGraph } from "@/circuit-engine/graph/netGraph";
import { buildWireRoutePoints, getRouteHandlePoint, wireRouteToPath, type WireRoutePoint } from "./wireRouting";

const clampRouteCoordinate = (value: number) => Math.max(-10_000, Math.min(10_000, value));

interface Props {
  components: ComponentInstance[];
  wires: Wire[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteWire: (id: string) => void;
  onUpdateWireRoute: (id: string, updates: Partial<Wire>) => void;
  onWireStart: (terminalId: string, compId: string) => void;
  onWireEnd: (terminalId: string, compId: string) => void;
  pendingWire: { startTerminalId: string; startComponentId: string } | null;
  onCancelWire: () => void;
  wireColor: string;
  setWireColor: (c: string) => void;
  litLedIds: string[];
  ledBrightnesses: Record<string, number>;
  pressedButtonIds: string[];
  slideSwitchOnIds: string[];
  onSlideSwitchToggle: (id: string) => void;
  onButtonPressStart: (id: string) => void;
  onButtonPressEnd: (id: string) => void;
  buzzerFrequencies: Record<string, number>;
  onPotentiometerChange: (id: string, value: number) => void;
  onLdrLightLevelChange: (id: string, level: number) => void;
  onPirMotionToggle: (id: string) => void;
  onUltrasonicDistanceChange: (id: string, distance: number) => void;
  onTemperatureChange: (id: string, temperature: number) => void;
  onJoystickAxisChange: (id: string, axis: "xValue" | "yValue", value: number) => void;
  rgbLedStates: Record<string, RGBLedState>;
  sevenSegmentStates: Record<string, SevenSegmentState>;
  servoStates: Record<string, ServoState>;
  motorStates: Record<string, DcMotorState>;
  fitToComponents: boolean;
}

export function CircuitWorkspace({
  components,
  wires,
  selectedId,
  onSelect,
  onMoveComponent,
  onDeleteComponent,
  onDeleteWire,
  onUpdateWireRoute,
  onWireStart,
  onWireEnd,
  pendingWire,
  onCancelWire,
  wireColor,
  setWireColor,
  litLedIds,
  ledBrightnesses,
  pressedButtonIds,
  slideSwitchOnIds,
  onSlideSwitchToggle,
  onButtonPressStart,
  onButtonPressEnd,
  buzzerFrequencies,
  onPotentiometerChange,
  onLdrLightLevelChange,
  onPirMotionToggle,
  onUltrasonicDistanceChange,
  onTemperatureChange,
  onJoystickAxisChange,
  rgbLedStates,
  sevenSegmentStates,
  servoStates,
  motorStates,
  fitToComponents,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportOrigin, setViewportOrigin] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [draggingWireRouteId, setDraggingWireRouteId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoverTerminal, setHoverTerminal] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const circuitGraph = useMemo(() => buildCircuitGraph(components, wires), [components, wires]);
  const highlightedTerminalIds = useMemo(() => {
    const net = hoverTerminal ? circuitGraph.getNetForTerminal(hoverTerminal) : undefined;
    return new Set(net?.terminals ?? []);
  }, [circuitGraph, hoverTerminal]);

  useEffect(() => {
    const updateViewportOrigin = () => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (bounds) setViewportOrigin({ x: bounds.left, y: bounds.top });
    };
    updateViewportOrigin();
    const observer = new ResizeObserver(updateViewportOrigin);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", updateViewportOrigin);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateViewportOrigin);
    };
  }, []);

  useEffect(() => { // Keep the portal handle draggable even when the code panel overlaps the canvas stacking context.
    if (!draggingWireRouteId) return;
    const moveRoutePoint = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      onUpdateWireRoute(draggingWireRouteId, {
        routePoint: {
          x: clampRouteCoordinate((event.clientX - rect.left - pan.x) / zoom),
          y: clampRouteCoordinate((event.clientY - rect.top - pan.y) / zoom),
        },
      });
    };
    const stopRoutePointDrag = () => setDraggingWireRouteId(null);
    window.addEventListener("mousemove", moveRoutePoint);
    window.addEventListener("mouseup", stopRoutePointDrag);
    return () => {
      window.removeEventListener("mousemove", moveRoutePoint);
      window.removeEventListener("mouseup", stopRoutePointDrag);
    };
  }, [draggingWireRouteId, onUpdateWireRoute, pan.x, pan.y, zoom]);

  useEffect(() => {
    if (!fitToComponents || components.length === 0) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;
    const minX = Math.min(...components.map((component) => component.x)) - 12;
    const minY = Math.min(...components.map((component) => component.y)) - 12;
    const maxX = Math.max(...components.map((component) => component.x + component.width + 24));
    const maxY = Math.max(...components.map((component) => component.y + component.height + 26));
    const sceneWidth = maxX - minX;
    const sceneHeight = maxY - minY;
    const scale = Math.max(0.4, Math.min(1, (bounds.width - 24) / sceneWidth, (bounds.height - 24) / sceneHeight));
    setZoom(scale);
    setPan({
      x: (bounds.width - sceneWidth * scale) / 2 - minX * scale,
      y: (bounds.height - sceneHeight * scale) / 2 - minY * scale,
    });
  }, [fitToComponents]); // eslint-disable-line react-hooks/exhaustive-deps -- fit once per keyed project template mount

  // Terminal coordinates are generated to match the rendered breadboard hole centers.
  const getTerminalPos = useCallback(
    (terminalId: string) => {
      for (const comp of components) {
        const terminal = comp.terminals.find((item) => item.id === terminalId);
        if (terminal) return { x: comp.x + terminal.dx, y: comp.y + terminal.dy, compId: comp.id, label: terminal.label, type: terminal.type };
      }
      return null;
    },
    [components]
  );

  const routedWirePoints = useMemo(() => {
    const previousRoutes: WireRoutePoint[][] = [];
    return wires.map((wire, index) => {
      const start = getTerminalPos(wire.startTerminalId);
      const end = getTerminalPos(wire.endTerminalId);
      if (!start || !end) return [];
      const route = buildWireRoutePoints(start, end, index, components, previousRoutes, wire.routePoint);
      previousRoutes.push(route);
      return route;
    });
  }, [components, getTerminalPos, wires]);

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent, compId: string) => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    setDragging({ id: compId, offsetX: x - comp.x, offsetY: y - comp.y });
    onSelect(compId);
    e.stopPropagation();
  };

  const handleRouteHandleMouseDown = (event: React.MouseEvent<SVGCircleElement>, wire: Wire, routePoint: WireRoutePoint) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(wire.id);
    setDraggingWireRouteId(wire.id);
    if (!wire.routePoint) onUpdateWireRoute(wire.id, { routePoint });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (draggingWireRouteId) {
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      onUpdateWireRoute(draggingWireRouteId, { routePoint: { x: clampRouteCoordinate(x), y: clampRouteCoordinate(y) } });
      return;
    }

    if (dragging) {
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      onMoveComponent(dragging.id, x - dragging.offsetX, y - dragging.offsetY);
    }
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setDraggingWireRouteId(null);
    setIsPanning(false);
    pressedButtonIds.forEach(onButtonPressEnd);
  };

  const handleWorkspaceMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const startedOnEmptyCanvas = target === e.currentTarget || target.dataset.canvasBackground === "true";
    const shouldPan = e.button === 1 || (e.button === 0 && (e.altKey || startedOnEmptyCanvas));
    if (shouldPan) {
      if (e.button === 0 && startedOnEmptyCanvas) onSelect(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    }
    // Click on empty space clears selection and cancels wire
    if (startedOnEmptyCanvas) {
      onSelect(null);
      // don't auto cancel wire, let user explicitly cancel
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom((z) => Math.min(2, Math.max(0.5, z + delta)));
    }
  };

  // Terminal click delegation via data-terminal-id
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tid = target.getAttribute("data-terminal-id");
      if (!tid) return;
      // Find the actual component containing this terminal
      let foundCompId: string | null = null;
      for (const c of components) {
        if (c.terminals.some((t) => t.id === tid)) {
          foundCompId = c.id;
          break;
        }
      }
      if (!foundCompId) return;
      if (!pendingWire) {
        onWireStart(tid, foundCompId);
      } else {
        if (pendingWire.startTerminalId === tid) {
          onCancelWire();
        } else {
          onWireEnd(tid, foundCompId);
        }
      }
      e.stopPropagation();
    };
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const tid = target.getAttribute("data-terminal-id");
      if (tid) setHoverTerminal(tid);
      else setHoverTerminal(null);
    };
    el.addEventListener("click", handleClick);
    el.addEventListener("mouseover", handleOver);
    return () => {
      el.removeEventListener("click", handleClick);
      el.removeEventListener("mouseover", handleOver);
    };
  }, [components, pendingWire, onWireStart, onWireEnd, onCancelWire]);

  useEffect(() => {
    const canvas = containerRef.current;
    if (!canvas) return;
    const terminalElements = canvas.querySelectorAll<HTMLElement>("[data-terminal-id]");
    terminalElements.forEach((element) => {
      element.classList.toggle("net-highlighted-terminal", highlightedTerminalIds.has(element.dataset.terminalId ?? ""));
    });
    return () => terminalElements.forEach((element) => element.classList.remove("net-highlighted-terminal"));
  }, [highlightedTerminalIds]);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#EEF2F7] relative overflow-hidden">
      {/* Toolbar */}
      <div className="h-9 bg-white border-b border-slate-200 flex items-center px-2 gap-1 shrink-0">
        <button
          onClick={() => onCancelWire()}
          className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-bold border ${!pendingWire ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"}`}
        >
          <MousePointer2 className="w-3.5 h-3.5" /> Select
        </button>
        <button
          onClick={() => {
            // wire tool is activated by clicking wire palette; this is toggle
            if (pendingWire) onCancelWire();
            else {
              // activate wire tool - we need to notify parent to set wireToolActive
              // For now, just show hint
            }
          }}
          className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-bold border ${pendingWire ? "bg-blue-600 text-white border-blue-600 animate-pulse" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"}`}
        >
          <Cable className="w-3.5 h-3.5" /> {pendingWire ? "Wiring… click destination" : "Wire Tool"}
        </button>
        {pendingWire && (
          <button onClick={onCancelWire} className="h-7 px-2 bg-amber-100 text-amber-700 rounded-md text-xs font-bold border border-amber-200">
            Cancel (Esc)
          </button>
        )}
        <div className="h-5 w-px bg-slate-200 mx-1" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-600">Color</span>
          {["#EF4444", "#1F2937", "#2563EB", "#10B981", "#EAB308", "#F97316", "#8B5CF6"].map((col) => (
            <button
              key={col}
              onClick={() => setWireColor(col)}
              className={`w-5 h-5 rounded-full border-2 ${wireColor === col ? "border-slate-900 scale-110" : "border-white shadow"} `}
              style={{ background: col }}
            />
          ))}
        </div>
        <div className="h-5 w-px bg-slate-200 mx-1" />
        <button
          onClick={() => {
            if (selectedId) {
              const comp = components.find((c) => c.id === selectedId);
              if (comp) onDeleteComponent(comp.id);
              else onDeleteWire(selectedId);
            }
          }}
          disabled={!selectedId}
          className="h-7 px-2 bg-white border border-slate-200 rounded-md flex items-center gap-1 text-xs font-bold disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setShowGrid((v) => !v)} className={`w-7 h-7 rounded-md flex items-center justify-center border ${showGrid ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetView} className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Info bar */}
      <div className="h-6 bg-[#0F2142] text-white flex items-center px-3 gap-3 text-[11px] shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" /> {components.length} components • {wires.length} wires
        </span>
        <span className="opacity-50">|</span>
        <span>Drag components • Drag empty canvas to pan • Ctrl+Scroll to zoom</span>
        {hoverTerminal && <span className="ml-auto bg-white/10 px-2 py-0.5 rounded font-mono">Hover: {getTerminalPos(hoverTerminal)?.label ?? hoverTerminal} · {highlightedTerminalIds.size} connected points</span>}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        data-testid="circuit-canvas-viewport"
        className="flex-1 relative overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleWorkspaceMouseDown}
        onWheel={handleWheel}
        style={{ cursor: dragging ? "grabbing" : isPanning ? "grabbing" : pendingWire ? "crosshair" : "default" }}
      >
        {/* Grid */}
        {showGrid && (
          <div
            data-canvas-background="true"
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, #CBD5E1 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />
        )}
        {/* Pan/Zoom container */}
        <div
          data-canvas-background="true"
          data-testid="canvas-scene"
          className="absolute inset-0"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        >
          {/* Wires SVG */}
          <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none overflow-visible">
            <defs>
              <marker id="wire-dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
                <circle cx="5" cy="5" r="3" fill="white" stroke={wireColor} strokeWidth="1" />
              </marker>
            </defs>
            {wires.map((wire, index) => {
              const start = getTerminalPos(wire.startTerminalId);
              const end = getTerminalPos(wire.endTerminalId);
              if (!start || !end) return null;
              const isSelected = selectedId === wire.id;
              const isNetHighlighted = highlightedTerminalIds.has(wire.startTerminalId) || highlightedTerminalIds.has(wire.endTerminalId);
              const path = wireRouteToPath(routedWirePoints[index] ?? [start, end]);
              return (
                <g key={wire.id} data-wire-id={wire.id} className="pointer-events-auto" style={{ cursor: "pointer" }} onClick={() => onSelect(wire.id)}>
                  {/* Hit area */}
                  <path d={path} stroke="transparent" strokeWidth="12" fill="none" />
                  <path
                    d={path}
                    className={isNetHighlighted ? "net-highlighted-wire" : undefined}
                    stroke={isSelected ? "#0E9A8B" : wire.color}
                    strokeWidth={isSelected || isNetHighlighted ? 4 : 3}
                    fill="none"
                    strokeLinecap="round"
                    style={{ filter: isSelected || isNetHighlighted ? "drop-shadow(0 0 4px #0E9A8B)" : undefined }}
                  />
                  {/* Dots at ends */}
                  <circle cx={start.x} cy={start.y} r="4" fill={isSelected ? "#0E9A8B" : wire.color} stroke="white" strokeWidth="1.5" />
                  <circle cx={end.x} cy={end.y} r="4" fill={isSelected ? "#0E9A8B" : wire.color} stroke="white" strokeWidth="1.5" />
                </g>
              );
            })}
            {/* Pending wire preview */}
            {pendingWire && (
              (() => {
                const start = getTerminalPos(pendingWire.startTerminalId);
                if (!start) return null;
                return (
                  <>
                    <circle cx={start.x} cy={start.y} r="6" fill={wireColor} stroke="white" strokeWidth="2" className="animate-pulse" />
                    <circle cx={start.x} cy={start.y} r="10" fill="none" stroke={wireColor} strokeWidth="1" opacity="0.4" className="animate-ping" />
                  </>
                );
              })()
            )}
          </svg>

          {/* Components */}
          {components.map((comp) => {
            const isSelected = selectedId === comp.id;
            const common = {
              comp,
              isSelected,
              onSelect: () => onSelect(comp.id),
            };
            return (
              <div
                key={comp.id}
                onMouseDown={(e) => handleMouseDown(e, comp.id)}
                className={`${isSelected ? "z-10" : "z-0"}`}
                style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}
              >
                {comp.type === "arduino-uno" && <ArduinoUno {...common} />}
                {comp.type === "breadboard" && <Breadboard {...common} />}
                {comp.type === "led" && <LED {...common} isLit={litLedIds.includes(comp.id)} brightness={ledBrightnesses[comp.id] ?? (litLedIds.includes(comp.id) ? 255 : 0)} />}
                {comp.type === "rgb-led" && <RGBLED {...common} state={rgbLedStates[comp.id] ?? { componentId: comp.id, red: false, green: false, blue: false, redLevel: 0, greenLevel: 0, blueLevel: 0 }} />}
                {comp.type === "seven-segment" && <SevenSegmentDisplay {...common} state={sevenSegmentStates[comp.id] ?? { componentId: comp.id, segments: { A: false, B: false, C: false, D: false, E: false, F: false, G: false }, decimalPoint: false, digit: null }} />}
                {comp.type === "resistor" && <Resistor {...common} />}
                {comp.type === "potentiometer" && (
                  <Potentiometer {...common} onValueChange={(value) => onPotentiometerChange(comp.id, value)} />
                )}
                {comp.type === "ldr" && (
                  <LdrSensor {...common} onLightLevelChange={(level) => onLdrLightLevelChange(comp.id, level)} />
                )}
                {comp.type === "pir" && (
                  <PirSensor {...common} onMotionToggle={() => onPirMotionToggle(comp.id)} />
                )}
                {comp.type === "hc-sr04" && (
                  <HcSr04Sensor {...common} onDistanceChange={(distance) => onUltrasonicDistanceChange(comp.id, distance)} />
                )}
                {comp.type === "tmp36" && (
                  <Tmp36Sensor {...common} onTemperatureChange={(temperature) => onTemperatureChange(comp.id, temperature)} />
                )}
                {comp.type === "relay" && <RelayModule {...common} />}
                {comp.type === "joystick" && (
                  <JoystickModule
                    {...common}
                    isPressed={pressedButtonIds.includes(comp.id)}
                    onAxisChange={(axis, value) => onJoystickAxisChange(comp.id, axis, value)}
                    onPressStart={() => onButtonPressStart(comp.id)}
                    onPressEnd={() => onButtonPressEnd(comp.id)}
                  />
                )}
                {comp.type === "servo" && <ServoMotor {...common} state={servoStates[comp.id] ?? { componentId: comp.id, angle: Number(comp.properties.angle ?? 90), pulseMicroseconds: Number(comp.properties.pulseMicroseconds ?? 1500), refreshHz: 50 }} />}
                {comp.type === "dc-motor" && <DcMotor {...common} state={motorStates[comp.id] ?? { componentId: comp.id, driverId: "", direction: "STOPPED", duty: 0, speedPercent: 0 }} />}
                {comp.type === "h-bridge" && <HBridgeDriver {...common} state={Object.values(motorStates).find((state) => state.driverId === comp.id)} />}
                {comp.type === "pushbutton" && (
                  <Pushbutton
                    {...common}
                    isPressed={pressedButtonIds.includes(comp.id)}
                    onPressStart={() => onButtonPressStart(comp.id)}
                    onPressEnd={() => onButtonPressEnd(comp.id)}
                  />
                )}
                {comp.type === "slide-switch" && <SlideSwitch {...common} isOn={slideSwitchOnIds.includes(comp.id)} onToggle={() => onSlideSwitchToggle(comp.id)} />}
                {comp.type === "buzzer" && (
                  <Buzzer
                    {...common}
                    frequency={buzzerFrequencies[comp.id] || 0}
                    isBuzzing={!!buzzerFrequencies[comp.id]}
                  />
                )}
              </div>
            );
          })}

          {/* Draw a local overlay for each breadboard so wire-to-hole destinations sit visibly on its face. */}
          {components
            .filter((component) => component.type === "breadboard")
            .map((board) => {
              const boardHeight = Math.max(board.height, 184);
              return (
                <svg
                  key={`breadboard-wire-overlay-${board.id}`}
                  data-testid="breadboard-wire-overlay"
                  aria-hidden="true"
                  width={board.width}
                  height={boardHeight}
                  viewBox={`0 0 ${board.width} ${boardHeight}`}
                  className="absolute pointer-events-none overflow-hidden"
                  style={{ left: board.x, top: board.y, width: board.width, height: boardHeight, zIndex: 50 }}
                >
                  {wires.map((wire, index) => {
                    const start = getTerminalPos(wire.startTerminalId);
                    const end = getTerminalPos(wire.endTerminalId);
                    if (!start || !end) return null;
                    const startX = start.x - board.x;
                    const startY = start.y - board.y;
                    const endX = end.x - board.x;
                    const endY = end.y - board.y;
                    const isSelected = selectedId === wire.id;
                    const isNetHighlighted = highlightedTerminalIds.has(wire.startTerminalId) || highlightedTerminalIds.has(wire.endTerminalId);
                    const path = wireRouteToPath(routedWirePoints[index] ?? [start, end], { x: board.x, y: board.y });
                    return (
                      <g key={wire.id}>
                        <path
                          data-wire-id={wire.id}
                          className={isNetHighlighted ? "net-highlighted-wire" : undefined}
                          d={path}
                          stroke={isSelected ? "#0E9A8B" : wire.color}
                          strokeWidth={isSelected || isNetHighlighted ? 4 : 3}
                          fill="none"
                          strokeLinecap="round"
                          style={{ filter: isSelected || isNetHighlighted ? "drop-shadow(0 0 4px #0E9A8B)" : undefined }}
                        />
                        <circle data-wire-endpoint={wire.startTerminalId} cx={startX} cy={startY} r="3.5" fill={isSelected ? "#0E9A8B" : wire.color} stroke="white" strokeWidth="1.25" />
                        <circle data-wire-endpoint={wire.endTerminalId} cx={endX} cy={endY} r="3.5" fill={isSelected ? "#0E9A8B" : wire.color} stroke="white" strokeWidth="1.25" />
                      </g>
                    );
                  })}
                </svg>
              );
            })}
        </div>

        {/* Empty state */}
        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl p-8 text-center shadow-lg max-w-sm">
              <div className="w-12 h-12 bg-[#0F2142] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Grid3x3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-extrabold text-[#0F2142]">Your Circuit Workspace</h3>
              <p className="text-xs text-slate-500 mt-1">Add Arduino Uno, Breadboard, LED & 220Ω resistor from the left palette. Drag to position, click terminals to wire.</p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Drag & Drop</span>
                <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Wire Tool</span>
                <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Zoom & Pan</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending wire helper */}
        {pendingWire && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0F2142] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold">
            <Cable className="w-4 h-4 text-[#7de3d8]" />
            Wiring: {pendingWire.startTerminalId} → Click destination terminal
            <button onClick={onCancelWire} className="ml-2 px-2 py-0.5 bg-white/15 rounded-full hover:bg-white/25">
              Cancel
            </button>
          </div>
        )}
      </div>
      {selectedId && wires.some((wire) => wire.id === selectedId) && typeof document !== "undefined" && createPortal(
        <svg
          data-testid="wire-route-handles"
          aria-label="Selected wire route controls"
          className="fixed inset-0 z-[9999] w-screen h-screen pointer-events-none overflow-visible"
          style={{ position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", zIndex: 9999, pointerEvents: "none" }}
        >
          {wires.map((wire, index) => {
            if (wire.id !== selectedId) return null;
            const route = routedWirePoints[index];
            if (!route || route.length < 2) return null;
            const routePoint = wire.routePoint ?? getRouteHandlePoint(route);
            const x = viewportOrigin.x + pan.x + routePoint.x * zoom;
            const y = viewportOrigin.y + pan.y + routePoint.y * zoom;
            return (
              <g key={`route-handle-${wire.id}`}>
                <circle cx={x} cy={y} r="11" fill="#0E9A8B" opacity="0.18" pointerEvents="none" />
                <circle
                  data-testid="wire-route-handle"
                  data-wire-id={wire.id}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag wire bend to reroute"
                  cx={x}
                  cy={y}
                  r="7"
                  fill="white"
                  stroke="#0E9A8B"
                  strokeWidth="3"
                  className={`pointer-events-auto cursor-grab ${draggingWireRouteId === wire.id ? "cursor-grabbing" : ""}`}
                  style={{ pointerEvents: "all" }}
                  onMouseDown={(event) => handleRouteHandleMouseDown(event, wire, routePoint)}
                  onClick={(event) => { event.stopPropagation(); onSelect(wire.id); }}
                  onKeyDown={(event) => {
                    const step = event.shiftKey ? 20 : 8;
                    const delta = event.key === "ArrowLeft" ? { x: -step, y: 0 }
                      : event.key === "ArrowRight" ? { x: step, y: 0 }
                      : event.key === "ArrowUp" ? { x: 0, y: -step }
                      : event.key === "ArrowDown" ? { x: 0, y: step }
                      : null;
                    if (delta) {
                      event.preventDefault();
                      onSelect(wire.id);
                      onUpdateWireRoute(wire.id, { routePoint: { x: clampRouteCoordinate(routePoint.x + delta.x / zoom), y: clampRouteCoordinate(routePoint.y + delta.y / zoom) } });
                    }
                  }}
                >
                  <title>Drag to adjust this wire; use arrow keys to nudge. Reset from Wire Properties.</title>
                </circle>
              </g>
            );
          })}
        </svg>,
        document.body,
      )}
    </div>
  );
}
