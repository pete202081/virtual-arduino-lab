"use client";

import { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onValueChange: (value: number) => void;
}

export function Potentiometer({ comp, isSelected, onSelect, onValueChange }: Props) {
  const value = Math.max(0, Math.min(1023, Math.round(Number(comp.properties.value) || 0)));
  const angle = -135 + (value / 1023) * 270;
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`10kΩ potentiometer — analog value ${value} of 1023`}
    >
      <div className="absolute left-1/2 top-0 h-11 w-11 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-800 shadow-md flex items-center justify-center">
        <div className="relative h-8 w-8 rounded-full border border-slate-500 bg-slate-700">
          <div className="absolute left-1/2 top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-[13px] origin-[50%_13px] rounded-full bg-teal-300 shadow" style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-9px)` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/70">10k</span>
        </div>
      </div>
      <div className="absolute left-1 top-[45px] right-1 flex items-center justify-center">
        <input
          type="range"
          min={0}
          max={1023}
          step={1}
          value={value}
          aria-label="Potentiometer position"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onValueChange(Number(event.target.value))}
          className="w-full h-3 accent-teal-600 cursor-ew-resize"
        />
      </div>
      <span className="absolute left-1 top-[57px] text-[8px] font-bold text-slate-500">0</span>
      <span className="absolute right-1 top-[57px] text-[8px] font-bold text-slate-500">1023</span>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Potentiometer ${terminal.label}`}
          className={`absolute z-10 w-2.5 h-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "GND" ? "bg-slate-600" : terminal.label === "5V" ? "bg-rose-500" : "bg-teal-600"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        {comp.label} · {value}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
