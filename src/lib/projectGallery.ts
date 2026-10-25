import type { BeginnerProjectId } from "@/circuit-engine/models/beginnerProjectTemplates";

export const PROJECT_CONCEPTS = [
  "Getting started",
  "Inputs",
  "Sensors",
  "Breadboards",
  "Outputs & displays",
  "Actuators",
  "Sound & serial",
] as const;

export type ProjectConcept = (typeof PROJECT_CONCEPTS)[number];
export type ProjectDifficulty = "Starter" | "Builder" | "Challenge";

export interface ProjectGalleryDetails {
  difficulty: ProjectDifficulty;
  concepts: ProjectConcept[];
  takeaway: string;
}

export const PROJECT_GALLERY_DETAILS: Record<BeginnerProjectId, ProjectGalleryDetails> = {
  "blink-led": { difficulty: "Starter", concepts: ["Getting started", "Outputs & displays"], takeaway: "Digital outputs and timing" },
  "traffic-light": { difficulty: "Starter", concepts: ["Getting started", "Outputs & displays"], takeaway: "Coordinate several output pins" },
  "button-lamp": { difficulty: "Starter", concepts: ["Inputs", "Outputs & displays"], takeaway: "Read a pull-up button" },
  "pot-threshold": { difficulty: "Starter", concepts: ["Inputs"], takeaway: "Read an analog value and compare a threshold" },
  "night-light": { difficulty: "Builder", concepts: ["Inputs", "Sensors", "Outputs & displays"], takeaway: "Use an LDR to respond to light" },
  "rgb-signal": { difficulty: "Builder", concepts: ["Outputs & displays"], takeaway: "Control RGB channels independently" },
  "seven-segment": { difficulty: "Builder", concepts: ["Outputs & displays"], takeaway: "Drive display segments separately" },
  "button-buzzer": { difficulty: "Builder", concepts: ["Inputs", "Sound & serial"], takeaway: "Combine a button input with sound" },
  "serial-heartbeat": { difficulty: "Starter", concepts: ["Getting started", "Sound & serial"], takeaway: "Send status text to Serial Monitor" },
  "room-status": { difficulty: "Challenge", concepts: ["Sensors", "Outputs & displays", "Sound & serial"], takeaway: "Combine light sensing, RGB output, and sound" },
  "switch-joystick-pwm": { difficulty: "Challenge", concepts: ["Inputs", "Outputs & displays"], takeaway: "Mix joystick inputs and visual PWM" },
  "joystick-servo": { difficulty: "Challenge", concepts: ["Inputs", "Actuators"], takeaway: "Use joystick inputs to position a servo" },
  "dc-motor-hbridge": { difficulty: "Challenge", concepts: ["Actuators"], takeaway: "Control modeled motor speed and direction" },
  "pir-motion-light": { difficulty: "Builder", concepts: ["Sensors", "Inputs", "Outputs & displays"], takeaway: "Respond to a simulated motion signal" },
  "ultrasonic-distance-alarm": { difficulty: "Challenge", concepts: ["Sensors", "Inputs", "Outputs & displays"], takeaway: "Use a bounded echo-duration threshold" },
  "tmp36-temperature-alarm": { difficulty: "Builder", concepts: ["Sensors", "Inputs", "Outputs & displays"], takeaway: "Compare a temperature sensor reading" },
  "relay-controlled-lamp": { difficulty: "Challenge", concepts: ["Actuators", "Outputs & displays"], takeaway: "Switch a low-voltage modeled load" },
  "breadboard-blink": { difficulty: "Starter", concepts: ["Getting started", "Breadboards", "Outputs & displays"], takeaway: "Trace five-hole strips and wired rails" },
  "pwm-dimmer": { difficulty: "Starter", concepts: ["Inputs", "Outputs & displays"], takeaway: "Convert knob thresholds into PWM brightness levels" },
  "two-branch-breadboard": { difficulty: "Starter", concepts: ["Breadboards", "Inputs", "Outputs & displays"], takeaway: "Keep two LED branches independent while sharing a ground rail" },
};
