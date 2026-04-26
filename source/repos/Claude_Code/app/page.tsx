import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex grow items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">NextNotes</h1>
        <p className="mt-4 text-lg text-gray-600">
          A simple, clean note-taking app to capture your thoughts
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
