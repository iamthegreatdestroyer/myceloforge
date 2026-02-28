import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ryzansteinUrl = process.env.RYZANSTEIN_API_URL || "http://localhost:24000";
    const response = await fetch(`${ryzansteinUrl}/negative-space/lunar-phase`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Negative-space service unavailable", status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Lunar phase fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", phase: "Waxing Gibbous" },
      { status: 500 }
    );
  }
}
