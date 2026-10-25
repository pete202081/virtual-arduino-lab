"use client";
import { Terminal, FileText, CheckCircle, Activity, Trash2, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConsoleTab, SimulationEvent } from "@/types/circuit";
import { ValidationMessage } from "@/circuit-engine/validation/validator";

interface Props {
  activeTab: ConsoleTab;
  onChangeTab: (t: ConsoleTab) => void;
  logs: SimulationEvent[];
  onClear: () => void;
  validationMessages: ValidationMessage[];
  serialBaud: number;
}

export function Console({ activeTab, onChangeTab, logs, onClear, validationMessages, serialBaud }: Props) {
  const tabs: { id: ConsoleTab; label: string; icon: LucideIcon; count?: number }[] = [
    { id: "serial", label: "Serial Monitor", icon: Terminal },
    { id: "logs", label: "Simulation Logs", icon: FileText, count: logs.length },
    { id: "validation", label: "Circuit Validation", icon: CheckCircle, count: validationMessages.length },
    { id: "events", label: "Simulation Events", icon: Activity, count: logs.filter((l) => l.type === "pin-change").length },
  ];

  return (
    <div className="h-[220px] shrink-0 bg-[#0F172A] text-white flex flex-col border-t border-slate-800">
      <div className="h-8 bg-[#1E293B] flex items-center px-2 gap-1 border-b border-slate-700 shrink-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChangeTab(t.id)}
              className={`h-6 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-bold border ${active ? "bg-white text-[#0F2142] border-white" : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"}`}
            >
              <Icon className="w-3 h-3" /> {t.label} {t.count !== undefined && t.count > 0 && <span className={`px-1 py-0.5 rounded text-[10px] ${active ? "bg-[#0F2142] text-white" : "bg-slate-900 text-white"}`}>{t.count}</span>}
            </button>
          );
        })}
        <button onClick={onClear} className="ml-auto h-6 px-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md flex items-center gap-1 text-[11px] font-bold">
          <Trash2 className="w-3 h-3" /> Clear
        </button>
        <span className="text-[10px] text-slate-400 ml-2">Baud: {serialBaud} • M4 simulation</span>
      </div>

      <div className="flex-1 overflow-auto p-2 font-mono text-[11px] leading-relaxed">
        {activeTab === "serial" && (
          <div className="space-y-1">
            {logs.filter((log) => log.type === "serial").length === 0 ? (
              <div className="text-slate-400">Serial output from supported Serial.print/println calls will appear here when the sketch runs.</div>
            ) : logs.filter((log) => log.type === "serial").map((log) => (
              <div key={log.id} className="text-emerald-300 whitespace-pre-wrap"><span className="text-slate-500">[{log.timestamp}]</span> {log.message}</div>
            ))}
          </div>
        )}
        {activeTab === "logs" && (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <div className="text-slate-400">No logs yet. Run validation or simulation to see messages. Timestamps included.</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className={`${l.type === "error" ? "text-red-400" : l.type === "warning" ? "text-amber-400" : l.type === "pin-change" ? "text-emerald-400" : "text-slate-300"}`}>
                  <span className="text-slate-500">[{l.timestamp}]</span> [{l.type}] {l.message}
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === "validation" && (
          <div className="space-y-1.5">
            {validationMessages.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> No issues — add components to validate.
              </div>
            ) : (
              validationMessages.map((m, i) => (
                <div key={i} className={`flex gap-2 p-1.5 rounded border ${m.severity === "error" ? "bg-red-950/40 border-red-800 text-red-300" : m.severity === "warning" ? "bg-amber-950/30 border-amber-800 text-amber-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">[{m.code}]</span> {m.message}
                    {m.help && <div className="text-[10px] text-slate-400 mt-0.5">{m.help}</div>}
                  </div>
                </div>
              ))
            )}
            <div className="text-slate-500 mt-2 text-[11px]">M2 validation: checks Arduino present, wire endpoints, open/reversed/wrong-pin/short via net graph + breadboard strips + trench isolation.</div>
          </div>
        )}
        {activeTab === "events" && (
          <div className="space-y-1">
            <div className="text-slate-400">M4 interpreter lifecycle: VALIDATING → COMPILING → RUNNING → STOPPED. Pin changes, actual delays, serial output, and connected LED state appear here.</div>
            {logs
              .filter((l) => l.type === "pin-change" || l.type === "info")
              .map((l) => (
                <div key={l.id} className="text-cyan-300">
                  <span className="text-slate-500">[{l.timestamp}]</span> {l.message}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
