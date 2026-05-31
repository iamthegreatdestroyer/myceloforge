import * as fs from "fs";

export interface MycNode {
  id: string;
  data: Record<string, unknown>;
  connections: string[];
}

export interface MycEdge {
  from: string;
  to: string;
  weight: number;
  type: string;
}

export interface Signal {
  strength: number;
  decay: number;
  type: string;
}

export class MycNetwork {
  private nodes: Map<string, MycNode> = new Map();
  private edges: MycEdge[] = [];

  addNode(id: string, data: Record<string, unknown>): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, data, connections: [] });
    }
  }

  connect(from: string, to: string, weight: number, type: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(`Node not found: ${!this.nodes.has(from) ? from : to}`);
    }
    this.edges.push({ from, to, weight, type });
    const fromNode = this.nodes.get(from)!;
    if (!fromNode.connections.includes(to)) {
      fromNode.connections.push(to);
    }
  }

  propagate(startNode: string, signal: Signal): Map<string, number> {
    if (!this.nodes.has(startNode)) {
      throw new Error(`Node not found: ${startNode}`);
    }

    const strengths = new Map<string, number>();
    strengths.set(startNode, signal.strength);

    // BFS with accumulated strength per node
    const queue: Array<{ nodeId: string; strength: number }> = [
      { nodeId: startNode, strength: signal.strength },
    ];

    while (queue.length > 0) {
      const { nodeId, strength } = queue.shift()!;

      const outEdges = this.edges.filter((e) => e.from === nodeId);
      for (const edge of outEdges) {
        const next = strength * edge.weight * signal.decay;
        if (next < 0.01) continue;

        const existing = strengths.get(edge.to) ?? 0;
        if (next > existing) {
          strengths.set(edge.to, next);
          queue.push({ nodeId: edge.to, strength: next });
        }
      }
    }

    return strengths;
  }

  query(pattern: string): MycNode[] {
    const lower = pattern.toLowerCase();
    return Array.from(this.nodes.values()).filter((node) => {
      if (node.id.toLowerCase().includes(lower)) return true;
      return Object.values(node.data).some((v) =>
        String(v).toLowerCase().includes(lower)
      );
    });
  }

  shortestPath(from: string, to: string): string[] {
    if (!this.nodes.has(from) || !this.nodes.has(to)) return [];
    if (from === to) return [from];

    // Dijkstra over edge weights (treat weight as distance cost = 1/weight so higher weight = shorter)
    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const nodeIds = Array.from(this.nodes.keys());
    const unvisited = new Set<string>(nodeIds);

    nodeIds.forEach((id) => {
      dist.set(id, Infinity);
    });
    dist.set(from, 0);

    while (unvisited.size > 0) {
      // pick unvisited node with min dist
      let u: string | null = null;
      let minDist = Infinity;
      Array.from(unvisited).forEach((id) => {
        const d = dist.get(id)!;
        if (d < minDist) {
          minDist = d;
          u = id;
        }
      });
      if (u === null || dist.get(u) === Infinity) break;
      if (u === to) break;

      unvisited.delete(u);

      const outEdges = this.edges.filter((e) => e.from === u);
      for (const edge of outEdges) {
        if (!unvisited.has(edge.to)) continue;
        // cost = 1 / weight so heavier edges are preferred (shorter path)
        const cost = edge.weight > 0 ? 1 / edge.weight : Infinity;
        const alt = dist.get(u)! + cost;
        if (alt < dist.get(edge.to)!) {
          dist.set(edge.to, alt);
          prev.set(edge.to, u);
        }
      }
    }

    if (dist.get(to) === Infinity) return [];

    // reconstruct path
    const path: string[] = [];
    let cur: string | undefined = to;
    while (cur !== undefined) {
      path.unshift(cur);
      cur = prev.get(cur);
    }
    return path[0] === from ? path : [];
  }

  save(path: string): void {
    const data = {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
    fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  }

  load(path: string): void {
    const raw = fs.readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as { nodes: MycNode[]; edges: MycEdge[] };
    this.nodes = new Map(data.nodes.map((n) => [n.id, n]));
    this.edges = data.edges;
  }

  getNode(id: string): MycNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): MycNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): MycEdge[] {
    return [...this.edges];
  }
}
