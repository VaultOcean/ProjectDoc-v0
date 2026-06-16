import { db } from "@/lib/db";

async function setupAdmin() {
  const email = "sakthigsundar@gmail.com";

  try {
    // 1. Create or find user
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          handle: "sakthi",
          displayName: "Sakthi Sundar",
          passwordHash: "temp-hash", // TODO: Set real password via login
        },
      });
      console.log("✓ Created user:", email);
    } else {
      console.log("✓ User already exists:", email);
    }

    // 2. Grant VaultOcean admin access
    const vaultAccess = await db.vaultOceanAccess.upsert({
      where: { userId: user.id },
      update: {
        isAdmin: true,
        canAccessAllModules: true,
        canManageCompanies: true,
        canManageBilling: true,
      },
      create: {
        userId: user.id,
        isAdmin: true,
        canAccessAllModules: true,
        canManageCompanies: true,
        canManageBilling: true,
      },
    });
    console.log("✓ Granted VaultOcean admin access");

    // 3. Create test company
    let company = await db.company.findUnique({
      where: { slug: "test-company" },
    });

    if (!company) {
      company = await db.company.create({
        data: {
          name: "Test Company",
          displayName: "Test Company",
          slug: "test-company",
          primaryProduct: "docx",
          tier: "starter",
        },
      });
      console.log("✓ Created test company");
    }

    // 4. Get superadmin role
    const superadminRole = await db.role.findFirst({
      where: { level: 0 },
    });

    if (!superadminRole) {
      console.error("✗ Superadmin role not found. Run: npx prisma db seed");
      process.exit(1);
    }

    // 5. Link user to company as superadmin
    const companyUser = await db.companyUser.upsert({
      where: {
        companyId_userId: { companyId: company.id, userId: user.id },
      },
      update: { status: "active" },
      create: {
        companyId: company.id,
        userId: user.id,
        roleId: superadminRole.id,
        status: "active",
      },
    });
    console.log("✓ Linked user to company as superadmin");

    console.log("\n✅ Setup complete!");
    console.log("\nYou can now:");
    console.log("  1. Log in at http://localhost:3000 with", email);
    console.log("  2. Access VaultOcean admin panel at /vault-ocean/admin/access");
    console.log("  3. Manage Docx at /docx/test-company/dashboard");
  } catch (error) {
    console.error("✗ Setup failed:", error);
    process.exit(1);
  }
}

setupAdmin().then(() => process.exit(0));
