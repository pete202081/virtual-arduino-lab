"use client";

import { ComponentInstance } from "@/types/circuit";
import type { RGBLedState } from "@/simulation/interfaces/simulationAdapter";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  state: RGBLedState;
  onSelect: () => void;
}

export function RGBLED({ comp, isSelected, state, onSelect }: Props) {
  const red = state.redLevel;
  const green = state.greenLevel;
  const blue = state.blueLevel;
  const active = red > 0 || green > 0 || blue > 0;
  const channels = [state.red && "R", state.green && "G", state.blue && "B"].filter(Boolean).join("+") || "OFF";
  const levelText = `R ${Math.round((red / 255) * 100)}% · G ${Math.round((green / 255) * 100)}% · B ${Math.round((blue / 255) * 100)}%`;
  const mixedColor = active ? `rgb(${red}, ${green}, ${blue})` : "#1F2937";
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`RGB LED: ${channels}`}
    >
      <div
        className="absolute left-1/2 top-0 h-11 w-11 -translate-x-1/2 rounded-t-full rounded-b-lg border-2 border-slate-400 flex items-center justify-center overflow-hidden transition-colors"
        style={{ backgroundColor: mixedColor, boxShadow: active ? `0 0 16px ${mixedColor}` : "inset 0 1px 3px rgba(0,0,0,.35)" }}
      >
        <div className="w-3 h-3 rounded-full bg-white/35 blur-[1px]" />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[6px] font-black text-white/80">RGB</span>
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`RGB LED ${terminal.label === "COMMON" ? "common cathode" : terminal.label === "R" ? "red channel" : terminal.label === "G" ? "green channel" : "blue channel"}`}
          className={`absolute z-10 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "R" ? "bg-red-500" : terminal.label === "G" ? "bg-green-500" : terminal.label === "B" ? "bg-blue-500" : "bg-slate-700"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        RGB LED · {channels} · {levelText}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
