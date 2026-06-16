import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkVaultOceanAdmin } from "@/lib/vault-ocean";

/**
 * GET /api/companies
 * List all companies (superadmin only)
 */
export async function GET() {
  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const companies = await db.company.findMany({
    include: {
      _count: { select: { users: true, subscriptions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ companies });
}

/**
 * POST /api/companies
 * Create a new company (superadmin only)
 */
export async function POST(req: Request) {
  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json() as {
    name: string;
    displayName?: string;
    primaryProduct?: "docx" | "pentx" | "filex" | "assetxocean";
    superadminEmail?: string; // email to invite as first superadmin
  };

  if (!body.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  // Check if company name already exists
  const existing = await db.company.findUnique({
    where: { name: body.name },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Company name already exists" },
      { status: 409 }
    );
  }

  // Generate slug from company name
  const slug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Create company
  const company = await db.company.create({
    data: {
      name: body.name,
      displayName: body.displayName || body.name,
      slug,
      primaryProduct: body.primaryProduct || "docx",
      status: "onboarding",
      tier: "starter",
    },
  });

  // If superadminEmail provided, create invite
  let invite = null;
  if (body.superadminEmail) {
    const inviteToken = await generateInviteToken();
    const existingUser = await db.user.findUnique({
      where: { email: body.superadminEmail },
    });

    // If user already exists, create CompanyUser directly as superadmin
    if (existingUser) {
      const superadminRole = await db.role.findUnique({
        where: { name: "superadmin" },
      });

      await db.companyUser.create({
        data: {
          companyId: company.id,
          userId: existingUser.id,
          roleId: superadminRole!.id,
          status: "active",
        },
      });
    } else {
      // Create invite for new user
      const superadminRole = await db.role.findUnique({
        where: { name: "superadmin" },
      });

      // We'll create a placeholder CompanyUser with pending_invite status
      // The user will be created when they accept the invite
      invite = {
        email: body.superadminEmail,
        inviteToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }
  }

  // Subscribe company to primary product
  const product = await db.product.findUnique({
    where: { slug: body.primaryProduct || "docx" },
  });

  if (product) {
    await db.productSubscription.create({
      data: {
        companyId: company.id,
        productId: product.id,
        plan: "starter",
        status: "active",
        licensedSeats: 5,
      },
    });
  }

  return NextResponse.json(
    { company, invite },
    { status: 201 }
  );
}

/**
 * Generate a secure invite token
 */
async function generateInviteToken(): Promise<string> {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
