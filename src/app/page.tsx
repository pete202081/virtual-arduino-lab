import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Boxes,
  Cable,
  Check,
  CircuitBoard,
  Code2,
  Cpu,
  Gauge,
  GitBranch,
  Lightbulb,
  MoveRight,
  Play,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const featureCards = [
  {
    icon: Boxes,
    eyebrow: "DESIGN",
    title: "A complete visual workbench",
    text: "Place parts on a pan-and-zoom canvas, search and filter the component library, and use Quick Add for common parts.",
    accent: "teal",
  },
  {
    icon: Cable,
    eyebrow: "CONNECT",
    title: "Wiring that teaches",
    text: "Connect terminals or breadboard holes. Automatic routes avoid component footprints; select a wire to drag its bend, then undo or reset it.",
    accent: "blue",
  },
  {
    icon: Code2,
    eyebrow: "PROGRAM",
    title: "A friendly Arduino sketch editor",
    text: "Edit a sketch with helpful validation and a clearly documented, safe subset of Arduino-style instructions—no arbitrary code execution.",
    accent: "violet",
  },
  {
    icon: Play,
    eyebrow: "SIMULATE",
    title: "See cause and effect",
    text: "Run, stop, and reset supported sketches. Watch LEDs, displays, motors, servos, buzzers, relays, and sensors respond to circuit inputs.",
    accent: "amber",
  },
  {
    icon: BookOpen,
    eyebrow: "LEARN",
    title: "18 guided starter projects",
    text: "Browse by concept and difficulty, then open a ready-wired example—from Blink and breadboard basics to sensors, joystick control, and actuators.",
    accent: "rose",
  },
  {
    icon: Save,
    eyebrow: "KEEP BUILDING",
    title: "Projects stay yours",
    text: "Save locally, reopen, duplicate, or export/import project JSON. Undo and redo circuit edits, including wire bends, up to 100 steps.",
    accent: "cyan",
  },
];

const components = [
  "Arduino Uno R3", "830-point breadboard", "LED + RGB LED", "Single-digit 7-segment", "220 Ω resistor",
  "Pushbutton", "Slide switch", "Potentiometer", "LDR", "Joystick", "Servo", "DC motor + H-bridge",
  "5V relay", "PIR", "HC-SR04", "TMP36", "Buzzer", "Jumper wires",
];

const steps = [
  { number: "01", icon: Boxes, title: "Build the circuit", text: "Add parts from the searchable library or Quick Add. Place them on the canvas and connect the terminals." },
  { number: "02", icon: Code2, title: "Write a sketch", text: "Use the editor to shape a supported Arduino-style sketch. Validation points out common code and wiring problems." },
  { number: "03", icon: Play, title: "Run and explore", text: "Start the simulation, change the modeled inputs, and observe what your circuit does. Save or export your project when ready." },
];

const codeFeatures = [
  "Digital pin setup and HIGH/LOW output",
  "Bounded digital and analog input checks",
  "Visual PWM brightness on Uno PWM pins",
  "Serial print, delays, tone() and noTone()",
  "Restricted Servo attach()/write() behavior",
  "Bounded HC-SR04 pulse-duration thresholds",
];

const accentClasses: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
};

