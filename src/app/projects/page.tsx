"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Boxes,
  Cable,
  CircuitBoard,
  Filter,
  Grid3X3,
  Lightbulb,
  Radio,
  RotateCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { BEGINNER_PROJECTS } from "@/circuit-engine/models/beginnerProjectTemplates";
import { PROJECT_CONCEPTS, PROJECT_GALLERY_DETAILS, type ProjectConcept, type ProjectDifficulty } from "@/lib/projectGallery";

const conceptIcons: Record<ProjectConcept, typeof Boxes> = {
  "Getting started": Sparkles,
  Inputs: SlidersHorizontal,
  Sensors: Activity,
  Breadboards: Grid3X3,
  "Outputs & displays": Lightbulb,
  Actuators: RotateCw,
  "Sound & serial": AudioLines,
};

const conceptColors: Record<ProjectConcept, string> = {
  "Getting started": "bg-teal-50 text-teal-700 border-teal-100",
  Inputs: "bg-blue-50 text-blue-700 border-blue-100",
  Sensors: "bg-violet-50 text-violet-700 border-violet-100",
  Breadboards: "bg-amber-50 text-amber-800 border-amber-100",
  "Outputs & displays": "bg-rose-50 text-rose-700 border-rose-100",
  Actuators: "bg-cyan-50 text-cyan-800 border-cyan-100",
  "Sound & serial": "bg-indigo-50 text-indigo-700 border-indigo-100",
};

const difficultyColors: Record<ProjectDifficulty, string> = {
  Starter: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Builder: "bg-amber-50 text-amber-800 ring-amber-200",
  Challenge: "bg-rose-50 text-rose-700 ring-rose-200",
};

const learningPath: Array<{ level: ProjectDifficulty; title: string; body: string; icon: typeof Zap }> = [
  { level: "Starter", title: "Start with the essentials", body: "Practice outputs, simple inputs, serial messages, and your first breadboard circuit.", icon: Sparkles },
  { level: "Builder", title: "Add responsive behavior", body: "Explore sensor values, displays, and sound with clear cause-and-effect examples.", icon: Activity },
  { level: "Challenge", title: "Combine systems", body: "Bring multiple inputs together with PWM, servos, motor drivers, or relay logic.", icon: Zap },
];

const projects = BEGINNER_PROJECTS.map((project) => ({ ...project, ...PROJECT_GALLERY_DETAILS[project.id] }));

