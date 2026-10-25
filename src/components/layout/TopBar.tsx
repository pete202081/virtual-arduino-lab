"use client";
import { useState } from "react";
import { Cpu, Play, Square, RotateCcw, Save, FolderOpen, FilePlus, Undo, Redo, Zap, AlertCircle, Circle, MoreHorizontal, Copy, Download, Upload, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SimulationState } from "@/types/circuit";
import { BEGINNER_PROJECTS } from "@/circuit-engine/models/beginnerProjectTemplates";
import type { BeginnerProjectId } from "@/circuit-engine/models/beginnerProjectTemplates";

interface TopBarProps {
  projectName: string;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onImport: () => void;
  onResetStarter: () => void;
  simulationState: SimulationState;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onRename: (name: string) => void;
  activeBeginnerProjectId: BeginnerProjectId | "";
  onLoadBeginnerProject: (id: BeginnerProjectId) => void;
}

export function TopBar({ projectName, onNew, onSave, onOpen, onDuplicate, onExport, onImport, onResetStarter, simulationState, onRun, onStop, onReset, onRename, activeBeginnerProjectId, onLoadBeginnerProject }: TopBarProps) {
  const [editing, setEditing] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [editName, setEditName] = useState(projectName);

  const statusConfig: Record<SimulationState, { label: string; color: string; icon: LucideIcon }> = {
    IDLE: { label: "Idle", color: "bg-slate-500", icon: Circle },
    VALIDATING: { label: "Validating...", color: "bg-amber-500", icon: AlertCircle },
    COMPILING: { label: "Compiling...", color: "bg-blue-500", icon: Zap },
    RUNNING: { label: "Running", color: "bg-emerald-500", icon: Play },
    STOPPED: { label: "Stopped", color: "bg-slate-600", icon: Square },
    ERROR: { label: "Error", color: "bg-red-500", icon: AlertCircle },
    RESET: { label: "Reset", color: "bg-slate-400", icon: RotateCcw },
  };
  const status = statusConfig[simulationState] || statusConfig.IDLE;
  const StatusIcon = status.icon;

  return (
    <header className="h-14 bg-[#0F2142] text-white flex items-center px-3 gap-2 shrink-0 border-b border-[#1a345f] select-none">
      {/* Logo */}
      <div className="flex items-center gap-2.5 pr-3 border-r border-white/10">
        <div className="w-8 h-8 bg-[#0E9A8B] rounded-lg flex items-center justify-center">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-extrabold text-[13px] leading-none tracking-tight">VIRTUAL ARDUINO LAB</div>
          <div className="text-[10px] text-white/60 leading-none">Interactive Circuit Simulator</div>
        </div>
      </div>

      {/* Project title - editable */}
      <div className="flex items-center gap-2 px-3 min-w-0">
        {editing ? (
          <input
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm font-semibold text-white outline-none focus:border-[#0E9A8B] w-56"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              if (editName.trim()) onRename(editName.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (editName.trim()) onRename(editName.trim());
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditName(projectName);
              setEditing(true);
            }}
            className="text-sm font-semibold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/10 truncate max-w-[220px] text-left"
            title="Click to rename"
          >
            {projectName}
          </button>
        )}
        <span className="text-[10px] text-white/40 hidden lg:inline">Click to rename</span>
      </div>

      {/* Ready-to-open project templates */}
      <div className="min-w-[145px] max-w-[190px]">
        <select
          aria-label="Choose a beginner project"
          title={BEGINNER_PROJECTS.find((project) => project.id === activeBeginnerProjectId)?.description ?? "Load a ready-to-run beginner project with its circuit and sketch"}
          value={activeBeginnerProjectId}
          onChange={(event) => {
            if (event.target.value) onLoadBeginnerProject(event.target.value as BeginnerProjectId);
          }}
          className="h-8 w-full rounded-md border border-white/15 bg-white/10 px-2 text-[11px] font-semibold text-white outline-none focus:border-[#0E9A8B]"
        >
          <option value="" className="text-slate-900">Beginner projects…</option>
          {BEGINNER_PROJECTS.map((project) => <option key={project.id} value={project.id} className="text-slate-900">{project.name}</option>)}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2">
        <button onClick={onNew} className="h-8 px-2.5 bg-white/10 hover:bg-white/15 rounded-md flex items-center gap-1.5 text-xs font-semibold border border-white/10 transition-colors">
          <FilePlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New</span>
        </button>
        <button onClick={onOpen} className="h-8 px-2.5 bg-white/10 hover:bg-white/15 rounded-md flex items-center gap-1.5 text-xs font-semibold border border-white/10">
          <FolderOpen className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Open</span>
        </button>
        <button onClick={onSave} className="h-8 px-2.5 bg-[#0E9A8B] hover:bg-[#0b8a7c] rounded-md flex items-center gap-1.5 text-xs font-bold">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <div className="relative">
          <button onClick={() => setProjectMenuOpen((open) => !open)} aria-expanded={projectMenuOpen} aria-label="Project actions" className="h-8 px-2 bg-white/10 hover:bg-white/15 rounded-md flex items-center gap-1 text-xs font-semibold border border-white/10">
            <MoreHorizontal className="w-4 h-4" /><span className="hidden md:inline">More</span>
          </button>
          {projectMenuOpen && (
            <div className="absolute left-0 top-10 z-50 w-52 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl">
              <button onClick={() => { onDuplicate(); setProjectMenuOpen(false); }} className="w-full rounded px-2.5 py-2 text-left text-xs hover:bg-slate-100 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Duplicate project</button>
              <button onClick={() => { onExport(); setProjectMenuOpen(false); }} className="w-full rounded px-2.5 py-2 text-left text-xs hover:bg-slate-100 flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Export JSON…</button>
              <button onClick={() => { onImport(); setProjectMenuOpen(false); }} className="w-full rounded px-2.5 py-2 text-left text-xs hover:bg-slate-100 flex items-center gap-2"><Upload className="w-3.5 h-3.5" /> Import JSON…</button>
              <div className="my-1 border-t border-slate-200" />
              <button onClick={() => { onResetStarter(); setProjectMenuOpen(false); }} className="w-full rounded px-2.5 py-2 text-left text-xs hover:bg-slate-100 flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Reset to Blink starter</button>
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button className="w-8 h-8 bg-white/10 hover:bg-white/15 rounded-md flex items-center justify-center border border-white/10 opacity-50 cursor-not-allowed" title="Undo (coming)">
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button className="w-8 h-8 bg-white/10 hover:bg-white/15 rounded-md flex items-center justify-center border border-white/10 opacity-50 cursor-not-allowed" title="Redo (coming)">
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Simulation controls - center */}
      <div className="flex items-center gap-1.5 mx-auto bg-black/20 rounded-full px-1.5 py-1 border border-white/10">
        <button
          onClick={onRun}
          disabled={simulationState === "RUNNING" || simulationState === "VALIDATING" || simulationState === "COMPILING"}
          className="h-7 px-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-white" /> Run
        </button>
        <button
          onClick={onStop}
          disabled={simulationState !== "RUNNING"}
          className="h-7 w-7 bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center border border-white/10"
          title="Stop"
        >
          <Square className="w-3 h-3 fill-white" />
        </button>
        <button
          onClick={onReset}
          className="h-7 w-7 bg-white/10 hover:bg-white/15 rounded-full flex items-center justify-center border border-white/10"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15 mx-1" />
        <div className="flex items-center gap-1.5 pr-2">
          <div className={`w-2 h-2 rounded-full ${status.color} ${simulationState === "RUNNING" ? "animate-pulse" : ""}`} />
          <span className="text-[11px] font-bold tracking-wide">{status.label.toUpperCase()}</span>
          <StatusIcon className="w-3 h-3 text-white/70" />
        </div>
      </div>

      {/* Right info */}
      <div className="hidden xl:flex items-center gap-2 text-[11px] text-white/60">
        <span className="px-2 py-1 bg-white/5 rounded border border-white/10">M5 • Project Persistence</span>
        <span className="px-2 py-1 bg-[#0E9A8B]/20 rounded border border-[#0E9A8B]/30 text-[#7de3d8]">Local save • JSON</span>
      </div>
    </header>
  );
}
