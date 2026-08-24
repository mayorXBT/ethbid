import { limiter, limitResponse } from "@/lib/rate-limit";
import { clientIp, UUID_RE } from "@/lib/request";
import { heartbeat } from "@/lib/store";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const gate = limiter().hit(`presence:${clientIp(req)}`, { max: 10, windowMs: 60_000 });
  if (!gate.ok) return limitResponse(gate.retryAfterSec);

  try {
    const jar = await cookies();
    let id = jar.get("lb_vid")?.value;
    if (!id || !UUID_RE.test(id)) id = crypto.randomUUID();
    const isNew = !jar.get("lb_vid")?.value || !UUID_RE.test(jar.get("lb_vid")?.value ?? "");
    const stats = await heartbeat(id, isNew);
    const res = NextResponse.json(stats);
    if (isNew) {
      res.cookies.set("lb_vid", id, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  } catch {
    return NextResponse.json({
      online: 0,
      visitors: 0,
      listings: 0,
      volumeUsd: 0,
      clicks: 0,
    });
  }
}
