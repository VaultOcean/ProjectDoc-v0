import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DocxNoAccess() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0e] px-4">
      <div className="max-w-sm text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h1 className="text-2xl font-bold text-zinc-100">No Access</h1>
        <p className="mt-2 text-zinc-400">
          You don't have access to any Docx companies. Please contact your administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="text-sm text-tide hover:underline">
            Back home
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/logout" className="text-sm text-zinc-400 hover:text-zinc-200">
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
