import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ryzansteinUrl = process.env.RYZANSTEIN_API_URL || "http://localhost:24000";

    const healthChecks = {
      app: "healthy",
      ryzanstein: "checking",
      qdrant: "checking",
    };

    // Check Ryzanstein
    try {
      const ryzResponse = await fetch(`${ryzansteinUrl}/negative-space/lunar-phase`, {
        signal: AbortSignal.timeout(2000),
      });
      healthChecks.ryzanstein = ryzResponse.ok ? "healthy" : "unhealthy";
    } catch {
      healthChecks.ryzanstein = "unreachable";
    }

    // Check Qdrant
    const qdrantUrl = process.env.QDRANT_URL || "http://localhost:24333";
    try {
      const qdrantResponse = await fetch(`${qdrantUrl}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      healthChecks.qdrant = qdrantResponse.ok ? "healthy" : "unhealthy";
    } catch {
      healthChecks.qdrant = "unreachable";
    }

    const allHealthy = Object.values(healthChecks).every((s) => s === "healthy");
    return NextResponse.json(healthChecks, { status: allHealthy ? 200 : 503 });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Health check failed", details: String(error) },
      { status: 500 }
    );
  }
}
