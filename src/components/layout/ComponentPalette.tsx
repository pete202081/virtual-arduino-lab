"use client";
import { useState } from "react";
import { Search, Cpu, Grid3x3, Lightbulb, Minus, Circle, Volume2, Cable, AlertTriangle, SlidersHorizontal, Sun, Hash, ToggleLeft, Gamepad2, RotateCw, Radio, Waves, Thermometer, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ComponentType } from "@/types/circuit";

interface PaletteItem {
  type: ComponentType;
  name: string;
  category: string;
  description: string;
  color: string;
  available: boolean;
  badge?: string;
}

const ITEMS: PaletteItem[] = [
  { type: "arduino-uno", name: "Arduino Uno R3", category: "Microcontrollers", description: "ATmega328P • 14 digital • 6 analog", color: "#0F2142", available: true },
  { type: "breadboard", name: "Breadboard 830", category: "Prototyping", description: "30×5-hole strips • Power rails", color: "#374151", available: true },
  { type: "led", name: "LED", category: "Basic Components", description: "Red • Anode / Cathode • 20mA", color: "#DC2626", available: true, badge: "Anode/Cathode" },
  { type: "rgb-led", name: "RGB LED", category: "Basic Components", description: "Common cathode • 3 digital channels", color: "#7C3AED", available: true, badge: "3 channels" },
  { type: "seven-segment", name: "7-Segment Display", category: "Basic Components", description: "Single digit • common cathode • 8 outputs", color: "#B91C1C", available: true, badge: "8 outputs" },
  { type: "resistor", name: "Resistor 220Ω", category: "Basic Components", description: "Red-Red-Brown-Gold • 0.25W", color: "#D97706", available: true, badge: "220Ω" },
  { type: "pushbutton", name: "Pushbutton", category: "Basic Components", description: "Tactile • 4-pin • hold to press", color: "#6B7280", available: true, badge: "Interactive" },
  { type: "slide-switch", name: "Slide Switch", category: "Basic Components", description: "SPST • latched ON/OFF • digital input", color: "#0E7490", available: true, badge: "Latched" },
  { type: "potentiometer", name: "Potentiometer 10kΩ", category: "Basic Components", description: "3-pin • adjustable analog input", color: "#0E9A8B", available: true, badge: "Analog" },
  { type: "ldr", name: "LDR Light Sensor", category: "Sensors", description: "3-pin • light level • analog output", color: "#D97706", available: true, badge: "Sensor" },
  { type: "pir", name: "PIR Motion Sensor", category: "Sensors", description: "3-pin • simulated motion • digital output", color: "#7C3AED", available: true, badge: "Digital" },
  { type: "hc-sr04", name: "HC-SR04 Ultrasonic", category: "Sensors", description: "4-pin • distance slider • trigger/echo", color: "#0284C7", available: true, badge: "Range" },
  { type: "tmp36", name: "TMP36 Temperature", category: "Sensors", description: "3-pin • analog temperature output", color: "#EA580C", available: true, badge: "Analog" },
  { type: "relay", name: "5V Relay Module", category: "Actuators", description: "Single channel • active-low coil • COM/NO/NC", color: "#B45309", available: true, badge: "Switch" },
  { type: "joystick", name: "Joystick Module", category: "Sensors", description: "X/Y analog axes • momentary button", color: "#2563EB", available: true, badge: "3 inputs" },
  { type: "servo", name: "Servo Motor", category: "Actuators", description: "0–180° • pulse-width position control", color: "#0E7490", available: true, badge: "Servo" },
  { type: "h-bridge", name: "H-Bridge Driver", category: "Actuators", description: "L298N • direction inputs • PWM enable", color: "#334155", available: true, badge: "Driver" },
  { type: "dc-motor", name: "DC Motor", category: "Actuators", description: "Direction and speed from a motor driver", color: "#475569", available: true, badge: "Motor" },
  { type: "buzzer", name: "Buzzer", category: "Basic Components", description: "Active or passive • audible output", color: "#4B5563", available: true, badge: "Audio" },
  { type: "wire", name: "Jumper Wire", category: "Wiring", description: "Click terminals to connect", color: "#2563EB", available: true, badge: "Wire Tool" },
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Microcontrollers: Cpu,
  Prototyping: Grid3x3,
  "Basic Components": Lightbulb,
  Sensors: Sun,
  Actuators: RotateCw,
  Wiring: Cable,
};

