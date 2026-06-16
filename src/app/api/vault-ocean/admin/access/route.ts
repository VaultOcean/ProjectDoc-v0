import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkVaultOceanAdmin } from "@/lib/vault-ocean";

/**
 * GET /api/vault-ocean/admin/access
 * List all users with VaultOcean access (superadmin only)
 */
export async function GET() {
  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await db.vaultOceanAccess.findMany({
    include: {
      user: { select: { id: true, email: true, handle: true, displayName: true } },
    },
    orderBy: { grantedAt: "desc" },
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/vault-ocean/admin/access
 * Grant VaultOcean access to a user (superadmin only)
 */
export async function POST(req: Request) {
  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json() as {
    userId: string;
    isAdmin?: boolean;
    canAccessAllModules?: boolean;
    canManageCompanies?: boolean;
    canManageBilling?: boolean;
  };

  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Verify user exists
  const user = await db.user.findUnique({ where: { id: body.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const access = await db.vaultOceanAccess.upsert({
    where: { userId: body.userId },
    create: {
      userId: body.userId,
      isAdmin: body.isAdmin ?? false,
      canAccessAllModules: body.canAccessAllModules ?? false,
      canManageCompanies: body.canManageCompanies ?? false,
      canManageBilling: body.canManageBilling ?? false,
    },
    update: {
      isAdmin: body.isAdmin ?? undefined,
      canAccessAllModules: body.canAccessAllModules ?? undefined,
      canManageCompanies: body.canManageCompanies ?? undefined,
      canManageBilling: body.canManageBilling ?? undefined,
      revokedAt: null, // re-enable if previously revoked
    },
  });

  return NextResponse.json({ access }, { status: 201 });
}

/**
 * DELETE /api/vault-ocean/admin/access/:userId
 * Revoke VaultOcean access (superadmin only)
 */
export async function DELETE(req: Request) {
  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Extract userId from URL
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await db.vaultOceanAccess.delete({
    where: { userId },
  });

  return NextResponse.json({ ok: true });
}
