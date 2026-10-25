"use client";

import type { ComponentInstance } from "@/types/circuit";
import type { DcMotorState } from "@/simulation/interfaces/simulationAdapter";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  state?: DcMotorState;
  onSelect: () => void;
}

const directionLabel: Record<DcMotorState["direction"], string> = {
  CLOCKWISE: "CW",
  COUNTERCLOCKWISE: "CCW",
  STOPPED: "STOP",
  BRAKED: "BRAKE",
};

export function HBridgeDriver({ comp, isSelected, state, onSelect }: Props) {
  const status = state ? `${directionLabel[state.direction]} · ${state.speedPercent}%` : "NO LOAD / CHECK WIRES";
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`H-bridge driver: ${status}`}
    >
      <div className="absolute inset-x-1 top-3 h-[86px] rounded-lg border-2 border-slate-500 bg-slate-800 shadow-md flex flex-col items-center justify-center">
        <div className="rounded bg-slate-700 border border-slate-500 px-3 py-1 text-[9px] font-black tracking-wider text-cyan-100">L298N</div>
        <span className="mt-1 text-[7px] font-bold text-slate-300">DUAL H-BRIDGE · A</span>
        <span className="mt-0.5 text-[7px] font-black text-emerald-300">{status}</span>
        <span className="absolute left-2 top-1 text-[6px] font-bold text-red-300">VCC / VM / GND</span>
        <span className="absolute right-1 top-1 text-[6px] font-bold text-amber-200">OUT1 / OUT2</span>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[6px] font-bold text-sky-200">ENA · IN1 · IN2</span>
      </div>
      {comp.terminals.map((terminal) => (
          <span
            key={terminal.id}
            data-terminal-id={terminal.id}
            title={`H-bridge ${terminal.label}${terminal.label === "ENA" ? " PWM enable" : ""}`}
            className={`absolute z-20 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" || terminal.label === "VM" ? "bg-red-500" : terminal.label === "GND" ? "bg-slate-900" : terminal.label.startsWith("OUT") ? "bg-amber-400" : "bg-blue-500"}`}
            style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
          />
      ))}
      <div className="absolute top-[101px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.slice(0, 3).map((terminal) => <span key={terminal.id} className="w-[30px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        H-Bridge Driver · {status}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
