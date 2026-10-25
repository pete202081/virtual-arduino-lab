"use client";

import type { ComponentInstance } from "@/types/circuit";
import type { ServoState } from "@/simulation/interfaces/simulationAdapter";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  state: ServoState;
  onSelect: () => void;
}

export function ServoMotor({ comp, isSelected, state, onSelect }: Props) {
  const angle = Math.max(0, Math.min(180, Math.round(state.angle)));
  const pinText = state.signalPin === undefined ? "unattached" : `D${state.signalPin}`;
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`Servo motor: ${angle} degrees, ${state.pulseMicroseconds} microseconds at ${state.refreshHz} Hz`}
    >
      <div className="absolute left-1/2 top-1 h-[58px] w-[58px] -translate-x-1/2">
        <div className="absolute bottom-1 left-1/2 h-8 w-1.5 -translate-x-1/2 origin-bottom rounded-full bg-white border border-slate-400 shadow-sm transition-transform duration-200" style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }} />
        <div className="absolute bottom-0 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-200 shadow z-10" />
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-500">{angle}°</span>
      </div>
      <div className="absolute left-1/2 top-[43px] h-[42px] w-[86px] -translate-x-1/2 rounded-md border-2 border-slate-500 bg-blue-100 shadow flex flex-col items-center justify-center">
        <span className="text-[9px] font-black tracking-wide text-slate-700">SERVO</span>
        <span className="text-[7px] font-bold text-slate-500">{pinText} · {state.pulseMicroseconds}µs</span>
        <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Servo ${terminal.label === "SIG" ? "signal" : terminal.label}`}
          className={`absolute z-20 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" ? "bg-red-500" : terminal.label === "GND" ? "bg-slate-700" : "bg-amber-500"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[97px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[24px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        Servo · {angle}° · {state.pulseMicroseconds}µs @ {state.refreshHz}Hz
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
