"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import LogoutButton from "./LogoutButton";

export default function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-900 transition-colors hover:text-gray-600"
        >
          NextNotes
        </Link>
        <nav aria-label="Account" className="flex items-center gap-4 text-sm">
          {!isPending && session ? (
            <>
              <span className="text-gray-500">{session.user.email}</span>
              <LogoutButton />
            </>
          ) : !isPending ? (
            <>
              <Link
                href="/login"
                className="text-gray-600 transition-colors hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gray-900 px-3 py-1.5 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Register
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
