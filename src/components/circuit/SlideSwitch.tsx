"use client";

import type { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  isOn: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export function SlideSwitch({ comp, isSelected, isOn, onSelect, onToggle }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title="Click the blue slider to latch ON or OFF; drag the gray base to move"
    >
      <div className="absolute inset-x-1 top-1 h-8 rounded-lg border-2 border-slate-400 bg-slate-200 shadow-inner flex items-center px-1">
        <span className="absolute left-2 text-[8px] font-black text-slate-500">OFF</span>
        <span className="absolute right-2 text-[8px] font-black text-cyan-800">ON</span>
        <button
          type="button"
          aria-label={`Slide switch, ${isOn ? "ON" : "OFF"}`}
          aria-pressed={isOn}
          onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
          onClick={(event) => { event.stopPropagation(); onSelect(); onToggle(); }}
          className={`relative z-10 h-6 w-8 rounded-md border border-slate-600 shadow transition-transform duration-150 cursor-pointer ${isOn ? "translate-x-8 bg-cyan-600" : "translate-x-0 bg-slate-600"}`}
          title="Toggle slide switch"
        />
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Slide switch terminal ${terminal.label}`}
          className="absolute z-20 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow cursor-crosshair"
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        Slide Switch · {isOn ? "ON" : "OFF"}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
