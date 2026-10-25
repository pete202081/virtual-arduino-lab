"use client";

import { Thermometer } from "lucide-react";
import type { ComponentInstance } from "@/types/circuit";

interface Props {
  comp: ComponentInstance;
  isSelected: boolean;
  onSelect: () => void;
  onTemperatureChange: (temperature: number) => void;
}

export function Tmp36Sensor({ comp, isSelected, onSelect, onTemperatureChange }: Props) {
  const rawTemperature = Number(comp.properties.temperatureC ?? 25);
  const temperatureC = Math.max(-40, Math.min(125, Math.round(Number.isFinite(rawTemperature) ? rawTemperature : 25)));
  const outputMillivolts = Math.max(0, Math.round(500 + temperatureC * 10));
  const adc = Math.round((outputMillivolts / 5000) * 1023);
  const warm = temperatureC >= 30;
  return (
    <div
      onClick={onSelect}
      className={`absolute select-none cursor-move ${isSelected ? "z-10" : ""}`}
      style={{ left: comp.x, top: comp.y, width: comp.width, height: comp.height }}
      title={`TMP36 temperature ${temperatureC} degrees Celsius, output ${outputMillivolts} millivolts, ADC ${adc}`}
    >
      <div className={`absolute left-1/2 top-0 h-[66px] w-[84px] -translate-x-1/2 rounded-xl border-2 shadow-md flex flex-col items-center justify-center ${warm ? "border-orange-300 bg-orange-50" : "border-sky-300 bg-sky-50"}`}>
        <Thermometer className={`h-7 w-7 ${warm ? "text-orange-600" : "text-sky-600"}`} />
        <span className="text-[8px] font-black tracking-wider text-slate-700">TMP36</span>
      </div>
      <div className="absolute top-[68px] left-0 right-0 text-center">
        <div className={`text-[9px] font-bold ${warm ? "text-orange-700" : "text-sky-700"}`}>{temperatureC} °C · {outputMillivolts} mV · ADC {adc}</div>
        <input
          type="range"
          min={-40}
          max={125}
          step={1}
          value={temperatureC}
          aria-label="Canvas simulated temperature"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onTemperatureChange(Number(event.target.value))}
          className="w-full h-3 accent-orange-600 cursor-ew-resize"
        />
      </div>
      {comp.terminals.map((terminal) => (
        <span
          key={terminal.id}
          data-terminal-id={terminal.id}
          title={`TMP36 terminal ${terminal.label}`}
          className={`absolute z-10 h-2.5 w-2.5 rounded-full border border-white shadow cursor-crosshair ${terminal.label === "VCC" ? "bg-rose-500" : terminal.label === "GND" ? "bg-slate-700" : "bg-orange-600"}`}
          style={{ left: terminal.dx - 5, top: terminal.dy - 5 }}
        />
      ))}
      <div className="absolute top-[92px] left-0 right-0 flex justify-around pointer-events-none">
        {comp.terminals.map((terminal) => <span key={terminal.id} className="w-[26px] text-center text-[7px] font-bold text-slate-600">{terminal.label}</span>)}
      </div>
      {isSelected && <span className="absolute inset-0 rounded-lg ring-2 ring-[#0E9A8B] ring-offset-2 pointer-events-none" />}
    </div>
  );
}
