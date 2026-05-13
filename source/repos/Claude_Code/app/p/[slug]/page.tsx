import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoteByPublicSlug } from "@/lib/notes";
import { RenderTiptapContent } from "@/components/RenderTiptapContent";
import { formatRelativeTime } from "@/lib/format";
import { authClient } from "@/lib/auth";

export default async function PublicNotePage({ params }: { params: { slug: string } }) {
  const note = await getNoteByPublicSlug(params.slug);

  if (!note) {
    notFound();
  }

  const contentJson = typeof note.contentJson === "string" ? JSON.parse(note.contentJson) : note.contentJson;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
        ← Back to Home
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{note.title}</h1>
        <p className="text-sm text-gray-600">Updated {formatRelativeTime(note.updatedAt)}</p>
      </div>

      <div className="prose prose-sm max-w-none">
        <RenderTiptapContent content={contentJson} />
      </div>
    </main>
  );
}
