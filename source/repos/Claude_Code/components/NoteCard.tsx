import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import { extractPlainText } from "@/components/RenderTiptapContent";

type Note = {
  id: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  updatedAt: string;
};

export function NoteCard({ note, showPublicBadge = true }: { note: Note; showPublicBadge?: boolean }) {
  const preview = extractPlainText(note.contentJson);
  const displayPreview = preview || "(empty note)";

  return (
    <Link href={`/notes/${note.id}/view`}>
      <div className="block p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer bg-white">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">{note.title}</h3>
          {showPublicBadge && note.isPublic && (
            <span className="shrink-0 inline-block bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Public
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{displayPreview}</p>
        <p className="text-xs text-gray-500">Updated {formatRelativeTime(note.updatedAt)}</p>
      </div>
    </Link>
  );
}
