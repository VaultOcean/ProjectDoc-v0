import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Check if user has VaultOcean superadmin access
 * Only the founder (me) should have this
 */
export async function checkVaultOceanAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const access = await db.vaultOceanAccess.findUnique({
    where: { userId: user.id },
  });

  return access?.isAdmin === true;
}

/**
 * Check if user can access all VaultOcean modules
 * Either they're an admin, or we explicitly granted them access
 */
export async function canAccessVaultOcean(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const access = await db.vaultOceanAccess.findUnique({
    where: { userId: user.id },
  });

  return access?.isAdmin === true || access?.canAccessAllModules === true;
}

/**
 * Get user's VaultOcean access level
 */
export async function getVaultOceanAccess() {
  const user = await getCurrentUser();
  if (!user) return null;

  return await db.vaultOceanAccess.findUnique({
    where: { userId: user.id },
  });
}

/**
 * Grant VaultOcean access to a user (superadmin only)
 */
export async function grantVaultOceanAccess(
  userId: string,
  options: {
    isAdmin?: boolean;
    canAccessAllModules?: boolean;
    canManageCompanies?: boolean;
    canManageBilling?: boolean;
  }
) {
  // Only allow if called by superadmin
  const caller = await getCurrentUser();
  if (!caller) throw new Error("Unauthorized");

  const callerAccess = await db.vaultOceanAccess.findUnique({
    where: { userId: caller.id },
  });

  if (!callerAccess?.isAdmin) {
    throw new Error("Only VaultOcean superadmin can grant access");
  }

  return await db.vaultOceanAccess.upsert({
    where: { userId },
    create: {
      userId,
      isAdmin: options.isAdmin ?? false,
      canAccessAllModules: options.canAccessAllModules ?? false,
      canManageCompanies: options.canManageCompanies ?? false,
      canManageBilling: options.canManageBilling ?? false,
    },
    update: {
      isAdmin: options.isAdmin ?? undefined,
      canAccessAllModules: options.canAccessAllModules ?? undefined,
      canManageCompanies: options.canManageCompanies ?? undefined,
      canManageBilling: options.canManageBilling ?? undefined,
    },
  });
}

/**
 * Resolve which product/tool modules a user may see in the nav.
 * - Superadmin / all-modules grant → every tool.
 * - Otherwise, modules are unlocked per entitlement:
 *     • Docx → the user belongs to at least one company (CompanyUser).
 * A brand-new user with no grants gets an empty toolset (empty canvas).
 * Returns the set of tool hrefs that should be visible.
 */
export async function getEntitledTools(userId: string): Promise<string[]> {
  const access = await db.vaultOceanAccess.findUnique({ where: { userId } });
  if (access?.isAdmin || access?.canAccessAllModules) {
    return [
      "/terminal",
      "/tools",
      "/assets",
      "/docx",
      "/payloads",
      "/cheatsheets",
      "/programs",
    ];
  }

  const tools: string[] = [];

  // Docx is unlocked by company membership (admin adds the user to a company).
  const docxMembership = await db.companyUser.findFirst({
    where: { userId, status: "active" },
    select: { id: true },
  });
  if (docxMembership) tools.push("/docx");

  return tools;
}

/**
 * Revoke VaultOcean access from a user
 */
export async function revokeVaultOceanAccess(userId: string) {
  const caller = await getCurrentUser();
  if (!caller) throw new Error("Unauthorized");

  const callerAccess = await db.vaultOceanAccess.findUnique({
    where: { userId: caller.id },
  });

  if (!callerAccess?.isAdmin) {
    throw new Error("Only VaultOcean superadmin can revoke access");
  }

  return await db.vaultOceanAccess.delete({
    where: { userId },
  });
}
