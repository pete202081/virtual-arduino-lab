"use client";

import { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  isPressed: boolean;
  onSelect: () => void;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function Pushbutton({ comp, isSelected, isPressed, onSelect, onPressStart, onPressEnd }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title="Drag the gray base to move; hold the red cap to press"
    >
      <div className={`absolute inset-1 rounded-lg border-2 shadow-inner transition-colors ${isPressed ? "border-slate-500 bg-slate-300" : "border-slate-400 bg-slate-200"}`}>
        <button
          type="button"
          aria-label={`${comp.label}, ${isPressed ? "pressed" : "released"}`}
          aria-pressed={isPressed}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onPressStart();
          }}
          onMouseUp={(event) => {
            event.stopPropagation();
            onPressEnd();
          }}
          onMouseLeave={onPressEnd}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              onPressStart();
            }
          }}
          onKeyUp={(event) => {
            if (event.key === " " || event.key === "Enter") onPressEnd();
          }}
          onBlur={onPressEnd}
          className={`absolute left-1/2 top-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-md border border-slate-600 shadow transition-colors cursor-pointer ${isPressed ? "bg-rose-700" : "bg-rose-500 hover:bg-rose-600"}`}
          title="Hold the red cap to press"
        />
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Terminal ${terminal.label}`}
          className="absolute z-20 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow cursor-crosshair"
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        {comp.label} · {isPressed ? "PRESSED" : "released"}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
