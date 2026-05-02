'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  language: string;
  value: string;
}

export const CodeBlock = ({ language, value }: Props) => {
  return (
    <SyntaxHighlighter
      style={coldarkDark}
      language={language}
      PreTag="div"
    >
      {value}
    </SyntaxHighlighter>
  );
};
