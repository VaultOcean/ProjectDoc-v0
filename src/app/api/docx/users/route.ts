import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/docx/users?companyId=...
 * List users in a company (admin+ only)
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }

  // Verify user is admin
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser || companyUser.role.level > 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await db.companyUser.findMany({
    where: { companyId },
    include: {
      user: { select: { email: true, displayName: true, handle: true } },
      role: { select: { name: true, level: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/docx/users
 * Invite a new user to a company (admin+ only)
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    companyId: string;
    email: string;
    roleId: string;
  };

  // Verify user is admin
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: body.companyId, userId: user.id } },
    include: { role: true },
  });

  if (!companyUser || companyUser.role.level > 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Verify role exists and is not higher than inviter's role
  const role = await db.role.findUnique({ where: { id: body.roleId } });
  if (!role || role.level < companyUser.role.level) {
    return NextResponse.json(
      { error: "Invalid role or insufficient permissions" },
      { status: 400 }
    );
  }

  // Check if user already exists in company
  const existingUser = await db.user.findUnique({ where: { email: body.email } });

  if (existingUser) {
    // Check if already in company
    const alreadyInCompany = await db.companyUser.findUnique({
      where: {
        companyId_userId: { companyId: body.companyId, userId: existingUser.id },
      },
    });

    if (alreadyInCompany) {
      return NextResponse.json(
        { error: "User already in company" },
        { status: 409 }
      );
    }

    // Add existing user to company
    const newCompanyUser = await db.companyUser.create({
      data: {
        companyId: body.companyId,
        userId: existingUser.id,
        roleId: body.roleId,
        status: "active",
      },
      include: { user: true, role: true },
    });

    return NextResponse.json({ newCompanyUser }, { status: 201 });
  }

  // User doesn't exist yet — create invite
  const inviteToken = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // For now, just return the invite info
  // In production, you'd send an email with the invite link
  return NextResponse.json(
    {
      invite: {
        email: body.email,
        inviteToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        inviteUrl: `https://vaultocean.com/docx/invite/${inviteToken}`,
      },
      message: "Invite created. User should receive email at " + body.email,
    },
    { status: 201 }
  );
}
