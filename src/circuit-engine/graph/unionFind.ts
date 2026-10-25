/**
 * Union-Find (Disjoint Set) for net resolution
 * Each terminal starts in its own set, wires and breadboard strips merge sets
 */
export class UnionFind {
  private parent = new Map<string, string>();
  private rank = new Map<string, number>();

  makeSet(x: string) {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.makeSet(x);
      return x;
    }
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra) || 0;
    const rankB = this.rank.get(rb) || 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  /** Get all sets as map root -> members */
  getSets(): Map<string, Set<string>> {
    const sets = new Map<string, Set<string>>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!sets.has(root)) sets.set(root, new Set());
      sets.get(root)!.add(key);
    }
    return sets;
  }

  /** Are two nodes connected? */
  connected(a: string, b: string): boolean {
    if (!this.parent.has(a) || !this.parent.has(b)) return false;
    return this.find(a) === this.find(b);
  }

  size(): number {
    return this.parent.size;
  }
}
