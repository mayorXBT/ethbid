import { heartbeat } from "@/lib/store";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const jar = await cookies();
    let id = jar.get("lb_vid")?.value;
    const isNew = !id;
    if (!id) id = crypto.randomUUID();
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