interface Props {
  onAddComponent: (type: ComponentType, extra?: string) => void;
  onSelectWireTool: () => void;
  wireToolActive: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ComponentPalette({ onAddComponent, onSelectWireTool, wireToolActive, isCollapsed, onToggleCollapse }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Microcontrollers", "Prototyping", "Basic Components", "Sensors", "Actuators", "Wiring"];
  const filtered = ITEMS.filter((i) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
    const matchesCat = selectedCategory === "All" || i.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <aside
      aria-label="Component library"
      className={`shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-in-out ${isCollapsed ? "w-12" : "w-[280px]"}`}
    >
      {isCollapsed ? (
        <div className="flex h-full flex-col items-center gap-4 py-3">
          <button
            onClick={onToggleCollapse}
            aria-label="Expand component library"
            aria-expanded={false}
            title="Expand component library"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#0F2142] focus:outline-none focus:ring-2 focus:ring-[#0E9A8B]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-extrabold tracking-[0.16em] text-slate-500" style={{ writingMode: "vertical-rl" }}>COMPONENT LIBRARY</span>
        </div>
      ) : (
        <>
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-extrabold text-[12px] tracking-wide text-[#0F2142]">COMPONENT LIBRARY</div>
            <div className="text-[11px] text-slate-500">Drag onto workspace or click to add</div>
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse component library"
            aria-expanded={true}
            title="Collapse component library to make more room"
            className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0F2142] focus:outline-none focus:ring-2 focus:ring-[#0E9A8B]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#0E9A8B] focus:bg-white"
          />
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold border ${selectedCategory === c ? "bg-[#0F2142] text-white border-[#0F2142]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-4">
        {categories
          .filter((c) => c !== "All")
          .map((cat) => {
            const items = filtered.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            const Icon = CATEGORY_ICON[cat] || Circle;
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-extrabold tracking-wide text-slate-700">
                  <Icon className="w-3 h-3" /> {cat.toUpperCase()} <span className="ml-auto bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{items.length}</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  {items.map((it) => {
                    const isWire = it.type === "wire";
                    const isActiveWire = isWire && wireToolActive;
                    return (
                      <button
                        key={it.type}
                        disabled={!it.available && !isWire}
                        onClick={() => {
                          if (isWire) onSelectWireTool();
                          else if (it.available) onAddComponent(it.type);
                        }}
                        draggable={it.available && !isWire}
                        onDragStart={(e) => {
                          if (it.available && !isWire) e.dataTransfer.setData("componentType", it.type);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border flex gap-2.5 items-start transition-all
                          ${isActiveWire ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200" : it.available ? "bg-white border-slate-200 hover:border-[#0E9A8B] hover:shadow-sm hover:-translate-y-0.5" : "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"}
                        `}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: it.color }}>
                          {it.type === "arduino-uno" && <Cpu className="w-4 h-4" />}
                          {it.type === "breadboard" && <Grid3x3 className="w-4 h-4" />}
                          {(it.type === "led" || it.type === "rgb-led") && <Lightbulb className="w-4 h-4" />}
                          {it.type === "seven-segment" && <Hash className="w-4 h-4" />}
                          {it.type === "resistor" && <Minus className="w-4 h-4" />}
                          {it.type === "pushbutton" && <Circle className="w-4 h-4" />}
                          {it.type === "slide-switch" && <ToggleLeft className="w-4 h-4" />}
                          {it.type === "potentiometer" && <SlidersHorizontal className="w-4 h-4" />}
                          {it.type === "ldr" && <Sun className="w-4 h-4" />}
                          {it.type === "pir" && <Radio className="w-4 h-4" />}
                          {it.type === "hc-sr04" && <Waves className="w-4 h-4" />}
                          {it.type === "tmp36" && <Thermometer className="w-4 h-4" />}
                          {it.type === "relay" && <Zap className="w-4 h-4" />}
                          {it.type === "joystick" && <Gamepad2 className="w-4 h-4" />}
                          {it.type === "servo" && <RotateCw className="w-4 h-4" />}
                          {it.type === "dc-motor" && <RotateCw className="w-4 h-4" />}
                          {it.type === "h-bridge" && <Cpu className="w-4 h-4" />}
                          {it.type === "buzzer" && <Volume2 className="w-4 h-4" />}
                          {it.type === "wire" && <Cable className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-[#0F2142] truncate">{it.name}</span>
                            {it.badge && <span className="text-[9px] font-bold px-1 py-0.5 bg-amber-100 text-amber-700 rounded">{it.badge}</span>}
                            {!it.available && <span className="text-[9px] font-bold px-1 py-0.5 bg-slate-200 text-slate-600 rounded">PLANNED</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">{it.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <div className="font-bold text-amber-800">MVP Scope</div>
            <div className="text-amber-700">Arduino, Breadboard, LED, RGB LED, 7-segment display, resistor, pushbutton, slide switch, potentiometer, LDR, PIR motion sensor, HC-SR04 ultrasonic sensor, TMP36 temperature sensor, relay module, joystick module, servo motor, DC motor, H-bridge driver, buzzer & wires are interactive.</div>
          </div>
        </div>
      </div>
        </>
      )}
    </aside>
  );
}
