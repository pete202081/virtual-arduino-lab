"use client";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ComponentInstance } from "@/types/circuit";

interface FocusedHole {
  id: string;
  coordinate: string;
  description: string;
  x: number;
  y: number;
}

function describeHole(holeId: string) {
  const strip = holeId.match(/^([TB])-(\d+)-(\d+)$/);
  if (strip) {
    const bank = strip[1];
    const column = Number(strip[2]) + 1;
    const row = Number(strip[3]);
    const letter = (bank === "T" ? "ABCDE" : "FGHIJ")[row] ?? "?";
    return { coordinate: `${letter}${column}`, description: `Column ${column} · Row ${letter}` };
  }
  const rail = holeId.match(/^R_(TOP|BOT)([+-])_(\d+)$/);
  if (rail) {
    const position = Number(rail[3]) + 1;
    return {
      coordinate: `${rail[2]}${position}`,
      description: `${rail[1] === "TOP" ? "Upper" : "Lower"} ${rail[2] === "+" ? "positive" : "negative"} rail · Position ${position}`,
    };
  }
  return { coordinate: holeId, description: "Breadboard connection point" };
}

export function Breadboard({ comp, isSelected, onSelect }: { comp: ComponentInstance; isSelected: boolean; onSelect: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [focusedHole, setFocusedHole] = useState<FocusedHole | null>(null);
  const focusHole = (event: MouseEvent<HTMLDivElement>, holeId: string) => {
    const rootRect = rootRef.current?.getBoundingClientRect();
    if (!rootRect || !comp.width) return;
    const holeRect = event.currentTarget.getBoundingClientRect();
    const scale = rootRect.width / comp.width;
    const { coordinate, description } = describeHole(holeId);
    setFocusedHole({
      id: holeId,
      coordinate,
      description,
      x: (holeRect.left + holeRect.width / 2 - rootRect.left) / scale,
      y: (holeRect.top + holeRect.height / 2 - rootRect.top) / scale,
    });
  };

  return (
    <div
      ref={rootRef}
      onClick={onSelect}
      onMouseLeave={() => setFocusedHole(null)}
      className={`absolute select-none cursor-move ${isSelected ? "ring-2 ring-[#0E9A8B] ring-offset-2" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: Math.max(comp.height, 184) }}
    >
      <div className="w-full h-full bg-[#F5F0E6] rounded-[8px] border-[2px] border-[#D6CFC0] shadow-lg relative overflow-hidden">
        {/* Top label */}
        <div className="absolute top-0 left-1/2 z-10 h-[8px] -translate-x-1/2 flex items-center gap-1.5 pointer-events-none">
          <span className="text-[7px] leading-[8px] font-black tracking-wide text-[#6B5E4A]">MB-102</span>
          <span className="text-[6px] leading-[8px] font-bold px-1 bg-[#6B5E4A] text-white rounded">830 POINT</span>
          <span className="text-[6px] leading-[8px] text-[#6B5E4A]">Center trench not connected</span>
        </div>

        {/* Power rails */}
        <div className="absolute top-[10px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
              key={`top-plus-${i}`}
              className="relative w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full transition-transform duration-100 hover:scale-[1.8] hover:z-20"
              data-terminal-id={`${comp.id}-R_TOP+_${i}`}
              aria-label={`Upper positive rail, position ${i + 1}`}
              onMouseEnter={(event) => focusHole(event, `R_TOP+_${i}`)}
            />
            ))}
          </div>
        </div>
        <div className="absolute top-[11px] left-2 text-[6px] font-black text-red-600">+</div>
        <div className="absolute top-[11px] right-2 text-[6px] font-black text-blue-600">-</div>

        <div className="absolute top-[24px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
              key={`top-minus-${i}`}
              className="relative w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full transition-transform duration-100 hover:scale-[1.8] hover:z-20"
              data-terminal-id={`${comp.id}-R_TOP-_${i}`}
              aria-label={`Upper negative rail, position ${i + 1}`}
              onMouseEnter={(event) => focusHole(event, `R_TOP-_${i}`)}
            />
            ))}
          </div>
        </div>

        {/* Main strips - top half */}
        <div className="absolute top-[42px] left-[14px] right-[14px] h-[46px] bg-white rounded border border-[#D6CFC0] p-1">
          <div className="w-full h-full grid" style={{ gridTemplateColumns: "repeat(30, 1fr)", gap: "2px" }}>
            {Array.from({ length: 30 }).map((_, col) => (
              <div key={`top-strip-${col}`} className="bg-[#FDFBF7] border border-[#E8E0D0] rounded-sm p-0.5 flex flex-col justify-between">
                {Array.from({ length: 5 }).map((_, row) => {
                  const holeId = `T-${col}-${row}`;
                  const { coordinate, description } = describeHole(holeId);
                  return (
                    <div
                      key={holeId}
                      className="relative w-full h-[5px] bg-[#1F2937] rounded-full border border-black/10 hover:bg-[#0E9A8B] cursor-crosshair transition-transform duration-100 hover:scale-[1.8] hover:z-20"
                      data-terminal-id={`${comp.id}-${holeId}`}
                      aria-label={`${holeId}, ${coordinate}, ${description}`}
                      title={`${holeId} · ${coordinate} · ${description}`}
                      onMouseEnter={(event) => focusHole(event, holeId)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Light coordinate markings: every strip column plus the conventional A–J row letters. */}
        <div
          aria-hidden="true"
          className="absolute top-[38px] left-[19px] right-[19px] z-10 grid pointer-events-none"
          style={{ gridTemplateColumns: "repeat(30, 1fr)", gap: "2px" }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={`column-label-${i}`} data-testid={i === 0 || i === 29 ? `breadboard-column-${i + 1}` : undefined} className="text-center text-[5px] leading-[5px] font-semibold text-slate-500">
              {i + 1}
            </span>
          ))}
        </div>
        {"ABCDE".split("").map((letter, row) => (
          <span key={`top-row-${letter}`} data-testid={row === 0 ? "breadboard-row-A" : undefined} aria-hidden="true" className="absolute left-[3px] z-10 w-[9px] text-center text-[5px] leading-[5px] font-bold text-slate-500 pointer-events-none" style={{ top: 50 + row * 6.25 }}>
            {letter}
          </span>
        ))}
        {"FGHIJ".split("").map((letter, row) => (
          <span key={`bottom-row-${letter}`} data-testid={row === 4 ? "breadboard-row-J" : undefined} aria-hidden="true" className="absolute left-[3px] z-10 w-[9px] text-center text-[5px] leading-[5px] font-bold text-slate-500 pointer-events-none" style={{ top: 108 + row * 6.25 }}>
            {letter}
          </span>
        ))}

        {/* Center trench */}
        <div className="absolute top-[90px] left-0 right-0 h-[6px] bg-[#D6CFC0] border-y border-[#B8AD9A] flex items-center justify-center">
          <span className="text-[6px] font-bold text-[#6B5E4A] tracking-widest">T R E N C H — NOT CONNECTED</span>
        </div>

        {/* Main strips - bottom half */}
        <div className="absolute top-[100px] left-[14px] right-[14px] h-[46px] bg-white rounded border border-[#D6CFC0] p-1">
          <div className="w-full h-full grid" style={{ gridTemplateColumns: "repeat(30, 1fr)", gap: "2px" }}>
            {Array.from({ length: 30 }).map((_, col) => (
              <div key={`bot-strip-${col}`} className="bg-[#FDFBF7] border border-[#E8E0D0] rounded-sm p-0.5 flex flex-col justify-between">
                {Array.from({ length: 5 }).map((_, row) => {
                  const holeId = `B-${col}-${row}`;
                  const { coordinate, description } = describeHole(holeId);
                  return (
                    <div
                      key={holeId}
                      className="relative w-full h-[5px] bg-[#1F2937] rounded-full border border-black/10 hover:bg-[#0E9A8B] cursor-crosshair transition-transform duration-100 hover:scale-[1.8] hover:z-20"
                      data-terminal-id={`${comp.id}-${holeId}`}
                      aria-label={`${holeId}, ${coordinate}, ${description}`}
                      title={`${holeId} · ${coordinate} · ${description}`}
                      onMouseEnter={(event) => focusHole(event, holeId)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom power rails */}
        <div className="absolute bottom-[20px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
              key={`bot-plus-${i}`}
              className="relative w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full transition-transform duration-100 hover:scale-[1.8] hover:z-20"
              data-terminal-id={`${comp.id}-R_BOT+_${i}`}
              aria-label={`Lower positive rail, position ${i + 1}`}
              onMouseEnter={(event) => focusHole(event, `R_BOT+_${i}`)}
            />
            ))}
          </div>
        </div>
        <div className="absolute bottom-[6px] left-[14px] right-[14px] h-[14px] bg-white rounded border border-[#D6CFC0] flex">
          <div className="flex-1 flex items-center justify-around">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
              key={`bot-minus-${i}`}
              className="relative w-[6px] h-[6px] bg-white border border-[#D6CFC0] rounded-full transition-transform duration-100 hover:scale-[1.8] hover:z-20"
              data-terminal-id={`${comp.id}-R_BOT-_${i}`}
              aria-label={`Lower negative rail, position ${i + 1}`}
              onMouseEnter={(event) => focusHole(event, `R_BOT-_${i}`)}
            />
            ))}
          </div>
        </div>
      </div>

      {focusedHole && (
        <div
          data-testid="active-hole-tooltip"
          className="absolute z-[60] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-teal-300 bg-slate-950 px-2 py-1 text-left shadow-lg pointer-events-none"
          style={{ left: focusedHole.x, top: focusedHole.y - 8 }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-300 ring-2 ring-teal-300/30" />
            <span className="font-mono text-[10px] font-extrabold text-white">{focusedHole.id}</span>
            <span className="rounded bg-teal-400/15 px-1 text-[10px] font-bold text-teal-200">{focusedHole.coordinate}</span>
          </div>
          <div className="mt-0.5 pl-4 text-[9px] text-slate-300">{focusedHole.description}</div>
        </div>
      )}

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