export default function ProjectGalleryPage() {
  const [concept, setConcept] = useState<ProjectConcept | "All concepts">("All concepts");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty | "All levels">("All levels");
  const [query, setQuery] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesConcept = concept === "All concepts" || project.concepts.includes(concept);
      const matchesDifficulty = difficulty === "All levels" || project.difficulty === difficulty;
      const searchable = `${project.name} ${project.description} ${project.takeaway} ${project.concepts.join(" ")}`.toLowerCase();
      return matchesConcept && matchesDifficulty && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [concept, difficulty, query]);

  const clearFilters = () => {
    setConcept("All concepts");
    setDifficulty("All levels");
    setQuery("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F6F8FB] text-[#102142]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Virtual Arduino Lab home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E9A8B] text-white"><CircuitBoard className="h-5 w-5" /></span>
            <span><span className="block text-[12px] font-black tracking-[.1em]">VIRTUAL ARDUINO LAB</span><span className="mt-0.5 block text-[10px] font-medium text-slate-500">Project gallery</span></span>
          </Link>
          <nav aria-label="Project navigation" className="hidden items-center gap-6 text-[12px] font-semibold text-slate-600 sm:flex">
            <a href="#learning-path" className="hover:text-teal-700">Learning path</a>
            <a href="#browse-projects" className="hover:text-teal-700">Browse all projects</a>
          </nav>
          <Link href="/lab" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#102142] px-3.5 text-[11px] font-bold text-white transition hover:bg-[#18345f]">Open the Lab <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-slate-200/80 bg-white">
        <div aria-hidden="true" className="absolute -right-32 -top-48 -z-10 h-[520px] w-[520px] rounded-full bg-teal-100/80 blur-3xl" />
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 md:grid-cols-[1fr_auto] md:items-end md:py-20 lg:px-8">
          <div className="max-w-[760px]">
            <Link href="/" className="mb-7 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-teal-700"><ArrowLeft className="h-3.5 w-3.5" /> Back to overview</Link>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold tracking-[.19em] text-teal-700"><BookOpen className="h-4 w-4" /> FIND YOUR NEXT BUILD</div>
            <h1 className="text-4xl font-black leading-[1.04] tracking-[-.055em] text-[#102142] sm:text-5xl lg:text-6xl">A project for every<br className="hidden sm:block" /> next step.</h1>
            <p className="mt-5 max-w-[630px] text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Browse the 23 guided circuits by concept and difficulty. Start with the basics, explore inputs and sensors, then combine modules in a bigger build.</p>
          </div>
          <div className="flex gap-3 md:pb-1">
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] px-5 py-4"><div className="text-2xl font-black tracking-tight">23</div><div className="mt-1 text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-500">ready-to-run</div></div>
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] px-5 py-4"><div className="text-2xl font-black tracking-tight">7</div><div className="mt-1 text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-500">concept paths</div></div>
          </div>
        </div>
      </section>

      <section id="learning-path" className="mx-auto max-w-[1240px] scroll-mt-24 px-5 py-12 lg:px-8">
        <div className="mb-5 flex items-center gap-2"><Target className="h-4 w-4 text-teal-700" /><h2 className="text-sm font-extrabold text-[#102142]">A suggested learning path</h2><span className="text-[10px] text-slate-400">Choose a level that feels right</span></div>
        <div className="grid gap-3 md:grid-cols-3">
          {learningPath.map(({ level, title, body, icon: Icon }, index) => (
            <button
              key={level}
              type="button"
              onClick={() => { setDifficulty(level); setConcept("All concepts"); document.getElementById("browse-projects")?.scrollIntoView({ behavior: "smooth" }); }}
              className="group relative flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${difficultyColors[level]}`}><Icon className="h-4.5 w-4.5" /></span>
              <span className="min-w-0"><span className="flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{String(index + 1).padStart(2, "0")} · {level}</span></span><span className="mt-1 block text-[12px] font-extrabold text-[#102142]">{title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{body}</span></span>
              <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />
            </button>
          ))}
        </div>
      </section>

      <section id="browse-projects" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 pb-20 lg:px-8">
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-teal-700" /><span className="text-[12px] font-extrabold">Find a project</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{filteredProjects.length} of {projects.length}</span></div>
            <label className="relative block w-full lg:max-w-[300px]">
              <span className="sr-only">Search projects</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects or concepts…" className="h-10 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-9 text-[11px] outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>}
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2"><span className="mr-1 w-[72px] text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">Concept</span>
              <button type="button" aria-pressed={concept === "All concepts"} onClick={() => setConcept("All concepts")} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${concept === "All concepts" ? "bg-[#102142] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>All concepts</button>
              {PROJECT_CONCEPTS.map((item) => <button key={item} type="button" aria-pressed={concept === item} onClick={() => setConcept(item)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition ${concept === item ? conceptColors[item] : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item}</button>)}
            </div>
            <div className="flex flex-wrap items-center gap-2"><span className="mr-1 w-[72px] text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">Difficulty</span>
              {(["All levels", "Starter", "Builder", "Challenge"] as const).map((item) => <button key={item} type="button" aria-pressed={difficulty === item} onClick={() => setDifficulty(item)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${difficulty === item ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item}</button>)}
              {(query || concept !== "All concepts" || difficulty !== "All levels") && <button type="button" onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800">Clear filters <X className="h-3 w-3" /></button>}
            </div>
          </div>
        </div>

        {filteredProjects.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => {
              const projectTitle = project.name.split(" · ").slice(1).join(" · ") || project.name;
              const LeadIcon = conceptIcons[project.concepts[0]];
              return (
                <article key={project.id} className="group flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5">
                  <div className="relative flex h-[102px] items-center justify-between overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#F6FAFC] via-white to-teal-50/70 px-5">
                    <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(#93a5b8 .8px, transparent .8px)", backgroundSize: "15px 15px" }} />
                    <div className="relative flex items-center gap-3"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${conceptColors[project.concepts[0]]}`}><LeadIcon className="h-5 w-5" /></span><div><div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">PROJECT {project.name.split(" · ")[0]}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{project.concepts[0]}</div></div></div>
                    <div className="relative flex h-12 w-20 items-center justify-center rounded-xl border border-white bg-white/80 shadow-sm">
                      <span className="h-1 w-10 rounded-full bg-teal-500" /><span className="absolute left-4 top-3 h-2 w-2 rounded-full border-2 border-teal-500 bg-white" /><span className="absolute right-4 bottom-3 h-2 w-2 rounded-full border-2 border-slate-500 bg-white" />
                      <Cable className="absolute h-3 w-3 text-slate-400" />
                    </div>
                    <span className={`absolute right-4 top-3 rounded-full px-2.5 py-1 text-[8px] font-extrabold ring-1 ${difficultyColors[project.difficulty]}`}>{project.difficulty}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-[15px] font-extrabold leading-5 tracking-tight text-[#102142]">{projectTitle}</h3>
                    <p className="mt-2 min-h-[40px] text-[11px] leading-5 text-slate-600">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">{project.concepts.slice(0, 3).map((item) => <span key={item} className={`rounded-md border px-2 py-1 text-[8px] font-bold ${conceptColors[item]}`}>{item}</span>)}</div>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span className="text-[9px] leading-4 text-slate-500"><span className="font-extrabold text-slate-700">Learn:</span> {project.takeaway}</span>
                      <Link href={`/lab?project=${encodeURIComponent(project.id)}`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#102142] px-3 text-[9px] font-bold text-white transition hover:bg-teal-700">Open <ArrowRight className="h-3 w-3" /></Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Search className="mx-auto h-7 w-7 text-slate-300" />
            <h3 className="mt-3 text-sm font-extrabold text-slate-700">No projects match those filters</h3>
            <p className="mt-1 text-[11px] text-slate-500">Try another concept, difficulty, or search term.</p>
            <button type="button" onClick={clearFilters} className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-200">Clear filters</button>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-[#102142] py-12 text-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div><div className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.16em] text-teal-300"><Radio className="h-4 w-4" /> PICK A PROJECT, THEN MAKE IT YOURS</div><h2 className="mt-2 text-xl font-black tracking-tight">Ready to test an idea?</h2><p className="mt-1 text-[11px] text-slate-300">Each project opens as a complete circuit and sketch you can inspect and edit.</p></div>
          <Link href="/lab" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-[11px] font-extrabold text-white transition hover:bg-teal-400">Open a blank workspace <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="mx-auto mt-8 max-w-[1240px] border-t border-white/10 px-5 pt-4 text-[9px] leading-5 text-slate-400 lg:px-8">The simulator uses a documented, bounded subset of Arduino-style code. It does not run arbitrary C++ or replace physical hardware safety checks.</div>
      </section>
    </main>
  );
}
