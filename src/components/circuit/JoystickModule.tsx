"use client";

import { useRef } from "react";
import type { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  isPressed: boolean;
  onSelect: () => void;
  onAxisChange: (axis: "xValue" | "yValue", value: number) => void;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export function JoystickModule({ comp, isSelected, isPressed, onSelect, onAxisChange, onPressStart, onPressEnd }: Props) {
  const draggingPad = useRef(false);
  const xValue = Math.max(0, Math.min(1023, Number(comp.properties.xValue) || 0));
  const yValue = Math.max(0, Math.min(1023, Number(comp.properties.yValue) || 0));
  const handlePadPosition = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 1023);
    const y = Math.round((1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))) * 1023);
    onAxisChange("xValue", x);
    onAxisChange("yValue", y);
  };

  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title="Drag the joystick pad to set X/Y; press its red button; drag the base to move"
    >
      <div className="absolute left-1/2 top-1 h-[116px] w-[108px] -translate-x-1/2 rounded-xl border-2 border-slate-400 bg-slate-200 shadow-md">
        <div
          role="group"
          aria-label="Joystick X/Y pad"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            draggingPad.current = true;
            onSelect();
            event.currentTarget.setPointerCapture(event.pointerId);
            handlePadPosition(event);
          }}
          onPointerMove={(event) => { if (draggingPad.current) handlePadPosition(event); }}
          onPointerUp={(event) => {
            if (!draggingPad.current) return;
            draggingPad.current = false;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { draggingPad.current = false; }}
          onMouseDown={(event) => event.stopPropagation()}
          className="absolute left-1/2 top-2 h-[72px] w-[72px] -translate-x-1/2 rounded-full border-2 border-slate-500 bg-slate-300 shadow-inner cursor-crosshair touch-none"
          style={{ backgroundImage: "linear-gradient(90deg, transparent 49%, rgba(71,85,105,.3) 50%, transparent 51%), linear-gradient(0deg, transparent 49%, rgba(71,85,105,.3) 50%, transparent 51%)" }}
        >
          <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[7px] font-bold text-slate-500">Y+</span>
          <span className="absolute left-1/2 bottom-1 -translate-x-1/2 text-[7px] font-bold text-slate-500">Y−</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] font-bold text-slate-500">X−</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] font-bold text-slate-500">X+</span>
          <span
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-700 bg-slate-600 shadow-md pointer-events-none"
            style={{ left: `${(xValue / 1023) * 100}%`, top: `${((1023 - yValue) / 1023) * 100}%` }}
          />
        </div>
        <button
          type="button"
          aria-label={`Joystick button, ${isPressed ? "pressed" : "released"}`}
          aria-pressed={isPressed}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            onSelect();
            onPressStart();
          }}
          onPointerUp={(event) => {
            event.stopPropagation();
            onPressEnd();
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={onPressEnd}
          onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); }}
          onMouseUp={(event) => { event.stopPropagation(); onPressEnd(); }}
          onMouseLeave={onPressEnd}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") { event.preventDefault(); onPressStart(); }
          }}
          onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") onPressEnd(); }}
          onBlur={onPressEnd}
          className={`absolute left-1/2 top-[82px] -translate-x-1/2 h-5 w-8 rounded-full border border-slate-600 shadow-sm text-[7px] font-black text-white ${isPressed ? "bg-rose-700" : "bg-rose-500 hover:bg-rose-600"}`}
          title="Hold to press joystick button"
        >SW</button>
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`Joystick ${terminal.label}`}
          className={`absolute z-20 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" ? "bg-red-500" : terminal.label === "GND" ? "bg-slate-700" : terminal.label === "SW" ? "bg-amber-500" : "bg-blue-500"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[124px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[18px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-1.5 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm whitespace-nowrap text-[9px] font-bold text-slate-700 pointer-events-none">
        XY Joystick · X {xValue} / Y {yValue}
      </span>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
