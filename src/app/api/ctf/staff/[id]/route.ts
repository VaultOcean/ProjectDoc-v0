import { NextResponse } from "next/server";

/**
 * CHALLENGE TARGET — "ghost-in-the-params" (IDOR, web/medium).
 *
 * This is a deliberately vulnerable endpoint for the HackerOcean arena. It exposes
 * staff records by numeric id with NO authorization check (a classic IDOR). The
 * visitor's own id is 1337; enumerating downward to id 1 (the founder) leaks a
 * field that should never be returned. That field is the flag.
 *
 * Players solve it by actually doing the exploit:
 *   curl https://vaultocean.com/api/ctf/staff/1
 * It is intentionally vulnerable — that is the point of the challenge.
 */

const STAFF: Record<string, Record<string, string>> = {
  "1": { id: "1", handle: "founder", role: "owner", note: "rotate this before launch", secret: "VO{idor_climbs_to_id_one}" },
  "1337": { id: "1337", handle: "you", role: "recruit", note: "welcome to HackerOcean" },
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = STAFF[id];
  if (!record) {
    return NextResponse.json({ error: "no such staff id", hint: "ids are small integers" }, { status: 404 });
  }
  return NextResponse.json(record);
}
