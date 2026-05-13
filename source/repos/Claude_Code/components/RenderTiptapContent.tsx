import React from "react";

type TiptapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
};

type TiptapDoc = {
  type: "doc";
  content: TiptapNode[];
};

export function extractPlainText(doc: TiptapDoc | string): string {
  if (typeof doc === "string") {
    try {
      doc = JSON.parse(doc);
    } catch {
      return "";
    }
  }

  const extractFromNode = (node: TiptapNode): string => {
    if (node.text) return node.text;
    if (node.content) {
      return node.content.map(extractFromNode).join("");
    }
    return "";
  };

  return doc.content?.map(extractFromNode).join("").slice(0, 120) || "";
}

const RenderMark = ({ mark, children }: { mark: { type: string; attrs?: Record<string, any> }; children: React.ReactNode }) => {
  switch (mark.type) {
    case "strong":
      return <strong className="font-bold">{children}</strong>;
    case "em":
      return <em className="italic">{children}</em>;
    case "code":
      return <code className="bg-gray-100 rounded px-1.5 py-0.5 font-mono text-sm text-red-600">{children}</code>;
    default:
      return <>{children}</>;
  }
};

const RenderNode = ({ node }: { node: TiptapNode }): React.ReactNode => {
  const renderChildren = (nodes: TiptapNode[]) => {
    return nodes.map((child, idx) => <RenderNode key={idx} node={child} />);
  };

  const renderTextWithMarks = (text: string, marks?: Array<{ type: string; attrs?: Record<string, any> }>) => {
    if (!marks || marks.length === 0) return text;

    let element: React.ReactNode = text;
    for (const mark of marks) {
      element = <RenderMark key={mark.type} mark={mark}>{element}</RenderMark>;
    }
    return element;
  };

  switch (node.type) {
    case "doc":
      return <div>{node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}</div>;

    case "paragraph":
      return (
        <p className="text-gray-900 leading-relaxed mb-4">
          {node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}
        </p>
      );

    case "heading":
      const level = node.attrs?.level || 1;
      const headingClasses = {
        1: "text-3xl font-bold mb-4 mt-6",
        2: "text-2xl font-bold mb-3 mt-5",
        3: "text-xl font-bold mb-2 mt-4",
      }[level] || "text-lg font-bold mb-2 mt-3";

      return (
        <div className={`${headingClasses} text-gray-900`}>
          {node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}
        </div>
      );

    case "codeBlock":
      return (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4 font-mono text-sm">
          <code>{node.content?.map((child) => child.text || "").join("") || ""}</code>
        </pre>
      );

    case "bulletList":
      return (
        <ul className="list-disc list-inside mb-4 text-gray-900 space-y-1 ml-4">
          {node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal list-inside mb-4 text-gray-900 space-y-1 ml-4">
          {node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}
        </ol>
      );

    case "listItem":
      return (
        <li className="text-gray-900">
          {node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}
        </li>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 py-2 mb-4 text-gray-600 italic">
          {node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null}
        </blockquote>
      );

    case "horizontalRule":
      return <hr className="my-6 border-gray-200" />;

    case "text":
      return renderTextWithMarks(node.text || "", node.marks);

    default:
      return node.content?.map((child, idx) => <RenderNode key={idx} node={child} />) || null;
  }
};

export function RenderTiptapContent({ content }: { content: TiptapDoc | string }) {
  let doc: TiptapDoc;

  if (typeof content === "string") {
    try {
      doc = JSON.parse(content);
    } catch {
      return <p className="text-gray-500">Unable to load note content</p>;
    }
  } else {
    doc = content;
  }

  if (!doc.content || doc.content.length === 0) {
    return <p className="text-gray-400">No content</p>;
  }

  return <div className="prose prose-sm max-w-none text-gray-900">{renderChildren(doc.content)}</div>;
}

const renderChildren = (nodes: TiptapNode[]) => {
  return nodes.map((node, idx) => <RenderNode key={idx} node={node} />);
};
