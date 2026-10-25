"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Code2, RotateCcw, Check, AlertCircle, Copy, Maximize2, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { OnMount } from "@monaco-editor/react";
import { validateSketch, CompileResult } from "@/simulation/interfaces/compileAdapter";

// Monaco is client-only — dynamic import to avoid SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), { ssr: false });

interface Props {
  code: string;
  onChange: (code: string) => void;
  onReset: () => void;
  compileResult?: CompileResult;
}

export function CodeEditor({ code, onChange, onReset, compileResult }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localErrors, setLocalErrors] = useState<CompileResult | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const result = compileResult || localErrors;

  // Live validation (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const res = validateSketch(code);
      setLocalErrors(res);
    }, 500);
    return () => clearTimeout(t);
  }, [code]);

  const lineCount = code.split("\n").length;
  const hasErrors = result ? result.errors.length > 0 : false;
  const hasWarnings = result ? result.warnings.length > 0 : false;

  // Add live validation markers directly to the editor gutter.
  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !result) return;
    const markers = [...result.errors, ...result.warnings].map((item) => ({
      startLineNumber: Math.max(1, item.line),
      endLineNumber: Math.max(1, item.line),
      startColumn: Math.max(1, item.column + 1),
      endColumn: Math.max(2, item.column + 2),
      message: item.message,
      severity: item.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      source: "Arduino Lab",
    }));
    monaco.editor.setModelMarkers(editor.getModel(), "arduino-lab", markers);
  }, [result]);

  return (
    <aside
      aria-label="Arduino Sketch editor"
      className={`bg-[#1E1E2E] flex flex-col border-l border-slate-800 shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out ${isCollapsed ? "w-11" : isExpanded ? "w-[640px]" : "w-[460px]"}`}
    >
      {isCollapsed ? (
        <div className="flex h-full flex-col items-center gap-4 py-3">
          <button
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand code editor"
            aria-expanded={false}
            title="Expand code editor"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0E9A8B]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-extrabold tracking-[0.16em] text-slate-400" style={{ writingMode: "vertical-rl" }}>ARDUINO SKETCH</span>
        </div>
      ) : (
      <>
      {/* Header */}
      <div className="h-8 bg-[#0F2142] flex items-center px-2 gap-1.5 border-b border-slate-700 shrink-0">
        <Code2 className="w-3.5 h-3.5 text-[#7de3d8]" />
        <span className="text-xs font-bold text-white">Arduino Sketch</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/70 rounded">C++ • .ino</span>
        {hasErrors ? (
          <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
            <XCircle className="w-3 h-3" /> {result!.errors.length} error(s)
          </span>
        ) : hasWarnings ? (
          <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {result!.warnings.length} warn
          </span>
        ) : (
          <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
            <Check className="w-3 h-3" /> Ready
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="w-6 h-6 bg-white/10 hover:bg-white/15 rounded flex items-center justify-center border border-white/10"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white" />}
          </button>
          <button onClick={onReset} className="h-6 px-2 bg-white/10 hover:bg-white/15 rounded flex items-center gap-1 text-[11px] font-bold text-white border border-white/10">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button onClick={() => setIsExpanded((v) => !v)} className="w-6 h-6 bg-white/10 hover:bg-white/15 rounded flex items-center justify-center border border-white/10" title={isExpanded ? "Narrow code editor" : "Widen code editor"} aria-label={isExpanded ? "Narrow code editor" : "Widen code editor"}>
            <Maximize2 className="w-3 h-3 text-white" />
          </button>
          <button onClick={() => setIsCollapsed(true)} className="w-6 h-6 bg-white/10 hover:bg-white/15 rounded flex items-center justify-center border border-white/10" title="Collapse code editor" aria-label="Collapse code editor" aria-expanded={true}>
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Subheader */}
      <div className="h-6 bg-[#2A2A3C] flex items-center px-2 gap-2 text-[11px] shrink-0 border-b border-slate-700">
        <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold">Blink LED — Pin 8</span>
        <span className="text-slate-400">Uses: {result?.usedApis.join(", ") || "pinMode, digitalWrite, delay"}</span>
        <span className="ml-auto text-slate-500">{lineCount} lines</span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 relative">
        <MonacoEditor
          height="100%"
          language="cpp"
          theme="vs-dark"
          value={code}
          onChange={(val) => onChange(val || "")}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            fontFamily: "JetBrains Mono, Consolas, monospace",
            glyphMargin: true,
            lineNumbersMinChars: 3,
            folding: true,
            quickSuggestions: false,
          }}
          loading={<div className="p-4 text-xs text-slate-400">Loading Monaco Editor…</div>}
        />

        {/* Error overlay gutter (fallback if Monaco markers not set) */}
        {(hasErrors || hasWarnings) && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#1E1E2E] border-t border-slate-700 max-h-24 overflow-auto p-1.5 space-y-1">
            {result!.errors.map((e, i) => (
              <div key={`e-${i}`} className="flex gap-1.5 text-[11px] bg-red-950/50 border border-red-800 rounded px-1.5 py-0.5">
                <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <span className="text-red-300">
                  Line {e.line}: {e.message}
                </span>
              </div>
            ))}
            {result!.warnings.map((w, i) => (
              <div key={`w-${i}`} className="flex gap-1.5 text-[11px] bg-amber-950/30 border border-amber-800 rounded px-1.5 py-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300">Line {w.line}: {w.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-6 bg-[#181825] border-t border-slate-700 flex items-center px-2 gap-2 text-[11px] shrink-0">
        {hasErrors ? (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3 h-3" /> {result!.errors.length} error(s) — fix before run
          </span>
        ) : hasWarnings ? (
          <span className="flex items-center gap-1 text-amber-400">
            <AlertTriangle className="w-3 h-3" /> {result!.warnings.length} warning(s)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3 h-3" /> No errors — supported: {SUPPORTED_HINT}
          </span>
        )}
        <span className="ml-auto text-slate-500">UTF-8 • LF • C++</span>
      </div>

      {/* Help */}
      <div className="p-2 bg-[#0F2142]/50 border-t border-slate-700">
        <div className="text-[11px] font-bold text-white flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-400" /> M3 Supported APIs
        </div>
        <div className="text-[11px] text-slate-300 mt-1 leading-tight">
          <code className="bg-black/30 px-1 rounded">pinMode</code> <code className="bg-black/30 px-1 rounded">digitalWrite</code> <code className="bg-black/30 px-1 rounded">digitalRead</code> <code className="bg-black/30 px-1 rounded">delay</code> <code className="bg-black/30 px-1 rounded">Serial.begin/println</code> — others show line error.
        </div>
        <pre className="mt-1 bg-black/30 rounded p-1.5 text-[10px] font-mono text-slate-300 overflow-auto">{`D8 ──▶ 220Ω ──▶ LED Anode ──▶ LED Cathode ──▶ GND`}</pre>
      </div>
      </>
      )}
    </aside>
  );
}

const SUPPORTED_HINT = "pinMode, digitalWrite, delay, Serial";
