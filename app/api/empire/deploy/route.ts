import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ryzansteinUrl = process.env.RYZANSTEIN_API_URL || "http://localhost:24000";
    const response = await fetch(`${ryzansteinUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "ryzanstein-bitnet-7b",
        messages: [{ role: "user", content: body.seed }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Ryzanstein service unavailable", status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Empire deploy error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
