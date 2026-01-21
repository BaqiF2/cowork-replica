/**
 * Markdown renderer helper for chat messages.
 *
 * Provides a simple built-in Markdown renderer for common formatting:
 * - Headers (# ## ###)
 * - Bold (**text**) and Italic (*text*)
 * - Code blocks (```lang ... ```) with syntax highlighting styles
 * - Inline code (`code`)
 * - Lists (- item)
 * - Links [text](url)
 *
 * This implementation works in both browser and Node.js environments
 * without external dependencies.
 */

import { getEnv, getEnvInt } from '../../utils/env';

export type MarkdownRenderer = (content: string) => string;

const MAX_RENDER_LENGTH = getEnvInt('COWORK_CHAT_MARKDOWN_MAX_LENGTH', 12000);
const TRUNCATION_SUFFIX = getEnv('COWORK_CHAT_MARKDOWN_TRUNCATION_SUFFIX', '...');

let cachedRenderer: MarkdownRenderer | null = null;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const truncateContent = (value: string): string => {
  if (value.length <= MAX_RENDER_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_RENDER_LENGTH)}${TRUNCATION_SUFFIX}`;
};

/**
 * Simple built-in Markdown renderer
 * Handles common Markdown syntax without external dependencies
 */
const createBuiltinRenderer = (): MarkdownRenderer => (content: string) => {
  const truncated = truncateContent(content);
  let result = escapeHtml(truncated);

  // Code blocks: ```lang\ncode\n``` -> <pre><code class="language-lang">code</code></pre>
  result = result.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : '';
      return `<pre style="background-color: var(--bg-tertiary); padding: var(--spacing-sm); border-radius: var(--border-radius-md); overflow-x: auto;"><code${langClass}>${code.trim()}</code></pre>`;
    }
  );

  // Inline code: `code` -> <code>code</code>
  result = result.replace(
    /`([^`\n]+)`/g,
    '<code style="background-color: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;">$1</code>'
  );

  // Headers: # ## ### etc.
  result = result.replace(
    /^### (.+)$/gm,
    '<h3 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin: var(--spacing-md) 0 var(--spacing-sm) 0;">$1</h3>'
  );
  result = result.replace(
    /^## (.+)$/gm,
    '<h2 style="font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: var(--spacing-md) 0 var(--spacing-sm) 0;">$1</h2>'
  );
  result = result.replace(
    /^# (.+)$/gm,
    '<h1 style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); margin: var(--spacing-md) 0 var(--spacing-sm) 0;">$1</h1>'
  );

  // Bold: **text** -> <strong>text</strong>
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* -> <em>text</em>
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links: [text](url) -> <a href="url">text</a>
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary);">$1</a>'
  );

  // Unordered lists: - item -> <li>item</li>
  // Group consecutive list items
  const lines = result.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const listMatch = line.match(/^- (.+)$/);
    if (listMatch) {
      if (!inList) {
        processedLines.push('<ul style="margin: var(--spacing-sm) 0; padding-left: var(--spacing-lg);">');
        inList = true;
      }
      processedLines.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  if (inList) {
    processedLines.push('</ul>');
  }

  result = processedLines.join('\n');

  // Convert remaining newlines to <br /> (but not inside pre/code blocks)
  // Simple approach: just replace double newlines with paragraph breaks
  result = result.replace(/\n\n/g, '</p><p style="margin: var(--spacing-sm) 0;">');
  result = result.replace(/\n/g, '<br />');

  // Wrap in paragraph if not starting with block element
  if (!result.startsWith('<h') && !result.startsWith('<pre') && !result.startsWith('<ul')) {
    result = `<p style="margin: var(--spacing-sm) 0;">${result}</p>`;
  }

  return result;
};

export const getMarkdownRenderer = (): MarkdownRenderer => {
  if (cachedRenderer) {
    return cachedRenderer;
  }

  cachedRenderer = createBuiltinRenderer();
  return cachedRenderer;
};
