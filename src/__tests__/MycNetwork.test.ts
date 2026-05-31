/**
 * @jest-environment node
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { MycNetwork } from "../MycNetwork";

// ── helpers ──────────────────────────────────────────────────────────────────

function buildFiveNodeGraph(): MycNetwork {
  const net = new MycNetwork();
  net.addNode("A", { label: "root", kind: "concept" });
  net.addNode("B", { label: "branch-b", kind: "concept" });
  net.addNode("C", { label: "branch-c", kind: "concept" });
  net.addNode("D", { label: "leaf-d", kind: "detail" });
  net.addNode("E", { label: "leaf-e", kind: "detail" });
  // A → B (weight 0.9)
  // A → C (weight 0.5)
  // B → D (weight 0.8)
  // C → D (weight 0.9)
  // D → E (weight 0.7)
  net.connect("A", "B", 0.9, "knowledge");
  net.connect("A", "C", 0.5, "knowledge");
  net.connect("B", "D", 0.8, "knowledge");
  net.connect("C", "D", 0.9, "knowledge");
  net.connect("D", "E", 0.7, "knowledge");
  return net;
}

// ── test_propagate ────────────────────────────────────────────────────────────

describe("test_propagate", () => {
  it("start node receives the initial signal strength", () => {
    const net = buildFiveNodeGraph();
    const result = net.propagate("A", { strength: 1.0, decay: 0.85, type: "knowledge" });
    expect(result.get("A")).toBeCloseTo(1.0);
  });

  it("signal weakens with each hop", () => {
    const net = buildFiveNodeGraph();
    const result = net.propagate("A", { strength: 1.0, decay: 0.85, type: "knowledge" });
    // A=1.0  B=1.0*0.9*0.85=0.765  D via B = 0.765*0.8*0.85≈0.5202  E≈0.5202*0.7*0.85≈0.3095
    const a = result.get("A")!;
    const b = result.get("B")!;
    const d = result.get("D")!;
    const e = result.get("E")!;
    expect(b).toBeLessThan(a);
    expect(d).toBeLessThan(b);
    expect(e).toBeLessThan(d);
  });

  it("all reached nodes have strength > 0.01", () => {
    const net = buildFiveNodeGraph();
    const result = net.propagate("A", { strength: 1.0, decay: 0.85, type: "knowledge" });
    for (const [, v] of result) {
      expect(v).toBeGreaterThan(0.01);
    }
  });

  it("nodes not reachable from start are absent", () => {
    const net = buildFiveNodeGraph();
    // add an isolated node
    net.addNode("Z", { label: "isolated" });
    const result = net.propagate("A", { strength: 1.0, decay: 0.85, type: "knowledge" });
    expect(result.has("Z")).toBe(false);
  });

  it("stops propagating when strength drops below 0.01", () => {
    const net = new MycNetwork();
    // long chain: each hop strength *= 0.2 * 0.5 = 0.1  → after 2 hops: 0.01 → stops
    net.addNode("n0", {});
    net.addNode("n1", {});
    net.addNode("n2", {});
    net.addNode("n3", {});
    net.connect("n0", "n1", 0.2, "test");
    net.connect("n1", "n2", 0.2, "test");
    net.connect("n2", "n3", 0.2, "test");
    const result = net.propagate("n0", { strength: 1.0, decay: 0.5, type: "test" });
    // n1 = 1.0 * 0.2 * 0.5 = 0.1  n2 = 0.1 * 0.2 * 0.5 = 0.01  → not above 0.01, stop
    expect(result.has("n3")).toBe(false);
  });
});

// ── test_query ────────────────────────────────────────────────────────────────

describe("test_query", () => {
  it("matches by node id substring (case-insensitive)", () => {
    const net = buildFiveNodeGraph();
    const results = net.query("leaf");
    const ids = results.map((n) => n.id);
    expect(ids).not.toContain("A");
    expect(ids).not.toContain("B");
    expect(ids).not.toContain("C");
  });

  it("matches by data value substring", () => {
    const net = buildFiveNodeGraph();
    const results = net.query("concept");
    const ids = results.map((n) => n.id);
    expect(ids).toContain("A");
    expect(ids).toContain("B");
    expect(ids).toContain("C");
    expect(ids).not.toContain("D");
    expect(ids).not.toContain("E");
  });

  it("returns empty array when no match", () => {
    const net = buildFiveNodeGraph();
    expect(net.query("zzznomatch")).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    const net = buildFiveNodeGraph();
    expect(net.query("CONCEPT")).toHaveLength(net.query("concept").length);
  });
});

// ── test_shortest_path ────────────────────────────────────────────────────────

describe("test_shortest_path", () => {
  it("returns direct path on a simple chain", () => {
    const net = new MycNetwork();
    net.addNode("X", {});
    net.addNode("Y", {});
    net.addNode("Z", {});
    net.connect("X", "Y", 1.0, "k");
    net.connect("Y", "Z", 1.0, "k");
    expect(net.shortestPath("X", "Z")).toEqual(["X", "Y", "Z"]);
  });

  it("prefers higher-weight edge (lower cost)", () => {
    const net = new MycNetwork();
    // A→B→D  weights 0.9, 0.8  cost = 1/0.9 + 1/0.8 ≈ 2.36
    // A→C→D  weights 0.5, 0.9  cost = 1/0.5 + 1/0.9 ≈ 3.11
    net.addNode("A", {});
    net.addNode("B", {});
    net.addNode("C", {});
    net.addNode("D", {});
    net.connect("A", "B", 0.9, "k");
    net.connect("A", "C", 0.5, "k");
    net.connect("B", "D", 0.8, "k");
    net.connect("C", "D", 0.9, "k");
    const p = net.shortestPath("A", "D");
    expect(p[0]).toBe("A");
    expect(p[p.length - 1]).toBe("D");
    expect(p).toContain("B"); // preferred route through B
  });

  it("returns [] when no path exists", () => {
    const net = new MycNetwork();
    net.addNode("A", {});
    net.addNode("B", {});
    expect(net.shortestPath("A", "B")).toEqual([]);
  });

  it("returns [node] when from === to", () => {
    const net = buildFiveNodeGraph();
    expect(net.shortestPath("A", "A")).toEqual(["A"]);
  });

  it("returns [] for unknown nodes", () => {
    const net = buildFiveNodeGraph();
    expect(net.shortestPath("A", "MISSING")).toEqual([]);
  });
});

// ── test_persistence ──────────────────────────────────────────────────────────

describe("test_persistence", () => {
  it("round-trips nodes and edges through save/load", () => {
    const net = buildFiveNodeGraph();
    const tmpFile = path.join(os.tmpdir(), `myc-test-${Date.now()}.json`);
    try {
      net.save(tmpFile);
      const net2 = new MycNetwork();
      net2.load(tmpFile);

      // nodes
      expect(net2.getAllNodes()).toHaveLength(5);
      const nodeA = net2.getNode("A");
      expect(nodeA).toBeDefined();
      expect(nodeA!.data.label).toBe("root");

      // edges
      expect(net2.getAllEdges()).toHaveLength(5);

      // propagation still works after load
      const result = net2.propagate("A", { strength: 1.0, decay: 0.85, type: "knowledge" });
      expect(result.has("E")).toBe(true);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it("connections array is preserved after load", () => {
    const net = buildFiveNodeGraph();
    const tmpFile = path.join(os.tmpdir(), `myc-test2-${Date.now()}.json`);
    try {
      net.save(tmpFile);
      const net2 = new MycNetwork();
      net2.load(tmpFile);
      const nodeA = net2.getNode("A");
      expect(nodeA!.connections).toContain("B");
      expect(nodeA!.connections).toContain("C");
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
