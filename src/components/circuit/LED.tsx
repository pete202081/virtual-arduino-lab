"use client";
import { ComponentInstance } from "@/types/circuit";

export function LED({ comp, isSelected, onSelect, isLit, brightness }: { comp: ComponentInstance; isSelected: boolean; onSelect: () => void; isLit?: boolean; brightness?: number }) {
  const level = Math.max(0, Math.min(255, Math.round(brightness ?? (isLit ? 255 : 0))));
  const lit = level > 0;
  const color = (comp.properties.color as string) || "red";
  const colorMap: Record<string, string> = {
    red: "#EF4444",
    green: "#22C55E",
    blue: "#3B82F6",
    yellow: "#EAB308",
  };
  const c = colorMap[color] || "#EF4444";

  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "ring-2 ring-[#0E9A8B] ring-offset-2" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`${comp.label}: ${Math.round((level / 255) * 100)}% brightness`}
    >
      <div className="w-full h-full flex flex-col items-center">
        {/* Lens */}
        <div className="relative">
          <div
            className="w-9 h-9 rounded-t-full border-2 border-slate-300 shadow-md flex items-center justify-center overflow-hidden"
            style={{ background: lit ? c : "#FDE8E8", opacity: lit ? level / 255 : 1, boxShadow: lit ? `0 0 ${12 * level / 255}px ${c}, inset 0 1px 2px white` : "inset 0 1px 2px rgba(0,0,0,0.1)" }}
          >
            <div className="w-3 h-3 bg-white/40 rounded-full blur-[1px]" />
            {isLit && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
          </div>
          {/* Glow when lit */}
          {lit && <div className="absolute inset-0 -z-10 blur-xl" style={{ background: c, opacity: (level / 255) * 0.4 }} />}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-1.5 bg-slate-400 rounded-b-md border border-slate-500" />
        </div>

        {/* Legs */}
        <div className="flex gap-4 mt-1">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-5 bg-slate-400" />
            <div className="w-2 h-2 bg-[#0E9A8B] rounded-full border border-white shadow" data-terminal-id={`${comp.id}-ANODE`} title="ANODE (+, long leg)" />
            <span className="text-[7px] font-bold text-[#0E9A8B]">A</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-3 bg-slate-400" />
            <div className="w-2 h-2 bg-slate-700 rounded-full border border-white shadow" data-terminal-id={`${comp.id}-CATHODE`} title="CATHODE (-, short/flat)" />
            <span className="text-[7px] font-bold text-slate-600">C</span>
          </div>
        </div>

        <div className="mt-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-full shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
          <span className="text-[10px] font-bold text-slate-700">{comp.label}</span>
        </div>
        {lit && <span className="text-[9px] font-bold text-emerald-600 mt-0.5">● LIT · {Math.round((level / 255) * 100)}%</span>}
      </div>
    </div>
  );
}
