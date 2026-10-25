import type { ComponentInstance } from "@/types/circuit";

export interface WireRoutePoint {
  x: number;
  y: number;
}

export interface RoutedTerminal extends WireRoutePoint {
  compId: string;
}

interface Obstacle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const EPSILON = 0.01;

function pointKey(point: WireRoutePoint) {
  return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

function compactPoints(points: WireRoutePoint[]): WireRoutePoint[] {
  const distinct = points.filter((point, index) => index === 0 || pointKey(point) !== pointKey(points[index - 1]));
  return distinct.filter((point, index) => {
    if (index === 0 || index === distinct.length - 1) return true;
    const previous = distinct[index - 1];
    const next = distinct[index + 1];
    return !(Math.abs(previous.x - point.x) < EPSILON && Math.abs(point.x - next.x) < EPSILON)
      && !(Math.abs(previous.y - point.y) < EPSILON && Math.abs(point.y - next.y) < EPSILON);
  });
}

function getObstacles(components: ComponentInstance[], padding = 12): Obstacle[] {
  return components.map((component) => ({
    left: component.x - padding,
    right: component.x + Math.max(component.width, 1) + padding,
    top: component.y - padding,
    bottom: component.y + Math.max(component.height, component.type === "breadboard" ? 184 : 1) + padding,
  }));
}

function terminalExit(component: ComponentInstance | undefined, terminal: RoutedTerminal, clearance = 18): WireRoutePoint {
  if (!component) return terminal;
  const right = component.x + Math.max(component.width, 1);
  const bottom = component.y + Math.max(component.height, component.type === "breadboard" ? 184 : 1);
  const sides = [
    { distance: Math.abs(terminal.x - component.x), point: { x: component.x - clearance, y: terminal.y } },
    { distance: Math.abs(terminal.x - right), point: { x: right + clearance, y: terminal.y } },
    { distance: Math.abs(terminal.y - component.y), point: { x: terminal.x, y: component.y - clearance } },
    { distance: Math.abs(terminal.y - bottom), point: { x: terminal.x, y: bottom + clearance } },
  ];
  return sides.reduce((nearest, side) => side.distance < nearest.distance ? side : nearest).point;
}

function segmentHitsObstacle(a: WireRoutePoint, b: WireRoutePoint, obstacle: Obstacle) {
  if (Math.abs(a.y - b.y) < EPSILON) {
    const y = a.y;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    return y > obstacle.top + EPSILON && y < obstacle.bottom - EPSILON
      && Math.max(minX, obstacle.left + EPSILON) < Math.min(maxX, obstacle.right - EPSILON);
  }
  if (Math.abs(a.x - b.x) < EPSILON) {
    const x = a.x;
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return x > obstacle.left + EPSILON && x < obstacle.right - EPSILON
      && Math.max(minY, obstacle.top + EPSILON) < Math.min(maxY, obstacle.bottom - EPSILON);
  }
  return true;
}

function segmentCrossingCost(a: WireRoutePoint, b: WireRoutePoint, previousRoutes: WireRoutePoint[][]) {
  let cost = 0;
  for (const route of previousRoutes) {
    for (let index = 1; index < route.length; index++) {
      const c = route[index - 1];
      const d = route[index];
      const aHorizontal = Math.abs(a.y - b.y) < EPSILON;
      const cHorizontal = Math.abs(c.y - d.y) < EPSILON;
      if (aHorizontal === cHorizontal) {
        if (aHorizontal && Math.abs(a.y - c.y) < EPSILON) {
          const overlap = Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));
          if (overlap > 3) cost += 900 + overlap * 3;
        } else if (!aHorizontal && Math.abs(a.x - c.x) < EPSILON) {
          const overlap = Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y));
          if (overlap > 3) cost += 900 + overlap * 3;
        }
        continue;
      }
      const horizontalA = aHorizontal ? a : c;
      const horizontalB = aHorizontal ? b : d;
      const verticalA = aHorizontal ? c : a;
      const verticalB = aHorizontal ? d : b;
      const crossX = verticalA.x;
      const crossY = horizontalA.y;
      const withinHorizontal = crossX > Math.min(horizontalA.x, horizontalB.x) + 2 && crossX < Math.max(horizontalA.x, horizontalB.x) - 2;
      const withinVertical = crossY > Math.min(verticalA.y, verticalB.y) + 2 && crossY < Math.max(verticalA.y, verticalB.y) - 2;
      if (withinHorizontal && withinVertical) cost += 420;
    }
  }
  return cost;
}

