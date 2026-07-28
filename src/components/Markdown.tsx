import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-primary-600 prose-code:bg-primary-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-primary-300">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold text-gray-900 mb-1 mt-2">{children}</h3>,
          code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
            inline ? (
              <code className="text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded text-xs">{children}</code>
            ) : (
              <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 overflow-x-auto text-xs mb-2">
                <code>{children}</code>
              </pre>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
