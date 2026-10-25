import type { ComponentInstance } from "@/types/circuit";

export interface WireRoutePoint {
  x: number;
  y: number;
}

export interface RoutedTerminal extends WireRoutePoint {
  compId: string;
}

/**
 * Build a deterministic, orthogonal wire path. Breadboard wires approach from
 * the nearest edge and use a small staggered outside lane before entering the
 * selected row/column. Other wires use a rounded elbow at their midpoint.
 */
export function buildWireRoutePoints(
  start: RoutedTerminal,
  end: RoutedTerminal,
  wireIndex: number,
  components: ComponentInstance[],
): WireRoutePoint[] {
  const startBoard = components.find((component) => component.id === start.compId && component.type === "breadboard");
  const endBoard = components.find((component) => component.id === end.compId && component.type === "breadboard");
  const board = startBoard ?? endBoard;

  if (board && Boolean(startBoard) !== Boolean(endBoard)) {
    const boardPoint = startBoard ? start : end;
    const externalPoint = startBoard ? end : start;
    const left = board.x;
    const right = board.x + board.width;
    const top = board.y;
    const bottom = board.y + Math.max(board.height, 184);
    const sideDistances = [
      { side: "left" as const, distance: Math.abs(externalPoint.x - left) },
      { side: "right" as const, distance: Math.abs(externalPoint.x - right) },
      { side: "top" as const, distance: Math.abs(externalPoint.y - top) },
      { side: "bottom" as const, distance: Math.abs(externalPoint.y - bottom) },
    ];
    const side = sideDistances.reduce((nearest, current) => current.distance < nearest.distance ? current : nearest).side;
    const lane = 12 + (wireIndex % 5) * 7;
    let points: WireRoutePoint[];

    if (side === "left") {
      const laneX = left - lane;
      points = [externalPoint, { x: laneX, y: externalPoint.y }, { x: laneX, y: boardPoint.y }, boardPoint];
    } else if (side === "right") {
      const laneX = right + lane;
      points = [externalPoint, { x: laneX, y: externalPoint.y }, { x: laneX, y: boardPoint.y }, boardPoint];
    } else if (side === "top") {
      const laneY = top - lane;
      points = [externalPoint, { x: externalPoint.x, y: laneY }, { x: boardPoint.x, y: laneY }, boardPoint];
    } else {
      const laneY = bottom + lane;
      points = [externalPoint, { x: externalPoint.x, y: laneY }, { x: boardPoint.x, y: laneY }, boardPoint];
    }

    return startBoard ? points.reverse() : points;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lane = ((wireIndex % 5) - 2) * 10;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const elbowX = (start.x + end.x) / 2 + lane;
    return [start, { x: elbowX, y: start.y }, { x: elbowX, y: end.y }, end];
  }
  const elbowY = (start.y + end.y) / 2 + lane;
  return [start, { x: start.x, y: elbowY }, { x: end.x, y: elbowY }, end];
}

/** Convert a polyline to a gently rounded SVG path, optionally in local coordinates. */
export function wireRouteToPath(points: WireRoutePoint[], origin: WireRoutePoint = { x: 0, y: 0 }): string {
  const translated = points
    .map((point) => ({ x: point.x - origin.x, y: point.y - origin.y }))
    .filter((point, index, all) => index === 0 || Math.hypot(point.x - all[index - 1].x, point.y - all[index - 1].y) > 0.01);
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