function pathScore(points: WireRoutePoint[], obstacles: Obstacle[], previousRoutes: WireRoutePoint[][]) {
  let length = 0;
  let turns = 0;
  let blockedSegments = 0;
  let crossings = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    length += Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (obstacles.some((obstacle) => segmentHitsObstacle(a, b, obstacle))) blockedSegments += 1;
    crossings += segmentCrossingCost(a, b, previousRoutes);
    if (index > 1) {
      const before = points[index - 2];
      if (Math.abs(before.x - a.x) > EPSILON && Math.abs(a.y - b.y) > EPSILON) turns += 1;
      else if (Math.abs(before.y - a.y) > EPSILON && Math.abs(a.x - b.x) > EPSILON) turns += 1;
    }
  }
  return length + turns * 22 + crossings + blockedSegments * 1_000_000;
}

function routeCandidates(start: WireRoutePoint, end: WireRoutePoint, obstacles: Obstacle[], lane: number) {
  const candidates: WireRoutePoint[][] = [];
  const add = (points: WireRoutePoint[]) => candidates.push(compactPoints(points));
  const middleX = (start.x + end.x) / 2;
  const middleY = (start.y + end.y) / 2;
  const offsets = [0, lane, -lane, lane * 2, -lane * 2];

  add([start, { x: end.x, y: start.y }, end]);
  add([start, { x: start.x, y: end.y }, end]);
  for (const offset of offsets) {
    add([start, { x: middleX + offset, y: start.y }, { x: middleX + offset, y: end.y }, end]);
    add([start, { x: start.x, y: middleY + offset }, { x: end.x, y: middleY + offset }, end]);
  }
  for (const obstacle of obstacles) {
    const sideLanes = [
      { x: obstacle.left - lane, y: start.y },
      { x: obstacle.right + lane, y: start.y },
    ];
    for (const lanePoint of sideLanes) {
      add([start, lanePoint, { x: lanePoint.x, y: end.y }, end]);
    }
    const verticalLanes = [obstacle.top - lane, obstacle.bottom + lane];
    for (const y of verticalLanes) {
      add([start, { x: start.x, y }, { x: end.x, y }, end]);
    }
  }
  return candidates;
}

