'use client';

import { Editor } from '@tiptap/react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  label: string;
  title: string;
}

function ToolbarButton({ onClick, isActive, label, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-2 rounded font-medium text-sm transition-colors ${
        isActive
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        label="B"
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        label="I"
        title="Italic"
      />

      {/* Divider */}
      <div className="w-px bg-gray-300" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        label="H1"
        title="Heading 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        label="H2"
        title="Heading 2"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        label="H3"
        title="Heading 3"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        label="¶"
        title="Paragraph"
      />

      {/* Divider */}
      <div className="w-px bg-gray-300" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        label="•"
        title="Bullet List"
      />

      {/* Divider */}
      <div className="w-px bg-gray-300" />

      {/* Code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        label="<>"
        title="Inline Code"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        label="```"
        title="Code Block"
      />

      {/* Divider */}
      <div className="w-px bg-gray-300" />

      {/* Horizontal rule */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        isActive={false}
        label="—"
        title="Horizontal Rule"
      />
    </div>
  );
}
