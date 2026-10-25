"use client";
import { ComponentInstance } from "@/types/circuit";

export function ArduinoUno({ comp, isSelected, onSelect }: { comp: ComponentInstance; isSelected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "ring-2 ring-[#0E9A8B] ring-offset-2" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
    >
      {/* Board */}
      <div className="w-full h-full bg-[#0F2142] rounded-[10px] border-[3px] border-[#0a1933] shadow-lg relative overflow-hidden">
        {/* PCB pattern */}
        <div className="absolute inset-[6px] rounded-[6px] bg-[#14325f] border border-[#1a4a8a]/30" />
        {/* Header */}
        <div className="absolute top-1.5 left-3 right-3 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[#0E9A8B] rounded-full animate-pulse" />
            <span className="text-[9px] font-black tracking-widest text-white">ARDUINO</span>
            <span className="text-[9px] font-bold text-[#7de3d8]">UNO R3</span>
          </div>
          <span className="text-[8px] font-bold px-1.5 py-0.5 bg-white/10 rounded text-white/70">ATmega328P</span>
        </div>

        {/* USB + Power jack illustration */}
        <div className="absolute bottom-2 left-2 w-12 h-6 bg-slate-300 rounded-sm border border-slate-400 flex items-center justify-center">
          <span className="text-[7px] font-bold text-slate-700">USB</span>
        </div>
        <div className="absolute bottom-2 left-[58px] w-8 h-6 bg-black rounded-sm border border-slate-600" />
        {/* MCU */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88px] h-[48px] bg-black rounded-[4px] border border-slate-700 flex flex-col items-center justify-center">
          <div className="text-[7px] font-bold text-white/80">ATMEGA328P</div>
          <div className="text-[6px] text-white/50">16MHz • 32KB</div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-slate-600 rounded-full" />
            ))}
          </div>
        </div>
        {/* Reset button */}
        <div className="absolute top-[46px] right-6 w-3 h-3 bg-red-500 rounded-full border-2 border-red-700 shadow" title="RESET" />
        <div className="absolute top-[42px] right-[18px] text-[6px] font-bold text-white/60">RESET</div>

        {/* Digital pins labels on right edge */}
        <div className="absolute right-1 top-[14px] bottom-[18px] flex flex-col justify-between py-1">
          {comp.terminals
            .filter((t) => t.label.startsWith("D"))
            .map((t) => (
              <div key={t.id} className="flex items-center gap-1">
                <span className="text-[7px] font-bold text-[#7de3d8] w-5 text-right">{t.label}</span>
                <div className="w-2 h-2 rounded-full bg-[#0E9A8B] border border-white shadow-sm" data-terminal-id={t.id} />
              </div>
            ))}
        </div>

        {/* Power/A0-A5 on left edge */}
        <div className="absolute left-1 top-[14px] bottom-[18px] flex flex-col justify-between py-1">
          {comp.terminals
            .filter((t) => !t.label.startsWith("D") && !t.label.startsWith("GND") && t.label !== "RESET")
            .slice(0, 10)
            .map((t) => (
              <div key={t.id} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 border border-white shadow-sm" data-terminal-id={t.id} />
                <span className="text-[7px] font-bold text-amber-200 w-7">{t.label}</span>
              </div>
            ))}
        </div>

        {/* GND along bottom */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2">
          {comp.terminals
            .filter((t) => t.label.includes("GND"))
            .map((t) => (
              <div key={t.id} className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-slate-900 border border-white" data-terminal-id={t.id} />
                <span className="text-[6px] font-bold text-white/60">{t.label.replace("-", "")}</span>
              </div>
            ))}
        </div>

        {/* Selection handle */}
        {isSelected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#0E9A8B] rounded-full border-2 border-white" />}
      </div>
      <div className="mt-1 text-center">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-[10px] font-bold text-slate-700">{comp.label}</span>
        </div>
      </div>
    </div>
  );
}
