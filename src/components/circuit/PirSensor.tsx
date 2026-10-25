"use client";

import { Radio } from "lucide-react";
import type { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onMotionToggle: () => void;
}

export function PirSensor({ comp, isSelected, onSelect, onMotionToggle }: Props) {
  const motionDetected = comp.properties.motionDetected === true;
  const toggleMotion = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect();
    onMotionToggle();
  };

  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title="PIR motion sensor: toggle simulated motion; drag the module base to move it"
    >
      <div className="absolute left-1/2 top-0 h-[74px] w-[88px] -translate-x-1/2 rounded-xl border-2 border-violet-300 bg-violet-100 shadow-md flex flex-col items-center justify-center">
        <div className="relative h-10 w-10 rounded-full border border-slate-300 bg-white shadow-inner flex items-center justify-center overflow-hidden">
          <div className="absolute inset-1 rounded-full border border-violet-200" />
          <div className="absolute inset-2 rounded-full border border-violet-200" />
          <Radio className={`relative z-10 h-5 w-5 ${motionDetected ? "text-violet-700" : "text-slate-500"}`} />
        </div>
        <span className="mt-1 text-[8px] font-black tracking-wider text-violet-900">PIR SENSOR</span>
      </div>
      <button
        type="button"
        aria-label={`PIR motion, ${motionDetected ? "detected" : "clear"}`}
        aria-pressed={motionDetected}
        title="Toggle simulated motion detected/clear"
        onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
        onClick={toggleMotion}
        className={`absolute left-1/2 top-[77px] -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[8px] font-bold shadow-sm ${motionDetected ? "border-violet-300 bg-violet-100 text-violet-800" : "border-slate-200 bg-white text-slate-600"}`}
      >
        {motionDetected ? "MOTION DETECTED" : "MOTION CLEAR"}
      </button>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`PIR sensor terminal ${terminal.label}`}
          className={`absolute z-10 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" ? "bg-rose-500" : terminal.label === "GND" ? "bg-slate-700" : "bg-violet-600"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[105px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[24px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
