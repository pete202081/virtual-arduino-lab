"use client";

import { Waves } from "lucide-react";
import type { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onDistanceChange: (distance: number) => void;
}

export function HcSr04Sensor({ comp, isSelected, onSelect, onDistanceChange }: Props) {
  const rawDistance = Number(comp.properties.distanceCm ?? 100);
  const distanceCm = Math.max(2, Math.min(400, Math.round(Number.isFinite(rawDistance) ? rawDistance : 100)));
  const echoMicroseconds = distanceCm * 58;
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`HC-SR04 simulated distance ${distanceCm} cm, echo pulse ${echoMicroseconds} microseconds`}
    >
      <div className="absolute left-1/2 top-0 h-[78px] w-[116px] -translate-x-1/2 rounded-lg border-2 border-sky-300 bg-sky-100 shadow-md flex items-center justify-center gap-2">
        {[0, 1].map((transducer) => (
          <div key={transducer} className="relative h-10 w-10 rounded-full border-2 border-slate-400 bg-slate-300 shadow-inner flex items-center justify-center overflow-hidden">
            <div className="absolute inset-1 rounded-full border border-slate-400" />
            <div className="absolute inset-2 rounded-full border border-slate-400" />
            <Waves className="relative z-10 h-4 w-4 text-sky-700" />
          </div>
        ))}
        <span className="absolute bottom-1 text-[7px] font-black tracking-widest text-slate-600">HC-SR04</span>
      </div>
      <div className="absolute top-[80px] left-0 right-0 text-center">
        <div className="text-[9px] font-bold text-sky-800">{distanceCm} cm · {echoMicroseconds} µs</div>
        <input
          type="range"
          min={2}
          max={400}
          step={1}
          value={distanceCm}
          aria-label="Canvas simulated distance"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onDistanceChange(Number(event.target.value))}
          className="w-full h-3 accent-sky-600 cursor-ew-resize"
        />
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`HC-SR04 terminal ${terminal.label}`}
          className={`absolute z-10 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" ? "bg-rose-500" : terminal.label === "GND" ? "bg-slate-700" : terminal.label === "TRIG" ? "bg-amber-500" : "bg-sky-600"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[124px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[25px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
