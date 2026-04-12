import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notes",
  description: "A simple note-taking app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-gray-50 antialiased`}
      >
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-900 transition-colors hover:text-gray-600"
            >
              Notes
            </Link>
            <nav aria-label="Account" className="flex items-center gap-4 text-sm">
              {session ? (
                <>
                  <span className="text-gray-500">{session.user.email}</span>
                  <LogoutButton />
                </>
              ) : (
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
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
