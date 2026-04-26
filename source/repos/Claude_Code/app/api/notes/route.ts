import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNote } from "@/lib/notes";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { title, contentJson } = body;

    const note = await createNote(session.user.id, title, contentJson);

    return new Response(JSON.stringify(note), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
