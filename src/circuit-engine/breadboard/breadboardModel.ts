/**
 * Accurate breadboard model — MB-102 830-point
 * - 30 columns × 5 rows per side = 300 tie points (150 top half, 150 bottom)
 * - Each 5-hole column forms a connected strip (e.g., T-0-0..T-0-4 are one net)
 * - Opposite side of center trench is isolated (T-* not connected to B-*)
 * - 4 power rails: top outer (R_TOP+), top inner (R_TOP-), bottom outer (R_BOT+), bottom inner (R_BOT-)
 * - Each rail is continuous 30 holes (we model as continuous; split variant documented)
 * - Rails NOT connected to tie strips
 */

export interface BreadboardInfo {
  cols: number;
  tieRows: number; // per side
  trench: "isolated";
  powerRails: string[]; // rail ids
  strips: { id: string; holes: string[] }[]; // each 5-hole group
}

export function getBreadboardStrips(breadboardId: string): { id: string; holes: string[] }[] {
  const strips: { id: string; holes: string[] }[] = [];
  const cols = 30;

  // Top half: T-col-row
  for (let col = 0; col < cols; col++) {
    const holes: string[] = [];
    for (let row = 0; row < 5; row++) {
      holes.push(`${breadboardId}-T-${col}-${row}`);
    }
    strips.push({ id: `${breadboardId}-STRIP-T-${col}`, holes });
  }

  // Bottom half: B-col-row
  for (let col = 0; col < cols; col++) {
    const holes: string[] = [];
    for (let row = 0; row < 5; row++) {
      holes.push(`${breadboardId}-B-${col}-${row}`);
    }
    strips.push({ id: `${breadboardId}-STRIP-B-${col}`, holes });
  }

  return strips;
}

export function getBreadboardPowerRails(breadboardId: string): { id: string; holes: string[] }[] {
  const rails: { id: string; holes: string[] }[] = [];
  // 4 rails each 30 holes
  const railDefs = ["R_TOP+", "R_TOP-", "R_BOT+", "R_BOT-"];
  for (const rail of railDefs) {
    const holes: string[] = [];
    for (let col = 0; col < 30; col++) {
      holes.push(`${breadboardId}-${rail}_${col}`);
    }
    rails.push({ id: `${breadboardId}-RAIL-${rail}`, holes });
  }
  return rails;
}

/**
 * Get all internal connections (pairs that are already connected via breadboard metal)
 * Each strip's 5 holes are mutually connected; each rail's 30 holes are mutually connected
 * We return as list of pairs that should be unioned
 */
export function getBreadboardInternalNets(breadboardId: string): [string, string][] {
  const pairs: [string, string][] = [];

  // Tie strips: connect each hole to first hole in strip
  for (const strip of getBreadboardStrips(breadboardId)) {
    const first = strip.holes[0];
    for (let i = 1; i < strip.holes.length; i++) {
      pairs.push([first, strip.holes[i]]);
    }
  }

  // Power rails: connect each hole to first hole in rail
  for (const rail of getBreadboardPowerRails(breadboardId)) {
    const first = rail.holes[0];
    for (let i = 1; i < rail.holes.length; i++) {
      pairs.push([first, rail.holes[i]]);
    }
  }

  return pairs;
}

/**
 * Validate breadboard isolation:
 * - T holes should NOT be connected to B holes (trench)
 * - Rails should NOT be connected to tie strips
 */
export function validateBreadboardIsolation() {
  // This is a utility to document expectations; actual graph union should not connect these
  return {
    trenchIsolated: true,
    railsIsolatedFromStrips: true,
    splitModel: "continuous-30 (MB-102 continuous rails, not split-center)",
  };
}
