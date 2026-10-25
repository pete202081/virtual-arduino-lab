"use client";
import { ComponentInstance } from "@/types/circuit";

export function Resistor({ comp, isSelected, onSelect }: { comp: ComponentInstance; isSelected: boolean; onSelect: () => void }) {
  const resistance = comp.properties.resistance || "220 Ω";
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "ring-2 ring-[#0E9A8B] ring-offset-2" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
    >
      <div className="w-full h-full flex items-center">
        {/* Lead left */}
        <div className="w-3 h-0.5 bg-slate-400" />
        <div className="w-2 h-2 bg-[#D97706] rounded-full border-2 border-white shadow shrink-0" data-terminal-id={`${comp.id}-A`} title="Terminal A" />
        {/* Body */}
        <div className="flex-1 h-6 bg-[#FEF3C7] border-2 border-[#D97706] rounded-full flex items-center justify-center relative mx-0.5 shadow-sm">
          <div className="absolute inset-1 flex gap-0.5 items-center justify-center">
            <div className="w-1 h-3 bg-red-600 rounded-sm" title="Red" />
            <div className="w-1 h-3 bg-red-600 rounded-sm" title="Red" />
            <div className="w-1 h-3 bg-amber-800 rounded-sm" title="Brown" />
            <div className="w-1.5 h-3 bg-yellow-400 rounded-sm border border-yellow-600" title="Gold ±5%" />
          </div>
          <span className="text-[7px] font-black text-[#92400E] z-10 mt-3">220Ω</span>
        </div>
        <div className="w-2 h-2 bg-[#D97706] rounded-full border-2 border-white shadow shrink-0" data-terminal-id={`${comp.id}-B`} title="Terminal B" />
        <div className="w-3 h-0.5 bg-slate-400" />
      </div>
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-white border border-slate-200 rounded-full shadow-sm whitespace-nowrap">
        <span className="text-[10px] font-bold text-slate-700">{comp.label}</span>
        <span className="text-[9px] text-slate-500 ml-1">{resistance}</span>
      </div>
    </div>
  );
}
