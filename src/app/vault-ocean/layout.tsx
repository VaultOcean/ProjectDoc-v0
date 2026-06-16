import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { checkVaultOceanAdmin } from "@/lib/vault-ocean";

export default async function VaultOceanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/vault-ocean");
  }

  const isAdmin = await checkVaultOceanAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
