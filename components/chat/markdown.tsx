'use client';

import { memo } from 'react';
import { ReactMarkdown, ReactMarkdownProps } from 'react-markdown';

export const MemoizedReactMarkdown: React.FC<ReactMarkdownProps> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);
