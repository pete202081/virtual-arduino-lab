"use client";
import { ComponentInstance, Wire } from "@/types/circuit";
import { Settings, Cpu, Lightbulb, Minus, Cable, Trash2, RotateCw, Circle, Volume2, SlidersHorizontal, Sun, Hash, ToggleRight, Gamepad2, Radio, Waves, Thermometer, Zap } from "lucide-react";

interface Props {
  selectedComponent: ComponentInstance | null;
  selectedWire: Wire | null;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onUpdateWire: (id: string, updates: Partial<Wire>) => void;
  onDelete: () => void;
  onRotate: (id: string) => void;
  onToggleSlideSwitch: (id: string) => void;
  pressedButtonIds: string[];
  onJoystickButtonPressStart: (id: string) => void;
  onJoystickButtonPressEnd: (id: string) => void;
  onJoystickAxisChange: (id: string, axis: "xValue" | "yValue", value: number) => void;
}

export function PropertiesPanel({ selectedComponent, selectedWire, onUpdateComponent, onUpdateWire, onDelete, onRotate, onToggleSlideSwitch, pressedButtonIds, onJoystickButtonPressStart, onJoystickButtonPressEnd, onJoystickAxisChange }: Props) {
  if (!selectedComponent && !selectedWire) {
    return (
      <div className="w-[300px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full">
        <div className="p-3 border-b border-slate-100">
          <div className="font-extrabold text-xs tracking-wide text-[#0F2142] flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> PROPERTIES
          </div>
          <div className="text-[11px] text-slate-500">Select a component or wire</div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Settings className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-700 mt-3">Nothing selected</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">Click a component on the canvas to view its terminals, pins, and properties. Wires show start/end.</p>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-left">
              <div className="text-[11px] font-bold text-amber-800">💡 Tip for beginners</div>
              <div className="text-[11px] text-amber-700 mt-1">LED has polarity: long leg (Anode) must go toward power, short leg (Cathode) toward GND.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedWire) {
    return (
      <div className="w-[300px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full">
        <div className="p-3 border-b border-slate-100 bg-blue-50/50">
          <div className="font-extrabold text-xs tracking-wide text-[#0F2142] flex items-center gap-1.5">
            <Cable className="w-3.5 h-3.5 text-blue-600" /> WIRE PROPERTIES
          </div>
          <div className="text-[11px] text-slate-500 font-mono">{selectedWire.id.slice(0, 14)}</div>
        </div>
        <div className="p-3 space-y-3 flex-1 overflow-auto">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-slate-700">Connection</div>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">From</span>
                <span className="font-mono font-bold text-slate-800">{selectedWire.startTerminalId}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">To</span>
                <span className="font-mono font-bold text-slate-800">{selectedWire.endTerminalId}</span>
              </div>
              <div className="h-px bg-slate-100 my-1" />
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Color</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ background: selectedWire.color }} />
                  <span className="font-bold">{selectedWire.color}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-slate-700">Wire Color</div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {["#EF4444", "#1F2937", "#2563EB", "#10B981", "#EAB308", "#F97316", "#8B5CF6"].map((col) => (
                <button
                  key={col}
                  onClick={() => onUpdateWire(selectedWire.id, { color: col })}
                  className={`w-7 h-7 rounded-full border-2 ${selectedWire.color === col ? "border-slate-900 scale-110" : "border-white shadow"}`}
                  style={{ background: col }}
                />
              ))}
            </div>
          </div>

          <button onClick={onDelete} className="w-full h-9 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold">
            <Trash2 className="w-3.5 h-3.5" /> Delete Wire
          </button>
          <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
            Wires connect electrical nets. In M2, the breadboard’s 5-hole strips will merge nets correctly.
          </div>
        </div>
      </div>
    );
  }

  // Component properties
  const comp = selectedComponent!;
  const isArduino = comp.type === "arduino-uno";
  const isBreadboard = comp.type === "breadboard";
  const isLED = comp.type === "led";
  const isRGBLED = comp.type === "rgb-led";
  const isSevenSegment = comp.type === "seven-segment";
  const isResistor = comp.type === "resistor";
  const isPushbutton = comp.type === "pushbutton";
  const isSlideSwitch = comp.type === "slide-switch";
  const isJoystick = comp.type === "joystick";
  const isServo = comp.type === "servo";
  const isDcMotor = comp.type === "dc-motor";
  const isHBridge = comp.type === "h-bridge";
  const isBuzzer = comp.type === "buzzer";
  const isPotentiometer = comp.type === "potentiometer";
  const isLdr = comp.type === "ldr";
  const isPir = comp.type === "pir";
  const isHcSr04 = comp.type === "hc-sr04";
  const isTmp36 = comp.type === "tmp36";
  const isRelay = comp.type === "relay";

  return (
    <div className="w-[300px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-slate-100">
        <div className="font-extrabold text-xs tracking-wide text-[#0F2142] flex items-center gap-1.5">
          {isArduino && <Cpu className="w-3.5 h-3.5" />}
          {(isLED || isRGBLED) && <Lightbulb className="w-3.5 h-3.5 text-amber-600" />}
          {isSevenSegment && <Hash className="w-3.5 h-3.5 text-red-700" />}
          {isResistor && <Minus className="w-3.5 h-3.5 text-amber-700" />}
          {isBreadboard && <Settings className="w-3.5 h-3.5" />}
          {isPushbutton && <Circle className="w-3.5 h-3.5 text-rose-600" />}
          {isSlideSwitch && <ToggleRight className="w-3.5 h-3.5 text-cyan-700" />}
          {isJoystick && <Gamepad2 className="w-3.5 h-3.5 text-blue-700" />}
          {isServo && <RotateCw className="w-3.5 h-3.5 text-cyan-700" />}
          {isDcMotor && <RotateCw className="w-3.5 h-3.5 text-slate-700" />}
          {isHBridge && <Cpu className="w-3.5 h-3.5 text-slate-700" />}
          {isBuzzer && <Volume2 className="w-3.5 h-3.5 text-amber-600" />}
          {isPotentiometer && <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />}
          {isLdr && <Sun className="w-3.5 h-3.5 text-amber-600" />}
          {isPir && <Radio className="w-3.5 h-3.5 text-violet-700" />}
          {isHcSr04 && <Waves className="w-3.5 h-3.5 text-sky-700" />}
          {isTmp36 && <Thermometer className="w-3.5 h-3.5 text-orange-700" />}
          {isRelay && <Zap className="w-3.5 h-3.5 text-amber-700" />}
          PROPERTIES
        </div>
        <div className="text-xs font-bold text-[#0F2142] mt-1">{comp.label}</div>
        <div className="text-[11px] text-slate-500 font-mono">{comp.id.slice(0, 18)}</div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* General */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
            <Settings className="w-3 h-3 text-slate-500" /> <span className="text-[11px] font-bold text-slate-700">GENERAL</span>
          </div>
          <div className="p-2.5 space-y-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600">Label</label>
              <input
                value={comp.label || ""}
                onChange={(e) => onUpdateComponent(comp.id, { label: e.target.value })}
                className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-[#0E9A8B]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600">X</label>
                <input type="number" value={Math.round(comp.x)} onChange={(e) => onUpdateComponent(comp.id, { x: Number(e.target.value) })} className="w-full mt-1 px-2 py-1 border border-slate-200 rounded text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">Y</label>
                <input type="number" value={Math.round(comp.y)} onChange={(e) => onUpdateComponent(comp.id, { y: Number(e.target.value) })} className="w-full mt-1 px-2 py-1 border border-slate-200 rounded text-xs" />
              </div>
            </div>
            <button onClick={() => onRotate(comp.id)} className="w-full h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center gap-1.5 text-xs font-bold hover:bg-slate-50">
              <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
            </button>
          </div>
        </div>

        {/* Specific */}
        {isArduino && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-[#0F2142] text-white flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> <span className="text-[11px] font-bold">ARDUINO UNO R3</span>
            </div>
            <div className="p-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Board</span><span className="font-bold">{comp.properties.board}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">MCU</span><span className="font-bold">{comp.properties.mcu}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Digital</span><span className="font-bold">{comp.properties.digitalPins}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Analog</span><span className="font-bold">{comp.properties.analogPins}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Power</span><span className="font-bold">{comp.properties.power}</span></div>
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px]">
                <b>Terminals: {comp.terminals.length}</b> — Click a pin on canvas to start wiring. Digital pins D0–D13 on right, Analog/power on left.
              </div>
            </div>
          </div>
        )}

        {isRGBLED && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-violet-50 border-b border-violet-100 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-violet-700" /> <span className="text-[11px] font-bold text-violet-800">COMMON-CATHODE RGB LED</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>Connect the common cathode to GND. Connect R, G, and B channel pins to separate Arduino digital outputs; add one current-limiting resistor in series with each channel.</p>
              <div className="grid grid-cols-3 gap-1 text-center font-bold">
                <span className="rounded bg-red-50 p-1 text-red-700">R → D9</span>
                <span className="rounded bg-green-50 p-1 text-green-700">G → D10</span>
                <span className="rounded bg-blue-50 p-1 text-blue-700">B → D11</span>
              </div>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">Each channel is on/off. Smooth brightness and PWM color mixing are not supported yet.</p>
            </div>
          </div>
        )}

        {isSevenSegment && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-red-50 border-b border-red-100 flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-red-700" /> <span className="text-[11px] font-bold text-red-800">SINGLE-DIGIT 7-SEGMENT</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>Common-cathode display: connect both COM pins to GND. Each segment is a separate LED output.</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px]">
                <span>A top → D2</span><span>B upper-right → D3</span>
                <span>C lower-right → D4</span><span>D bottom → D5</span>
                <span>E lower-left → D6</span><span>F upper-left → D7</span>
                <span>G middle → D8</span><span>DP dot → D9</span>
              </div>
              <p>For a real circuit, put a current-limiting resistor in series with each used segment. A–G and DP illuminate independently when their mapped digital output is HIGH.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">This model uses on/off digital outputs only. No PWM dimming, multiplexing, or display-driver chip is modeled.</p>
            </div>
          </div>
        )}

        {isLED && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-red-50 border-b border-red-100 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-red-600" /> <span className="text-[11px] font-bold text-red-700">LED</span>
            </div>
            <div className="p-2.5 space-y-2">
              <div className="flex gap-1.5">
                {["red", "green", "blue", "yellow"].map((col) => (
                  <button
                    key={col}
                    onClick={() => onUpdateComponent(comp.id, { properties: { ...comp.properties, color: col }, label: `${col.toUpperCase()} LED` })}
                    className={`flex-1 h-7 rounded-md border-2 text-[11px] font-bold capitalize ${comp.properties.color === col ? "border-slate-900" : "border-slate-200"}`}
                    style={{ background: col === "red" ? "#FEE2E2" : col === "green" ? "#DCFCE7" : col === "blue" ? "#DBEAFE" : "#FEF9C3", color: col === "red" ? "#991B1B" : col === "green" ? "#166534" : col === "blue" ? "#1E40AF" : "#854D0E" }}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded border">
                  <div className="font-bold text-slate-700">Anode</div>
                  <div className="text-slate-500">Long leg • +</div>
                  <div className="font-mono text-[10px] bg-white border rounded px-1 mt-1">{comp.terminals[0]?.id.slice(-10)}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border">
                  <div className="font-bold text-slate-700">Cathode</div>
                  <div className="text-slate-500">Short/flat • − • GND</div>
                  <div className="font-mono text-[10px] bg-white border rounded px-1 mt-1">{comp.terminals[1]?.id.slice(-10)}</div>
                </div>
              </div>
              <div className="text-[11px] p-2 bg-amber-50 border border-amber-200 rounded">
                <b>Polarity matters!</b> Anode → Resistor → D8, Cathode → GND. Reversed won’t light.
              </div>
            </div>
          </div>
        )}

        {isResistor && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
              <Minus className="w-3 h-3 text-amber-700" /> <span className="text-[11px] font-bold text-amber-800">RESISTOR</span>
            </div>
            <div className="p-2.5 space-y-2">
              <div className="flex gap-2 text-[11px]">
                <span className="text-slate-500">Resistance</span>
                <span className="font-bold ml-auto">{comp.properties.resistance}</span>
              </div>
              <select
                value={String(comp.properties.resistance ?? "220 Ω")}
                onChange={(e) => {
                  const v = e.target.value;
                  onUpdateComponent(comp.id, { properties: { ...comp.properties, resistance: v }, label: `${v} Resistor` });
                }}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs"
              >
                <option>100 Ω</option>
                <option>220 Ω</option>
                <option>330 Ω</option>
                <option>1k Ω</option>
                <option>10k Ω</option>
              </select>
              <div className="text-[11px] grid grid-cols-2 gap-1">
                <span className="text-slate-500">Tolerance</span><span className="font-bold">{comp.properties.tolerance}</span>
                <span className="text-slate-500">Bands</span><span className="font-bold">{comp.properties.bands}</span>
              </div>
              <div className="text-[11px] p-2 bg-blue-50 border border-blue-200 rounded">
                For LED, 220Ω limits current to ~15mA at 5V. Without resistor, LED would burn.
              </div>
            </div>
          </div>
        )}

        {isPushbutton && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-rose-50 border-b border-rose-100 flex items-center gap-1.5">
              <Circle className="w-3 h-3 text-rose-600" /> <span className="text-[11px] font-bold text-rose-800">MOMENTARY PUSHBUTTON</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>A normally-open, four-leg tactile switch. The two terminals on each side are always joined; pressing bridges the two sides together. Drag the gray base to move it; hold the red cap to press.</p>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded"><b>Try it:</b> wire Arduino D2 to one side (1A or 1B), and the other side (2A or 2B) to GND. Hold the red cap while the simulation runs.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded"><b>Sketch:</b> set D2 to INPUT_PULLUP. The pressed button reads LOW; the released button reads HIGH. Use digitalRead() in a simple if/else.</p>
            </div>
          </div>
        )}

        {isSlideSwitch && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-cyan-50 border-b border-cyan-100 flex items-center gap-1.5">
              <ToggleRight className="w-3 h-3 text-cyan-700" /> <span className="text-[11px] font-bold text-cyan-800">LATCHED SPST SLIDE SWITCH</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <div className="flex items-center justify-between"><span>Contact state</span><b className={comp.properties.isOn === true ? "text-cyan-700" : "text-slate-500"}>{comp.properties.isOn === true ? "ON • closed" : "OFF • open"}</b></div>
              <button type="button" aria-label="Toggle slide switch state" onClick={() => onToggleSlideSwitch(comp.id)} className="w-full rounded-md border border-cyan-300 bg-cyan-50 px-2 py-1.5 font-bold text-cyan-800 hover:bg-cyan-100">Toggle {comp.properties.isOn === true ? "OFF" : "ON"}</button>
              <p>Unlike the momentary pushbutton, this switch stays in its selected state after you release it. Click the blue slider on the canvas or use this button.</p>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">For a pull-up input: connect terminal A to a digital input (for example D2), B to GND, and use `pinMode(2, INPUT_PULLUP)`. Closed reads LOW; open reads HIGH.</p>
            </div>
          </div>
        )}

        {isJoystick && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-blue-50 border-b border-blue-100 flex items-center gap-1.5">
              <Gamepad2 className="w-3 h-3 text-blue-700" /> <span className="text-[11px] font-bold text-blue-800">2-AXIS JOYSTICK MODULE</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <label htmlFor="joystick-x-axis" className="font-bold text-slate-600">X axis: {Number(comp.properties.xValue ?? 512)} / 1023</label>
              <input id="joystick-x-axis" aria-label="Joystick X axis" type="range" min={0} max={1023} step={1} value={Number(comp.properties.xValue ?? 512)} onChange={(event) => onJoystickAxisChange(comp.id, "xValue", Number(event.target.value))} className="w-full accent-blue-600" />
              <label htmlFor="joystick-y-axis" className="font-bold text-slate-600">Y axis: {Number(comp.properties.yValue ?? 512)} / 1023</label>
              <input id="joystick-y-axis" aria-label="Joystick Y axis" type="range" min={0} max={1023} step={1} value={Number(comp.properties.yValue ?? 512)} onChange={(event) => onJoystickAxisChange(comp.id, "yValue", Number(event.target.value))} className="w-full accent-blue-600" />
              <div className="flex justify-between text-[9px] text-slate-500"><span>Left / Down • 0</span><span>Center • 512</span><span>Right / Up • 1023</span></div>
              <button type="button" aria-label={`Joystick button, ${pressedButtonIds.includes(comp.id) ? "pressed" : "released"}`} aria-pressed={pressedButtonIds.includes(comp.id)} onMouseDown={(event) => { event.preventDefault(); onJoystickButtonPressStart(comp.id); }} onMouseUp={() => onJoystickButtonPressEnd(comp.id)} onMouseLeave={() => onJoystickButtonPressEnd(comp.id)} onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); onJoystickButtonPressStart(comp.id); } }} onKeyUp={(event) => { if (event.key === " " || event.key === "Enter") onJoystickButtonPressEnd(comp.id); }} onBlur={() => onJoystickButtonPressEnd(comp.id)} className={`w-full rounded-md border px-2 py-1.5 font-bold ${pressedButtonIds.includes(comp.id) ? "bg-rose-100 border-rose-300 text-rose-800" : "bg-slate-50 border-slate-200 text-slate-700"}`}>Hold to press joystick SW • {pressedButtonIds.includes(comp.id) ? "PRESSED" : "released"}</button>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire VCC→5V, GND→GND, VRX→A0, VRY→A1, and SW→D2. Use `analogRead(A0/A1)` threshold conditions for the axes and `pinMode(2, INPUT_PULLUP)` for SW. Pressed SW reads LOW when the module GND is wired.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">Axis controls are idealized 0–1023 inputs; joystick acceleration, calibration, and analog calculations are not modeled.</p>
            </div>
          </div>
        )}

        {isServo && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-cyan-50 border-b border-cyan-100 flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 text-cyan-700" /> <span className="text-[11px] font-bold text-cyan-800">HOBBY SERVO MOTOR</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>Attach the signal pin in `setup()`, then command a fixed angle from 0° to 180°. The canvas arm and pulse label show the modeled output.</p>
              <pre className="p-2 bg-slate-900 text-cyan-100 rounded text-[10px] leading-relaxed overflow-x-auto">{`#include <Servo.h>\nServo arm;\n\nvoid setup() {\n  arm.attach(9);\n}\n\nvoid loop() {\n  arm.write(90);\n  delay(20);\n}`}</pre>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire VCC→5V, GND→GND, and SIG→D9. The model maps 0°–180° to a 1,000–2,000 µs command pulse repeated at 50 Hz. This is a bounded visual model, not an AVR pulse waveform.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">For a physical servo, use a suitable external supply when needed and share its ground with the Uno. Do not power a loaded motor directly from a GPIO pin.</p>
            </div>
          </div>
        )}

        {isHBridge && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-slate-700" /> <span className="text-[11px] font-bold text-slate-800">L298N H-BRIDGE · CHANNEL A</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>Connect VCC and VM to the modeled 5V supply, GND to common ground, OUT1/OUT2 to the motor, and ENA to a PWM pin (D3 recommended).</p>
              <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="rounded bg-emerald-50 p-1">IN1 HIGH · IN2 LOW → CW</span><span className="rounded bg-blue-50 p-1">IN1 LOW · IN2 HIGH → CCW</span><span className="rounded bg-slate-50 p-1">IN1 LOW · IN2 LOW → coast</span><span className="rounded bg-amber-50 p-1">IN1 HIGH · IN2 HIGH → brake</span></div>
              <p>Use `analogWrite(3, 0..255)` on ENA to set modeled speed. Direction inputs use `digitalWrite()`.</p>
              <pre className="p-2 bg-slate-900 text-cyan-100 rounded text-[10px] leading-relaxed overflow-x-auto">{`const int enA = 3;\nconst int in1 = 4;\nconst int in2 = 5;\nvoid setup() { pinMode(in1, OUTPUT); pinMode(in2, OUTPUT); }\nvoid loop() {\n  analogWrite(enA, 128);\n  digitalWrite(in1, HIGH);\n  digitalWrite(in2, LOW);\n  delay(20);\n}`}</pre>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">The lab models direction and duty visually, not motor current, torque, stall, voltage drop, or driver heating. For physical motors, use a suitable motor supply and common ground; never drive a motor directly from an Uno GPIO.</p>
            </div>
          </div>
        )}

        {isDcMotor && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 text-slate-700" /> <span className="text-[11px] font-bold text-slate-800">BRUSHED DC MOTOR</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>Connect M+ and M− to the H-bridge OUT1 and OUT2 terminals. The motor animates only when a powered driver has a valid direction input and nonzero ENA duty.</p>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">The displayed speed percentage is the ENA PWM duty. Reversing the two motor leads reverses the displayed direction.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">Use an H-bridge or motor driver in real circuits; a GPIO pin cannot safely supply motor current.</p>
            </div>
          </div>
        )}

        {isRelay && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-700" /> <span className="text-[11px] font-bold text-amber-800">5V SINGLE-CHANNEL RELAY</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <p>The modeled coil uses VCC→5V and GND→GND. Connect IN to a digital output (D7 recommended); this module model is active-low.</p>
              <div className="grid grid-cols-2 gap-1 text-[10px]"><span className="rounded bg-slate-50 p-1">IN HIGH → released</span><span className="rounded bg-amber-50 p-1">IN LOW → energized</span><span className="rounded bg-slate-50 p-1">Released: COM–NC</span><span className="rounded bg-emerald-50 p-1">Energized: COM–NO</span></div>
              <pre className="p-2 bg-slate-900 text-amber-100 rounded text-[10px] leading-relaxed overflow-x-auto">{`const int relayPin = 7;
void setup() { pinMode(relayPin, OUTPUT); }
void loop() {
  digitalWrite(relayPin, LOW);  // relay on
  delay(1000);
  digitalWrite(relayPin, HIGH); // relay off
  delay(1000);
}`}</pre>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">Contacts are ideal switches in this visual model; it does not simulate coil current, contact ratings, isolation, arcing, flyback, or load behavior. Never use the simulator as safety guidance for mains voltage. Physical relay wiring can be lethal—use low-voltage loads unless qualified and follow the module datasheet.</p>
            </div>
          </div>
        )}

        {isTmp36 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-orange-50 border-b border-orange-100 flex items-center gap-1.5">
              <Thermometer className="w-3 h-3 text-orange-700" /> <span className="text-[11px] font-bold text-orange-800">TMP36 TEMPERATURE SENSOR</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <label htmlFor="tmp36-temperature" className="font-bold text-slate-600">Simulated temperature: {Number(comp.properties.temperatureC ?? 25)} °C</label>
              <input
                id="tmp36-temperature"
                aria-label="TMP36 simulated temperature (°C)"
                type="range"
                min={-40}
                max={125}
                step={1}
                value={Math.max(-40, Math.min(125, Number(comp.properties.temperatureC ?? 25)))}
                onChange={(event) => onUpdateComponent(comp.id, { properties: { ...comp.properties, temperatureC: Number(event.target.value) } })}
                className="w-full accent-orange-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500"><span>−40 °C</span><span>125 °C</span></div>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire VCC→5V, GND→GND, and VOUT→A0–A5. The idealized TMP36 model uses 500 mV at 0 °C and rises 10 mV/°C. At 25 °C, VOUT is about 750 mV (ADC ≈153 on a 5 V, 10-bit Uno).</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">This is a slider-driven analog model, not a voltage, calibration, noise, thermal-response, or ambient-temperature simulation. Use `analogRead()` threshold conditions; general arithmetic and variable assignments are not executed.</p>
            </div>
          </div>
        )}

        {isHcSr04 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-sky-50 border-b border-sky-100 flex items-center gap-1.5">
              <Waves className="w-3 h-3 text-sky-700" /> <span className="text-[11px] font-bold text-sky-800">HC-SR04 ULTRASONIC RANGE</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <label htmlFor="ultrasonic-distance" className="font-bold text-slate-600">Target distance: {Number(comp.properties.distanceCm ?? 100)} cm · echo {Number(comp.properties.distanceCm ?? 100) * 58} µs</label>
              <input
                id="ultrasonic-distance"
                aria-label="Ultrasonic simulated distance (cm)"
                type="range"
                min={2}
                max={400}
                step={1}
                value={Math.max(2, Math.min(400, Number(comp.properties.distanceCm ?? 100)))}
                onChange={(event) => onUpdateComponent(comp.id, { properties: { ...comp.properties, distanceCm: Number(event.target.value) } })}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500"><span>2 cm · 116 µs</span><span>400 cm · 23,200 µs</span></div>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire VCC→5V, GND→GND, TRIG→a digital output (D3), and ECHO→a digital input (D2). Send a short TRIG pulse, then compare `pulseIn(echoPin, HIGH[, timeout])` against a constant inside an `if` condition. The model uses about 58 µs per centimeter.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">Only bounded `pulseIn()` threshold conditions are simulated. The lab does not calculate propagation, beam angle, reflections, temperature effects, or real-time echo waveforms; no trigger pulse produces the modeled timeout value.</p>
            </div>
          </div>
        )}

        {isPir && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-violet-50 border-b border-violet-100 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-violet-700" /> <span className="text-[11px] font-bold text-violet-800">PIR MOTION SENSOR</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <button
                type="button"
                aria-label={`Toggle PIR motion, ${comp.properties.motionDetected === true ? "detected" : "clear"}`}
                aria-pressed={comp.properties.motionDetected === true}
                onClick={() => onUpdateComponent(comp.id, { properties: { ...comp.properties, motionDetected: comp.properties.motionDetected !== true } })}
                className={`w-full rounded-md border px-2 py-1.5 font-bold ${comp.properties.motionDetected === true ? "bg-violet-100 border-violet-300 text-violet-800" : "bg-slate-50 border-slate-200 text-slate-700"}`}
              >{comp.properties.motionDetected === true ? "Simulated motion detected · HIGH" : "Simulate motion · CLEAR / LOW"}</button>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire VCC→5V, GND→GND, and OUT→a digital input such as D2. Use `pinMode(2, INPUT)` and `digitalRead(2)`: simulated motion is HIGH; clear is LOW.</p>
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">This switchable model represents only a binary PIR output. It does not model range, field of view, warm-up, retrigger timing, ambient conditions, or real sensor electronics.</p>
            </div>
          </div>
        )}

        {isLdr && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-amber-700" /> <span className="text-[11px] font-bold text-amber-800">LDR LIGHT SENSOR</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <label htmlFor="ldr-light-level" className="font-bold text-slate-600">Light level: {Number(comp.properties.lightLevel) || 0}%</label>
              <input
                id="ldr-light-level"
                aria-label="LDR light level setting"
                type="range"
                min={0}
                max={100}
                step={1}
                value={Number(comp.properties.lightLevel) || 0}
                onChange={(event) => onUpdateComponent(comp.id, { properties: { ...comp.properties, lightLevel: Number(event.target.value) } })}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500"><span>Dark • ADC 0</span><span>Bright • ADC 1023</span></div>
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire VCC → 5V, GND → GND, and AO → A0–A5. Brightness maps to a simulated analogRead value; this module does not calculate voltage-divider physics.</p>
            </div>
          </div>
        )}

        {isPotentiometer && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-teal-50 border-b border-teal-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-teal-700" /> <span className="text-[11px] font-bold text-teal-800">10kΩ POTENTIOMETER</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <label htmlFor="potentiometer-position" className="font-bold text-slate-600">Wiper position: {Number(comp.properties.value) || 0} / 1023</label>
              <input
                id="potentiometer-position"
                aria-label="Potentiometer wiper position"
                type="range"
                min={0}
                max={1023}
                step={1}
                value={Number(comp.properties.value) || 0}
                onChange={(event) => onUpdateComponent(comp.id, { properties: { ...comp.properties, value: Number(event.target.value) } })}
                className="w-full accent-teal-600"
              />
              <p className="p-2 bg-blue-50 border border-blue-200 rounded">Wire GND → potentiometer GND, potentiometer 5V → Arduino 5V, and WIPER → A0. Then use `analogRead(A0)` (0–1023) in a supported threshold condition.</p>
            </div>
          </div>
        )}

        {isBuzzer && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 text-amber-700" /> <span className="text-[11px] font-bold text-amber-800">BUZZER</span>
            </div>
            <div className="p-2.5 space-y-2 text-[11px]">
              <label className="font-bold text-slate-600">Buzzer type</label>
              <select
                aria-label="Buzzer type"
                value={String(comp.properties.buzzerType ?? "active")}
                onChange={(event) => {
                  const buzzerType = event.target.value === "passive" ? "passive" : "active";
                  onUpdateComponent(comp.id, { properties: { ...comp.properties, buzzerType }, label: `${buzzerType === "active" ? "Active" : "Passive"} Buzzer` });
                }}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs"
              >
                <option value="active">Active — fixed 2300 Hz</option>
                <option value="passive">Passive — sketch tone()</option>
              </select>
              {comp.properties.buzzerType === "passive" ? (
                <p className="p-2 bg-blue-50 border border-blue-200 rounded">Passive buzzers need `tone(pin, frequency)` to make a pitch. Use `noTone(pin)` to stop it. Example: <code>tone(9, 440)</code>.</p>
              ) : (
                <p className="p-2 bg-blue-50 border border-blue-200 rounded">Active buzzers make their own fixed pitch when powered. Drive the + terminal from a HIGH output or 5V; connect − to GND.</p>
              )}
              <p className="p-2 bg-amber-50 border border-amber-200 rounded">Connect + and − correctly. The lab plays a quiet browser-generated square tone when the simulated circuit powers the buzzer; use the Run/Stop controls to start or silence it.</p>
            </div>
          </div>
        )}

        {isBreadboard && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-2.5 py-1.5 bg-[#F5F0E6] border-b border-[#D6CFC0] flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#6B5E4A]">BREADBOARD</span>
            </div>
            <div className="p-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Model</span><span className="font-bold">{comp.properties.model}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Strips</span><span className="font-bold">{comp.properties.strips}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Rails</span><span className="font-bold">{comp.properties.rails}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Trench</span><span className="font-bold text-red-600">{comp.properties.trench}</span></div>
              <div className="mt-2 p-2 bg-slate-50 border rounded text-[11px]">
                Each 5-hole column is connected. Opposite side of trench is <b>not</b> connected. Power rails are isolated from strips.
              </div>
            </div>
          </div>
        )}

        {/* Terminals */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">TERMINALS • {comp.terminals.length}</span>
            <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded">Click to wire</span>
          </div>
          <div className="max-h-40 overflow-auto divide-y divide-slate-100">
            {comp.terminals.slice(0, 40).map((t) => (
              <div key={t.id} className="px-2.5 py-1.5 flex items-center justify-between hover:bg-slate-50">
                <span className="text-[11px] font-mono font-bold">{t.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{t.connected ? "Connected" : "Free"}</span>
              </div>
            ))}
            {comp.terminals.length > 40 && <div className="px-2.5 py-1 text-[10px] text-slate-500 text-center">+{comp.terminals.length - 40} more…</div>}
          </div>
        </div>

        <button onClick={onDelete} className="w-full h-9 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold">
          <Trash2 className="w-3.5 h-3.5" /> Delete Component
        </button>
      </div>
    </div>
  );
}
