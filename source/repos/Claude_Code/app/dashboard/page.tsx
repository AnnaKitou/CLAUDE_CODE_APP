import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <p className="mt-2 text-gray-600">Welcome, {session.user.email}</p>
        </div>
        <Link
          href="/notes/new"
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
        >
          New Note
        </Link>
      </div>
    </main>
  );
}
