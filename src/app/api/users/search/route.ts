import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkVaultOceanAdmin } from "@/lib/vault-ocean";

/**
 * GET /api/users/search?email=...
 * Search for users by email (superadmin only)
 */
export async function GET(req: Request) {
  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const handleParam = url.searchParams.get("handle");

  if (!email && !handleParam) {
    return NextResponse.json({ error: "email or handle required" }, { status: 400 });
  }

  let where;
  if (email) {
    where = { email: { contains: email, mode: "insensitive" as const } };
  } else if (handleParam) {
    where = { handle: { contains: handleParam, mode: "insensitive" as const } };
  } else {
    return NextResponse.json({ error: "email or handle required" }, { status: 400 });
  }

  const user = await db.user.findFirst({
    where,
    select: {
      id: true,
      email: true,
      handle: true,
      displayName: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
