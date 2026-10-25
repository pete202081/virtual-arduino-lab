"use client";

import type { ComponentInstance } from "@/types/circuit";
import type { SevenSegmentState } from "@/simulation/interfaces/simulationAdapter";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  state: SevenSegmentState;
  onSelect: () => void;
}

const SEGMENT_PATHS: Record<string, string> = {
  A: "22,5 82,5 75,12 29,12",
  B: "84,8 91,15 91,37 83,43 78,38 78,17",
  C: "83,46 91,52 91,74 84,81 78,73 78,52",
  D: "29,78 75,78 82,85 22,85 16,78",
  E: "13,52 21,46 26,52 26,73 19,81 13,74",
  F: "13,15 20,8 26,17 26,38 21,43 13,37",
  G: "27,42 33,36 72,36 78,42 72,48 33,48",
};

export function SevenSegmentDisplay({ comp, isSelected, state, onSelect }: Props) {
  const activeLabels = Object.entries(state.segments).filter(([, active]) => active).map(([label]) => label);
  const title = state.digit !== null
    ? `7-segment display: ${state.digit}`
    : activeLabels.length || state.decimalPoint
      ? "7-segment display: custom pattern"
      : "7-segment display: blank";
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={title}
    >
      <div className="absolute left-1/2 top-1 h-[104px] w-[148px] -translate-x-1/2 rounded-xl border-[3px] border-slate-500 bg-slate-900 shadow-md flex items-center justify-center">
        <svg viewBox="0 0 120 95" className="h-[91px] w-[122px]" role="img" aria-label={title}>
          {Object.entries(SEGMENT_PATHS).map(([label, points]) => {
            const isOn = state.segments[label as keyof SevenSegmentState["segments"]];
            return (
              <polygon
                key={label}
                points={points}
                fill={isOn ? "#FF302D" : "#43191B"}
                style={{ filter: isOn ? "drop-shadow(0 0 5px #ff2525)" : undefined, transition: "fill 100ms ease" }}
              />
            );
          })}
          <circle
            cx="105"
            cy="77"
            r="5"
            fill={state.decimalPoint ? "#FF302D" : "#43191B"}
            style={{ filter: state.decimalPoint ? "drop-shadow(0 0 5px #ff2525)" : undefined, transition: "fill 100ms ease" }}
          />
        </svg>
      </div>
      <div className="absolute top-[108px] left-1/2 -translate-x-1/2 text-[8px] font-black tracking-[0.18em] text-slate-500">A B C D E F G DP</div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`7-segment ${terminal.label === "DP" ? "decimal point" : terminal.label.startsWith("COM") ? `${terminal.label} common cathode` : `segment ${terminal.label}`}`}
          className={`absolute z-10 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label.startsWith("COM") ? "bg-slate-700" : terminal.label === "DP" ? "bg-amber-400" : "bg-red-500"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[143px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[17px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        7-Segment Display · {state.digit === null ? (activeLabels.length ? "custom" : "blank") : state.digit}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
