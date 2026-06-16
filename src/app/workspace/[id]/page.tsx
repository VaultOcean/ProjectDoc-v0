import { notFound, redirect } from "next/navigation";
import { DocEditor } from "@/components/doc-editor";
import { getCurrentUser } from "@/lib/auth";
import { getDocForEdit } from "@/lib/queries";

export default async function EditDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/workspace");

  const doc = await getDocForEdit(user.id, id);
  if (!doc) notFound();

  return (
    <DocEditor
      authorHandle={user.handle}
      initial={{
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        content: doc.content,
        visibility: doc.visibility,
        slug: doc.slug,
      }}
    />
  );
}
