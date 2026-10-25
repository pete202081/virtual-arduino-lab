"use client";

import { Volume2 } from "lucide-react";
import { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  isBuzzing: boolean;
  frequency?: number;
  onSelect: () => void;
}

export function Buzzer({ comp, isSelected, isBuzzing, frequency = 0, onSelect }: Props) {
  const buzzerType = comp.properties.buzzerType === "passive" ? "Passive" : "Active";
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`${buzzerType} buzzer${isBuzzing ? ` sounding at ${frequency} Hz` : ""}`}
    >
      <div className={`absolute left-1/2 top-0 h-12 w-12 -translate-x-1/2 rounded-full border-2 shadow-md transition-colors ${isBuzzing ? "border-amber-500 bg-slate-800 shadow-amber-400/60" : "border-slate-600 bg-slate-900"}`}>
        <div className="absolute inset-2 rounded-full border border-slate-500 bg-slate-700 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-black border border-slate-500" />
        </div>
        {isBuzzing && <div className="absolute -inset-1 rounded-full border-2 border-amber-400/70 animate-ping" />}
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Buzzer ${terminal.label === "+" ? "positive (+)" : "negative (−)"}`}
          className={`absolute z-10 w-3 h-2 rounded-sm cursor-crosshair ${terminal.label === "+" ? "bg-amber-500" : "bg-slate-600"}`}
          style={{ left: terminal.dx - 6, top: terminal.dy - 4 }}
        />
      ))}
      <span className="absolute top-full left-1/2 -translate-x-1/2 px-1.5 py-0.5 mt-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        {buzzerType} Buzzer {isBuzzing ? `· ${frequency} Hz` : "· silent"}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
      {isBuzzing && <Volume2 className="absolute -right-3 -top-1 w-4 h-4 text-amber-500 animate-pulse" />}
    </div>
  );
}
