"use client";

import { Sun } from "lucide-react";
import { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onLightLevelChange: (level: number) => void;
}

export function LdrSensor({ comp, isSelected, onSelect, onLightLevelChange }: Props) {
  const lightLevel = Math.max(0, Math.min(100, Math.round(Number(comp.properties.lightLevel) || 0)));
  const adc = Math.round((lightLevel / 100) * 1023);
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`LDR light level ${lightLevel}%, analog output ${adc}`}
    >
      <div className={`absolute left-1/2 top-0 h-12 w-12 -translate-x-1/2 rounded-full border-2 shadow-md flex items-center justify-center transition-colors ${lightLevel > 50 ? "border-amber-400 bg-amber-50" : "border-slate-500 bg-slate-700"}`}>
        <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center ${lightLevel > 50 ? "border-amber-600 bg-amber-200" : "border-slate-400 bg-slate-500"}`}>
          <div className="h-1.5 w-5 rounded-full bg-slate-400 rotate-45 border border-slate-500" />
        </div>
        {lightLevel > 65 && <Sun className="absolute -right-1 -top-1 w-4 h-4 text-amber-500 animate-pulse" />}
      </div>
      <div className="absolute left-1 top-[48px] right-1 text-center">
        <div className="text-[8px] font-bold text-slate-600">Light {lightLevel}% · ADC {adc}</div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={lightLevel}
          aria-label="LDR light level"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onLightLevelChange(Number(event.target.value))}
          className="w-full h-3 accent-amber-500 cursor-ew-resize"
        />
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`LDR sensor ${terminal.label}`}
          className={`absolute z-10 w-2.5 h-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "GND" ? "bg-slate-600" : terminal.label === "VCC" ? "bg-rose-500" : "bg-amber-500"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        LDR Sensor · {adc}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