function findBestOrthogonalRoute(
  start: WireRoutePoint,
  end: WireRoutePoint,
  obstacles: Obstacle[],
  previousRoutes: WireRoutePoint[][],
  wireIndex: number,
): WireRoutePoint[] {
  const lane = 18 + (wireIndex % 4) * 8;
  const candidates = routeCandidates(start, end, obstacles, lane);
  let best = candidates[0] ?? [start, end];
  let bestScore = pathScore(best, obstacles, previousRoutes);
  for (let index = 1; index < candidates.length; index++) {
    const candidate = candidates[index];
    const score = pathScore(candidate, obstacles, previousRoutes);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Choose among straight-elbow and obstacle-detour candidates. Component bounds
 * are expanded before scoring, and existing routes are penalized for crossings
 * and long overlaps. Breadboard paths are routed to an outside port first; only
 * their final segment is allowed across the board surface to the target hole.
 */
export function buildWireRoutePoints(
  start: RoutedTerminal,
  end: RoutedTerminal,
  wireIndex: number,
  components: ComponentInstance[],
  previousRoutes: WireRoutePoint[][] = [],
  manualRoutePoint?: WireRoutePoint,
): WireRoutePoint[] {
  if (manualRoutePoint) {
    return compactPoints([
      start,
      { x: manualRoutePoint.x, y: start.y },
      manualRoutePoint,
      { x: end.x, y: manualRoutePoint.y },
      end,
    ]);
  }

  const startComponent = components.find((component) => component.id === start.compId);
  const endComponent = components.find((component) => component.id === end.compId);
  const startBoard = startComponent?.type === "breadboard" ? startComponent : undefined;
  const endBoard = endComponent?.type === "breadboard" ? endComponent : undefined;
  const board = startBoard ?? endBoard;
  const allObstacles = getObstacles(components);

  if (board && Boolean(startBoard) !== Boolean(endBoard)) {
    const boardPoint = startBoard ? start : end;
    const externalPoint = startBoard ? end : start;
    const externalComponent = startBoard ? endComponent : startComponent;
    const boardLeft = board.x;
    const boardRight = board.x + board.width;
    const boardTop = board.y;
    const boardBottom = board.y + Math.max(board.height, 184);
    const sides = [
      { side: "left" as const, distance: Math.abs(externalPoint.x - boardLeft) },
      { side: "right" as const, distance: Math.abs(externalPoint.x - boardRight) },
      { side: "top" as const, distance: Math.abs(externalPoint.y - boardTop) },
      { side: "bottom" as const, distance: Math.abs(externalPoint.y - boardBottom) },
    ];
    const side = sides.reduce((nearest, current) => current.distance < nearest.distance ? current : nearest).side;
    const lane = 18 + (wireIndex % 5) * 8;
    let approach: WireRoutePoint;
    let edge: WireRoutePoint;
    if (side === "left") {
      approach = { x: boardLeft - lane, y: boardPoint.y };
      edge = { x: boardLeft, y: boardPoint.y };
    } else if (side === "right") {
      approach = { x: boardRight + lane, y: boardPoint.y };
      edge = { x: boardRight, y: boardPoint.y };
    } else if (side === "top") {
      approach = { x: boardPoint.x, y: boardTop - lane };
      edge = { x: boardPoint.x, y: boardTop };
    } else {
      approach = { x: boardPoint.x, y: boardBottom + lane };
      edge = { x: boardPoint.x, y: boardBottom };
    }

    const externalStub = terminalExit(externalComponent, externalPoint);
    const outsideRoute = findBestOrthogonalRoute(externalStub, approach, allObstacles, previousRoutes, wireIndex);
    const externalToBoard = compactPoints([externalPoint, externalStub, ...outsideRoute.slice(1), edge, boardPoint]);
    return startBoard ? externalToBoard.reverse() : externalToBoard;
  }

  const startStub = terminalExit(startComponent, start);
  const endStub = terminalExit(endComponent, end);
  const between = findBestOrthogonalRoute(startStub, endStub, allObstacles, previousRoutes, wireIndex);
  return compactPoints([start, startStub, ...between.slice(1, -1), endStub, end]);
}

/** Return a stable point halfway along the visible polyline for a draggable route handle. */
export function getRouteHandlePoint(points: WireRoutePoint[]): WireRoutePoint {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const halfLength = lengths.reduce((sum, length) => sum + length, 0) / 2;
  let traveled = 0;
  for (let index = 0; index < lengths.length; index++) {
    const segmentLength = lengths[index];
    if (traveled + segmentLength >= halfLength) {
      const start = points[index];
      const end = points[index + 1];
      const fraction = segmentLength === 0 ? 0 : (halfLength - traveled) / segmentLength;
      return { x: start.x + (end.x - start.x) * fraction, y: start.y + (end.y - start.y) * fraction };
    }
    traveled += segmentLength;
  }
  return points[points.length - 1];
}

/** Convert a polyline to a gently rounded SVG path, optionally in local coordinates. */
export function wireRouteToPath(points: WireRoutePoint[], origin: WireRoutePoint = { x: 0, y: 0 }): string {
  const translated = compactPoints(points.map((point) => ({ x: point.x - origin.x, y: point.y - origin.y })));
  if (translated.length < 2) return "";

  let path = `M ${translated[0].x} ${translated[0].y}`;
  for (let index = 1; index < translated.length - 1; index++) {
    const previous = translated[index - 1];
    const corner = translated[index];
    const next = translated[index + 1];
    const inLength = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const outLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    if (inLength < 0.01 || outLength < 0.01) continue;
    const radius = Math.min(8, inLength / 2, outLength / 2);
    const before = {
      x: corner.x - ((corner.x - previous.x) / inLength) * radius,
      y: corner.y - ((corner.y - previous.y) / inLength) * radius,
    };
    const after = {
      x: corner.x + ((next.x - corner.x) / outLength) * radius,
      y: corner.y + ((next.y - corner.y) / outLength) * radius,
    };
    path += ` L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`;
  }
  const last = translated[translated.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}
