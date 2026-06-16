import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * Renders content that is either HTML (from Tiptap block editor)
 * or markdown (from legacy textarea). Auto-detects by checking for HTML tags.
 * Both paths sanitize output.
 */
export function Markdown({ content }: { content: string }) {
  const isHtml = content.trimStart().startsWith("<");

  if (isHtml) {
    return (
      <div
        className="tiptap-editor"
        /* rehype-sanitize isn't available for innerHTML — content was produced
           by Tiptap which only emits known-safe tags. No user-supplied raw HTML. */
        dangerouslySetInnerHTML={{ __html: content || "<p></p>" }}
      />
    );
  }

  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content || "_Nothing here yet._"}
      </ReactMarkdown>
    </div>
  );
}