export default function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-x-hidden bg-[#F6F8FB] text-[#102142]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="Virtual Arduino Lab home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E9A8B] text-white shadow-lg shadow-teal-900/15 transition group-hover:-rotate-3">
              <CircuitBoard className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[13px] font-black tracking-[0.11em]">VIRTUAL ARDUINO LAB</span>
              <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Learn by building</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[13px] font-semibold text-slate-600 md:flex">
            <a className="transition hover:text-[#0E9A8B]" href="#features">Features</a>
            <Link className="transition hover:text-[#0E9A8B]" href="/projects">Project gallery</Link>
            <a className="transition hover:text-[#0E9A8B]" href="#how-it-works">How it works</a>
            <a className="transition hover:text-[#0E9A8B]" href="#components">Components</a>
            <a className="transition hover:text-[#0E9A8B]" href="#simulation">Simulation scope</a>
          </nav>
          <Link href="/lab" className="group inline-flex h-10 items-center gap-2 rounded-xl bg-[#102142] px-4 text-[13px] font-bold text-white shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#18345f]">
            Open the Lab <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-40 -z-10 h-[580px] w-[580px] rounded-full bg-teal-200/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-64 -z-10 h-[480px] w-[480px] rounded-full bg-blue-200/25 blur-3xl" />
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-20 pt-16 md:grid-cols-[1.04fr_.96fr] md:gap-10 md:pb-24 md:pt-24 lg:px-8 lg:pt-28">
          <div className="max-w-[630px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 px-3.5 py-2 text-[11px] font-bold tracking-wide text-teal-800 shadow-sm">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" /></span>
              A browser-based circuit learning studio
            </div>
            <h1 className="text-[clamp(2.8rem,6vw,5.4rem)] font-black leading-[.99] tracking-[-.065em] text-[#102142]">
              Build circuits.
              <span className="mt-1 block bg-gradient-to-r from-[#0E9A8B] via-teal-600 to-blue-600 bg-clip-text text-transparent">See ideas light up.</span>
            </h1>
            <p className="mt-7 max-w-[570px] text-[16px] leading-7 text-slate-600 md:text-[18px] md:leading-8">
              Create Arduino-style circuits, write a sketch, and learn from the result—all in one visual lab. Start with a guided project or make something of your own.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/lab" className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0E9A8B] px-6 text-sm font-extrabold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-[#0b887c]">
                <Zap className="h-4 w-4 fill-current" /> Start building <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a href="#how-it-works" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                See how it works <ArrowDownRight className="h-4 w-4" />
              </a>
            </div>
            <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-teal-800 transition hover:text-teal-950">Browse the project gallery <ArrowRight className="h-3.5 w-3.5" /></Link>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-700" /> Safe, bounded sketch interpreter</span>
              <span className="inline-flex items-center gap-1.5"><Save className="h-3.5 w-3.5 text-teal-700" /> Local project saves</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-teal-700" /> No hardware required to explore</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px]">
            <div aria-hidden="true" className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-teal-300/30 via-blue-200/20 to-indigo-200/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_28px_90px_-30px_rgba(16,33,66,.28)] ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102142] text-teal-300"><Cpu className="h-4 w-4" /></span>
                  <div><div className="text-[12px] font-extrabold text-[#102142]">Circuit workspace</div><div className="text-[10px] text-slate-400">Blink LED · Pin 8</div></div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready to run</span>
              </div>
              <div className="relative h-[330px] overflow-hidden bg-[#F7F9FC] p-5 sm:h-[370px]">
                <div aria-hidden="true" className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#aab8c9 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
                <div className="absolute left-8 top-16 z-10 w-[132px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/5 sm:left-10 sm:w-[148px]">
                  <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#102142] text-[9px] font-black text-white">UNO</span><span className="text-[10px] font-extrabold text-slate-800">Arduino Uno</span></div>
                  <div className="mt-3 grid grid-cols-4 gap-1">{Array.from({ length: 12 }, (_, index) => <span key={index} className={`h-1.5 rounded-full ${index === 7 ? "bg-teal-500" : "bg-slate-200"}`} />)}</div>
                  <div className="mt-2 text-[8px] font-mono text-slate-400">D8 · GND · 5V</div>
                </div>
                <div className="absolute right-7 top-12 z-10 w-[174px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/5 sm:right-9 sm:w-[205px]">
                  <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-extrabold text-slate-700">Breadboard</span><span className="text-[8px] font-mono text-slate-400">A–J · 1–30</span></div>
                  <div className="rounded-lg border border-slate-100 bg-[#FBFCFD] p-2">
                    <div className="mb-2 flex gap-1">{Array.from({ length: 10 }, (_, index) => <span key={`n${index}`} className="flex-1 text-center text-[6px] text-slate-400">{index * 3 + 1}</span>)}</div>
                    <div className="grid grid-cols-10 gap-x-1.5 gap-y-1">{Array.from({ length: 50 }, (_, index) => <span key={index} className={`mx-auto h-1.5 w-1.5 rounded-full ${index === 21 || index === 31 ? "bg-teal-500 ring-2 ring-teal-100" : "bg-slate-300"}`} />)}</div>
                    <div className="my-2 h-1 border-y border-dashed border-slate-200" />
                    <div className="grid grid-cols-10 gap-x-1.5 gap-y-1">{Array.from({ length: 50 }, (_, index) => <span key={`b${index}`} className="mx-auto h-1.5 w-1.5 rounded-full bg-slate-300" />)}</div>
                  </div>
                  <div className="mt-2 flex justify-between text-[7px] font-semibold text-slate-400"><span className="text-red-400">+ POWER</span><span className="text-blue-400">− GROUND</span></div>
                </div>
                <svg className="absolute inset-0 z-20 h-full w-full" viewBox="0 0 570 370" fill="none" aria-hidden="true">
                  <path d="M184 118 H247 V123 H365" stroke="#0E9A8B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M365 123 H418 V148" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M445 148 V229 H260 V213" stroke="#25334a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M260 213 V255 H171 V220" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 6" />
                  <circle cx="247" cy="123" r="5" fill="white" stroke="#0E9A8B" strokeWidth="3" />
                  <circle cx="418" cy="148" r="5" fill="white" stroke="#EF4444" strokeWidth="3" />
                  <circle cx="260" cy="213" r="5" fill="white" stroke="#25334a" strokeWidth="3" />
                </svg>
                <div className="absolute bottom-7 left-8 z-30 flex items-center gap-2 rounded-lg border border-teal-100 bg-white/95 px-3 py-2 shadow-md sm:left-10">
                  <span className="relative flex h-7 w-7 items-center justify-center"><span className="absolute h-7 w-7 animate-pulse rounded-full bg-red-300/40" /><Lightbulb className="relative h-5 w-5 fill-amber-300 text-amber-500" /></span>
                  <div><div className="text-[9px] font-extrabold text-slate-800">LED · ON</div><div className="text-[8px] text-slate-400">D8 → resistor → GND</div></div>
                </div>
                <div className="absolute bottom-6 right-7 z-30 flex items-center gap-1 rounded-lg bg-[#102142] px-3 py-2 text-[9px] font-bold text-white shadow-md sm:right-9"><GitBranch className="h-3.5 w-3.5 text-teal-300" /> 3 connected nets</div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Circuit graph validated</span>
                <span className="font-mono">4 parts · 3 wires</span>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-4 hidden items-center gap-2 rounded-xl border border-white bg-white px-3.5 py-2.5 text-[10px] font-bold text-slate-700 shadow-xl shadow-slate-900/10 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Zap className="h-4 w-4" /></span> Visual PWM + sensor inputs
            </div>
            <div className="absolute -right-4 -top-5 hidden items-center gap-2 rounded-xl border border-white bg-white px-3.5 py-2.5 text-[10px] font-bold text-slate-700 shadow-xl shadow-slate-900/10 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><RotateCcw className="h-4 w-4" /></span> Undo · redo · keep exploring
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/80">
        <div className="mx-auto grid max-w-[1080px] grid-cols-2 gap-y-6 px-5 py-7 text-center sm:grid-cols-4 lg:px-8">
          <div><div className="text-2xl font-black tracking-tight text-[#102142]">18</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">guided projects</div></div>
          <div><div className="text-2xl font-black tracking-tight text-[#102142]">20</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">parts & tools</div></div>
          <div><div className="text-2xl font-black tracking-tight text-[#102142]">100</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">undo history steps</div></div>
          <div><div className="text-2xl font-black tracking-tight text-[#102142]">Local</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">project storage</div></div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1240px] scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto mb-12 max-w-[660px] text-center">
          <span className="text-[11px] font-extrabold tracking-[.2em] text-teal-700">YOUR WHOLE WORKFLOW, IN ONE PLACE</span>
          <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#102142] sm:text-4xl">From first wire to working idea</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">A focused place to assemble a circuit, experiment with a sketch, and understand the connection between code and components.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map(({ icon: Icon, eyebrow, title, text, accent }) => (
            <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${accentClasses[accent]}`}><Icon className="h-5 w-5" /></span>
              <div className="mt-5 text-[9px] font-black tracking-[.18em] text-slate-400">{eyebrow}</div>
              <h3 className="mt-1.5 text-[17px] font-extrabold tracking-tight text-[#102142]">{title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-slate-200/80 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><span className="text-[11px] font-extrabold tracking-[.2em] text-teal-700">THREE SIMPLE STEPS</span><h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#102142] sm:text-4xl">How the lab works</h2></div>
            <p className="max-w-[430px] text-sm leading-6 text-slate-600">You don’t need a physical board to get started. Build virtually, inspect the logic, then take what you learn to your next experiment.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, text }, index) => (
              <article key={number} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-7">
                <div className="flex items-center justify-between"><span className="font-mono text-[12px] font-bold text-teal-700">STEP {number}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0E9A8B] shadow-sm"><Icon className="h-5 w-5" /></span></div>
                <h3 className="mt-7 text-lg font-extrabold text-[#102142]">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">{text}</p>
                {index < steps.length - 1 && <MoveRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 rounded-full bg-white p-1 text-teal-700 shadow md:block" />}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="components" className="scroll-mt-24 mx-auto grid max-w-[1240px] gap-12 px-5 py-20 md:grid-cols-[.9fr_1.1fr] md:items-center lg:px-8 lg:py-24">
        <div>
          <span className="text-[11px] font-extrabold tracking-[.2em] text-teal-700">A PALETTE BUILT FOR EXPERIMENTS</span>
          <h2 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#102142] sm:text-4xl">A lot to explore.<br />One searchable library.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">Browse by category or search the full list. Drag parts into the workspace, click to add, then inspect terminals and properties as you build.</p>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 p-4">
            <Search className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <p className="text-[12px] leading-5 text-teal-950"><strong>Learn breadboard connectivity:</strong> numbered columns, A–J rows, hole targeting, rail polarity, five-hole strip connectivity, and connected-net highlighting help make each connection easier to inspect.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex items-center justify-between"><div><div className="text-[13px] font-extrabold text-[#102142]">Parts & interactive modules</div><div className="mt-1 text-[10px] text-slate-500">Select a family to get started</div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">20 ITEMS</span></div>
          <div className="flex flex-wrap gap-2">
            {components.map((item, index) => <span key={item} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold ${index % 5 === 0 ? "border-teal-100 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{item}</span>)}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 text-[10px] leading-5 text-slate-500">Also includes visual terminal interaction, a jumper-wire tool, properties panels, project-specific focus, and Quick Add shortcuts.</div>
        </div>
      </section>

      <section id="simulation" className="scroll-mt-24 bg-[#102142] py-20 text-white lg:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 md:grid-cols-[.88fr_1.12fr] md:items-center lg:px-8">
          <div>
            <span className="text-[11px] font-extrabold tracking-[.2em] text-teal-300">CLEAR, HONEST SIMULATION</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Understand the model.<br />Learn with confidence.</h2>
            <p className="mt-4 max-w-[480px] text-sm leading-6 text-slate-300">This lab interprets a deliberately limited, documented subset of Arduino-style code. It never executes arbitrary user code and it is not a replacement for an Arduino IDE, electronics bench, or physical safety checks.</p>
            <div className="mt-6 space-y-2.5">
              {codeFeatures.map((feature) => <div key={feature} className="flex items-center gap-2.5 text-[12px] text-slate-200"><Check className="h-4 w-4 shrink-0 text-teal-300" />{feature}</div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5 sm:p-7">
            <div className="flex items-center gap-2 text-[12px] font-bold text-white"><Gauge className="h-4 w-4 text-teal-300" /> What responds in the virtual lab</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4"><Lightbulb className="h-4 w-4 text-amber-300" /><div className="mt-3 text-[12px] font-bold">Lights & displays</div><p className="mt-1 text-[10px] leading-5 text-slate-400">LED, independent RGB channels with visual PWM brightness, and a single common-cathode 7-segment digit with independent A–G/DP outputs (no decoder or multiplexing).</p></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4"><AudioLines className="h-4 w-4 text-violet-300" /><div className="mt-3 text-[12px] font-bold">Sound & motion</div><p className="mt-1 text-[10px] leading-5 text-slate-400">Active/passive buzzer patterns, restricted Servo position commands, and H-bridge-driven motor direction/speed visuals.</p></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4"><Gauge className="h-4 w-4 text-blue-300" /><div className="mt-3 text-[12px] font-bold">Sensor inputs</div><p className="mt-1 text-[10px] leading-5 text-slate-400">Potentiometer, LDR, joystick axes/buttons, PIR motion, HC-SR04 distance, and TMP36 temperature controls.</p></div>
              <div className="rounded-xl border border-white/10 bg-slate-950/20 p-4"><CircuitBoard className="h-4 w-4 text-rose-300" /><div className="mt-3 text-[12px] font-bold">Switching & feedback</div><p className="mt-1 text-[10px] leading-5 text-slate-400">Pushbuttons, latched switches, modeled relay contacts, graph-based validation, logs, and serial output.</p></div>
            </div>
            <p className="mt-4 rounded-lg bg-amber-300/10 px-3 py-2.5 text-[10px] leading-5 text-amber-100"><strong>Limits matter:</strong> no arbitrary C++, AVR binary, SPICE/current analysis, real PWM waveforms, or physical sensor/electromechanical physics. Relay behavior is low-voltage logic only—never use it to design mains circuits.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-20 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-teal-700 via-[#0E9A8B] to-[#126f82] px-7 py-10 text-white shadow-xl shadow-teal-900/15 sm:px-12 sm:py-14">
          <div aria-hidden="true" className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[44px] border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-28 right-1/4 h-64 w-64 rounded-full border-[32px] border-white/[.07]" />
          <div className="relative z-10 max-w-[680px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold"><Sparkles className="h-3.5 w-3.5" /> YOUR NEXT IDEA STARTS HERE</span>
            <h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-4xl">Ready to make something blink?</h2>
            <p className="mt-3 max-w-[560px] text-sm leading-6 text-teal-50">Open a guided project, wire a fresh circuit, and learn by seeing your sketch respond.</p>
            <Link href="/lab" className="group mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-teal-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-50">Enter the Virtual Lab <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-bold text-slate-700"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0E9A8B] text-white"><CircuitBoard className="h-3.5 w-3.5" /></span> Virtual Arduino Lab</div>
          <p>Built for learning. Simulated behavior is intentionally limited; verify real circuits and component datasheets before hardware use.</p>
          <Link href="/lab" className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900">Open the Lab <MoveRight className="h-3.5 w-3.5" /></Link>
        </div>
      </footer>
    </main>
  );
}
