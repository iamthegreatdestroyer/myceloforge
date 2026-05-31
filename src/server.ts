import express, { Request, Response } from "express";
import { MycNetwork, Signal } from "./MycNetwork";

const app = express();
app.use(express.json());

const network = new MycNetwork();

// GET /nodes — list all nodes
app.get("/nodes", (_req: Request, res: Response) => {
  res.json(network.getAllNodes());
});

// POST /nodes — addNode({ id, data })
app.post("/nodes", (req: Request, res: Response) => {
  const { id, data } = req.body as { id?: string; data?: Record<string, unknown> };
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "id (string) is required" });
    return;
  }
  network.addNode(id, data ?? {});
  res.status(201).json({ id, data: data ?? {} });
});

// POST /connect — connect({ from, to, weight, type })
app.post("/connect", (req: Request, res: Response) => {
  const { from, to, weight, type } = req.body as {
    from?: string;
    to?: string;
    weight?: number;
    type?: string;
  };
  if (!from || !to || weight === undefined || !type) {
    res.status(400).json({ error: "from, to, weight, type are required" });
    return;
  }
  try {
    network.connect(from, to, weight, type);
    res.json({ from, to, weight, type });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// POST /propagate — propagate({ startNode, signal }) → object of node:strength
app.post("/propagate", (req: Request, res: Response) => {
  const { startNode, signal } = req.body as { startNode?: string; signal?: Signal };
  if (!startNode || !signal) {
    res.status(400).json({ error: "startNode and signal are required" });
    return;
  }
  try {
    const result = network.propagate(startNode, signal);
    res.json(Object.fromEntries(result));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// GET /path/:from/:to — shortestPath
app.get("/path/:from/:to", (req: Request, res: Response) => {
  const { from, to } = req.params;
  const path = network.shortestPath(from, to);
  res.json(path);
});

export { app, network };

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`MycNetwork API listening on port ${PORT}`);
  });
}
