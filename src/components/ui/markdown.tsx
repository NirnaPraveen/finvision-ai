import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  children: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none 
      prose-p:leading-relaxed prose-p:text-slate-500 dark:prose-p:text-slate-400 
      prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white
      prose-strong:text-brand-600 dark:prose-strong:text-brand-400 prose-strong:font-black
      prose-ul:list-disc prose-ul:pl-4 prose-li:mb-1">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
};
