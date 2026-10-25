"use client";

import type { ComponentInstance } from "@/types/circuit";
import type { DcMotorState } from "@/simulation/interfaces/simulationAdapter";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  state: DcMotorState;
  onSelect: () => void;
}

const labels = { CLOCKWISE: "CW", COUNTERCLOCKWISE: "CCW", STOPPED: "STOP", BRAKED: "BRAKE" } as const;

export function DcMotor({ comp, isSelected, state, onSelect }: Props) {
  const isRunning = state.direction === "CLOCKWISE" || state.direction === "COUNTERCLOCKWISE";
  const status = isRunning ? `${labels[state.direction]} · ${state.speedPercent}%` : labels[state.direction];
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`DC motor: ${state.direction.toLowerCase()}${isRunning ? ` at ${state.speedPercent}% PWM` : ""}`}
    >
      <div className="absolute left-1/2 top-2 h-[52px] w-[70px] -translate-x-1/2 rounded-[18px] border-2 border-slate-500 bg-slate-300 shadow-md flex items-center justify-center">
        <div className="absolute -left-2 top-3 h-7 w-3 rounded-l-md border border-slate-500 bg-slate-400" />
        <div className="absolute -right-2 top-3 h-7 w-3 rounded-r-md border border-slate-500 bg-slate-400" />
        <div className={`h-9 w-9 rounded-full border-2 border-slate-500 bg-slate-100 flex items-center justify-center ${isRunning ? "animate-spin" : ""}`} style={{ animationDuration: `${Math.max(0.18, 2 - (state.speedPercent / 100) * 1.8)}s`, animationDirection: state.direction === "COUNTERCLOCKWISE" ? "reverse" : "normal", animationPlayState: isRunning ? "running" : "paused" }}>
          <span className="h-1 w-6 rounded-full bg-amber-500" />
        </div>
        <span className="absolute bottom-0.5 text-[6px] font-black text-slate-600">DC</span>
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`DC motor terminal ${terminal.label}`}
          className={`absolute z-20 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "M+" ? "bg-red-500" : "bg-slate-700"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[83px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[24px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold ${isRunning ? "text-emerald-700" : "text-slate-600"}`}>
        DC Motor · {status}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
