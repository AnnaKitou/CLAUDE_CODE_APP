import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return new Response(JSON.stringify(null), { status: 200 });
  }

  return new Response(JSON.stringify(session), { status: 200 });
}
