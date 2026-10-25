"use client";

import { Zap } from "lucide-react";
import type { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
}

export function RelayModule({ comp, isSelected, onSelect }: Props) {
  const energized = comp.properties.isEnergized === true;
  const activeLow = comp.properties.activeLow !== false;
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`Relay module ${energized ? "energized" : "released"}; COM is connected to ${energized ? "NO" : "NC"}`}
    >
      <div className={`absolute inset-x-0 top-0 h-[108px] rounded-xl border-2 shadow-md ${energized ? "border-amber-400 bg-amber-50" : "border-amber-200 bg-white"}`}>
        <div className="absolute left-5 top-5 h-12 w-[54px] rounded-lg border border-slate-300 bg-slate-100 flex flex-col items-center justify-center">
          <Zap className={`h-5 w-5 ${energized ? "text-amber-500 fill-amber-200" : "text-slate-500"}`} />
          <span className="text-[7px] font-black text-slate-600">5V COIL</span>
        </div>
        <div className="absolute right-5 top-4 h-[68px] w-[54px] rounded-md border border-slate-300 bg-slate-50">
          <span className="absolute left-1 top-1 text-[7px] font-black text-slate-600">CONTACTS</span>
          <span className="absolute right-1 top-[20px] h-2 w-2 rounded-full bg-amber-600" />
          <span className="absolute right-1 top-[42px] h-2 w-2 rounded-full bg-slate-500" />
          <span className="absolute left-1 top-[20px] h-2 w-2 rounded-full bg-slate-500" />
          <span className={`absolute left-[10px] top-[25px] h-0.5 w-8 origin-left ${energized ? "rotate-[-27deg] bg-amber-600" : "rotate-[27deg] bg-slate-500"}`} />
          <span className="absolute right-0 top-[18px] text-[6px] font-bold text-slate-600">NO</span>
          <span className="absolute right-0 top-[40px] text-[6px] font-bold text-slate-600">NC</span>
        </div>
        <div className={`absolute bottom-1 left-0 right-0 text-center text-[8px] font-black ${energized ? "text-amber-800" : "text-slate-600"}`}>
          {energized ? "ENERGIZED · COM–NO" : "RELEASED · COM–NC"} · IN {activeLow ? "ACTIVE LOW" : "ACTIVE HIGH"}
        </div>
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Relay terminal ${terminal.label}`}
          className={`absolute z-10 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" ? "bg-rose-500" : terminal.label === "GND" ? "bg-slate-700" : terminal.label === "IN" ? "bg-amber-500" : "bg-emerald-600"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[110px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[26px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
