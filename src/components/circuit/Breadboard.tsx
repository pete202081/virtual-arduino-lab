"use client";
import { ComponentInstance } from "@/types/circuit";

export function Breadboard({ comp, isSelected, onSelect }: { comp: ComponentInstance; isSelected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "ring-2 ring-[#0E9A8B] ring-offset-2" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: Math.max(comp.height, 184) }}
    >
      <div className="w-full h-full bg-[#F5F0E6] rounded-[8px] border-[2px] border-[#D6CFC0] shadow-lg relative overflow-hidden">
        {/* Top label */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <span className="text-[8px] font-black tracking-widest text-[#6B5E4A]">MB-102</span>
          <span className="text-[7px] font-bold px-1 py-0.5 bg-[#6B5E4A] text-white rounded">830 POINT</span>
          <span className="text-[7px] text-[#6B5E4A]">Center trench not connected</span>
        </div>

        {/* Power rails */}
        <div className="absolute top-[10px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={`top-plus-${i}`} className="w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full" data-terminal-id={`${comp.id}-R_TOP+_${i}`} />
            ))}
          </div>
        </div>
        <div className="absolute top-[11px] left-2 text-[6px] font-black text-red-600">+</div>
        <div className="absolute top-[11px] right-2 text-[6px] font-black text-blue-600">-</div>

        <div className="absolute top-[24px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={`top-minus-${i}`} className="w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full" data-terminal-id={`${comp.id}-R_TOP-_${i}`} />
            ))}
          </div>
        </div>

        {/* Main strips - top half */}
        <div className="absolute top-[42px] left-[14px] right-[14px] h-[46px] bg-white rounded border border-[#D6CFC0] p-1">
          <div className="w-full h-full grid" style={{ gridTemplateColumns: "repeat(30, 1fr)", gap: "2px" }}>
            {Array.from({ length: 30 }).map((_, col) => (
              <div key={`top-strip-${col}`} className="bg-[#FDFBF7] border border-[#E8E0D0] rounded-sm p-0.5 flex flex-col justify-between">
                {Array.from({ length: 5 }).map((_, row) => (
                  <div
                    key={`t-${col}-${row}`}
                    className="w-full h-[5px] bg-[#1F2937] rounded-full border border-black/10 hover:bg-[#0E9A8B] cursor-crosshair"
                    data-terminal-id={`${comp.id}-T-${col}-${row}`}
                    title={`T-${col}-${row} (top strip ${col})`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Center trench */}
        <div className="absolute top-[90px] left-0 right-0 h-[6px] bg-[#D6CFC0] border-y border-[#B8AD9A] flex items-center justify-center">
          <span className="text-[6px] font-bold text-[#6B5E4A] tracking-widest">T R E N C H — NOT CONNECTED</span>
        </div>

        {/* Main strips - bottom half */}
        <div className="absolute top-[100px] left-[14px] right-[14px] h-[46px] bg-white rounded border border-[#D6CFC0] p-1">
          <div className="w-full h-full grid" style={{ gridTemplateColumns: "repeat(30, 1fr)", gap: "2px" }}>
            {Array.from({ length: 30 }).map((_, col) => (
              <div key={`bot-strip-${col}`} className="bg-[#FDFBF7] border border-[#E8E0D0] rounded-sm p-0.5 flex flex-col justify-between">
                {Array.from({ length: 5 }).map((_, row) => (
                  <div
                    key={`b-${col}-${row}`}
                    className="w-full h-[5px] bg-[#1F2937] rounded-full border border-black/10 hover:bg-[#0E9A8B] cursor-crosshair"
                    data-terminal-id={`${comp.id}-B-${col}-${row}`}
                    title={`B-${col}-${row} (bottom strip ${col})`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom power rails */}
        <div className="absolute bottom-[20px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={`bot-plus-${i}`} className="w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full" data-terminal-id={`${comp.id}-R_BOT+_${i}`} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-[6px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={`bot-minus-${i}`} className="w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full" data-terminal-id={`${comp.id}-R_BOT-_${i}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Foot label */}
      <div className="mt-1 text-center">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
          <span className="text-[10px] font-bold text-slate-700">{comp.label}</span>
          <span className="text-[9px] text-slate-500">Trench isolates top/bottom</span>
        </div>
      </div>
    </div>
  );
}
