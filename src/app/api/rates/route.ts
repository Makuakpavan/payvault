import { NextResponse } from "next/server";
import { FALLBACK_RATES } from "@/lib/money";

const liveUrl = "https://open.er-api.com/v6/latest/USD";

async function fetchLiveRates() {
  try {
    const res = await fetch(liveUrl, { cache: "no-store" });
    if (!res.ok) return FALLBACK_RATES;
    const json = await res.json();
    const rates = json?.rates ?? FALLBACK_RATES;
    return { ...FALLBACK_RATES, ...rates };
  } catch {
    return FALLBACK_RATES;
  }
}

export async function GET() {
  const rates = await fetchLiveRates();
  return NextResponse.json({ base: "USD", rates, source: "live-or-fallback" });
}
