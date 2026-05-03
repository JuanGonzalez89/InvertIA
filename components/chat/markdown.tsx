'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Options } from 'react-markdown';

export const MemoizedReactMarkdown: React.FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);
