"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        authClient.signOut({
          fetchOptions: { onSuccess: () => router.push("/") },
        })
      }
      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
    >
      Logout
    </button>
  );
}
