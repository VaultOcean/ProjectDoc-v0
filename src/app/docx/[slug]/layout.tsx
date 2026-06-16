import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DocxLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    const { slug } = await params;
    redirect(`/login?next=/docx/${slug}`);
  }

  const { slug } = await params;

  // Get company
  const company = await db.company.findUnique({
    where: { slug },
  });

  if (!company) {
    redirect("/docx/no-access");
  }

  // Check if user has access to this company
  const companyUser = await db.companyUser.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
  });

  if (!companyUser || companyUser.status !== "active") {
    redirect("/docx/no-access");
  }

  return <>{children}</>;
}
