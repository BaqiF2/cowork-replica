import { getEnv, getEnvInt } from '../../utils/env';

export type DiffLineType = 'context' | 'add' | 'remove';
export type DiffViewMode = 'unified' | 'split';
export type DiffAction = 'confirm' | 'cancel';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLine: number | null;
  newLine: number | null;
}

export interface DiffFoldItem {
  type: 'fold';
  id: string;
  count: number;
  lines: DiffLine[];
}

export interface DiffLineItem {
  type: 'line';
  line: DiffLine;
}

export type DiffDisplayItem = DiffFoldItem | DiffLineItem;

export interface DiffRow {
  left?: DiffLine;
  right?: DiffLine;
  type: 'context' | 'add' | 'remove' | 'modify' | 'fold';
  id: string;
}

export interface FileDiffConfig {
  contextLines: number;
  foldContext: number;
  foldThreshold: number;
  lineNumberStart: number;
  maxMatrixCells: number;
  trimTrailingNewline: boolean;
  fallbackLanguage: string;
  highlightMaxLength: number;
  actionTimestamp: boolean;
  pairWindow: number;
}

const CONTEXT_LINES = getEnvInt('COWORK_FILE_DIFF_CONTEXT_LINES', 3);
const FOLD_CONTEXT = getEnvInt('COWORK_FILE_DIFF_FOLD_CONTEXT', 2);
const FOLD_THRESHOLD = getEnvInt('COWORK_FILE_DIFF_FOLD_THRESHOLD', 6);
const LINE_NUMBER_START = getEnvInt('COWORK_FILE_DIFF_LINE_NUMBER_START', 1);
const MAX_MATRIX_CELLS = getEnvInt('COWORK_FILE_DIFF_MATRIX_CELLS', 40000);
const TRIM_TRAILING_NEWLINE =
  getEnv('COWORK_FILE_DIFF_TRIM_TRAILING_NEWLINE', 'true').toLowerCase() === 'true';
const FALLBACK_LANGUAGE = getEnv('COWORK_FILE_DIFF_FALLBACK_LANGUAGE', 'plaintext');
const HIGHLIGHT_MAX_LENGTH = getEnvInt('COWORK_FILE_DIFF_HIGHLIGHT_MAX_LENGTH', 2000);
const ACTION_TIMESTAMP =
  getEnv('COWORK_FILE_DIFF_ACTION_TIMESTAMP', 'true').toLowerCase() === 'true';
const PAIR_WINDOW = getEnvInt('COWORK_FILE_DIFF_PAIR_WINDOW', 1);

const FILE_EXTENSION_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  css: 'css',
  html: 'html',
};

export const getFileDiffConfig = (): FileDiffConfig => ({
  contextLines: CONTEXT_LINES,
  foldContext: FOLD_CONTEXT,
  foldThreshold: FOLD_THRESHOLD,
  lineNumberStart: LINE_NUMBER_START,
  maxMatrixCells: MAX_MATRIX_CELLS,
  trimTrailingNewline: TRIM_TRAILING_NEWLINE,
  fallbackLanguage: FALLBACK_LANGUAGE,
  highlightMaxLength: HIGHLIGHT_MAX_LENGTH,
  actionTimestamp: ACTION_TIMESTAMP,
  pairWindow: PAIR_WINDOW,
});

const splitLines = (value: string, config: FileDiffConfig): string[] => {
  const lines = value.split(/\r?\n/);
  if (config.trimTrailingNewline && lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const tryRequire = <T,>(moduleName: string): T | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(moduleName) as T;
  } catch {
    return null;
  }
};

type DiffModule = {
  diffLines?: (oldStr: string, newStr: string) => Array<{
    added?: boolean;
    removed?: boolean;
    value: string;
  }>;
};

const loadDiffModule = (): DiffModule | null => tryRequire<DiffModule>('diff');

type HighlightModule = {
  getLanguage?: (lang: string) => unknown;
  highlight?: (code: string, options: { language: string }) => { value: string };
  highlightAuto?: (code: string) => { value: string };
};

const loadHighlightModule = (): HighlightModule | null =>
  tryRequire<HighlightModule>('highlight.js');

const buildFallbackDiff = (
  originalLines: string[],
  modifiedLines: string[],
  config: FileDiffConfig
): DiffLine[] => {
  const lines: DiffLine[] = [];
  let oldLine = config.lineNumberStart;
  let newLine = config.lineNumberStart;

  const maxLength = Math.max(originalLines.length, modifiedLines.length);
  for (let i = 0; i < maxLength; i += 1) {
    const original = originalLines[i];
    const updated = modifiedLines[i];
    if (original === updated) {
      lines.push({
        type: 'context',
        content: original ?? '',
        oldLine,
        newLine,
      });
      oldLine += 1;
      newLine += 1;
    } else {
      if (original !== undefined) {
        lines.push({
          type: 'remove',
          content: original,
          oldLine,
          newLine: null,
        });
        oldLine += 1;
      }
      if (updated !== undefined) {
        lines.push({
          type: 'add',
          content: updated,
          oldLine: null,
          newLine,
        });
        newLine += 1;
      }
    }
  }

  return lines;
};

const buildLcsDiff = (
  originalLines: string[],
  modifiedLines: string[],
  config: FileDiffConfig
): DiffLine[] => {
  const totalCells = originalLines.length * modifiedLines.length;
  if (totalCells > config.maxMatrixCells) {
    return buildFallbackDiff(originalLines, modifiedLines, config);
  }

  const lcs: number[][] = Array.from({ length: originalLines.length + 1 }, () =>
    Array(modifiedLines.length + 1).fill(0)
  );

  for (let i = 1; i <= originalLines.length; i += 1) {
    for (let j = 1; j <= modifiedLines.length; j += 1) {
      if (originalLines[i - 1] === modifiedLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  const diffStack: Array<{ type: DiffLineType; content: string }> = [];
  let i = originalLines.length;
  let j = modifiedLines.length;

  while (i > 0 && j > 0) {
    if (originalLines[i - 1] === modifiedLines[j - 1]) {
      diffStack.push({ type: 'context', content: originalLines[i - 1] });
      i -= 1;
      j -= 1;
    } else if (lcs[i - 1][j] >= lcs[i][j - 1]) {
      diffStack.push({ type: 'remove', content: originalLines[i - 1] });
      i -= 1;
    } else {
      diffStack.push({ type: 'add', content: modifiedLines[j - 1] });
      j -= 1;
    }
  }

  while (i > 0) {
    diffStack.push({ type: 'remove', content: originalLines[i - 1] });
    i -= 1;
  }

  while (j > 0) {
    diffStack.push({ type: 'add', content: modifiedLines[j - 1] });
    j -= 1;
  }

  diffStack.reverse();

  const lines: DiffLine[] = [];
  let oldLine = config.lineNumberStart;
  let newLine = config.lineNumberStart;

  for (const entry of diffStack) {
    if (entry.type === 'context') {
      lines.push({
        type: 'context',
        content: entry.content,
        oldLine,
        newLine,
      });
      oldLine += 1;
      newLine += 1;
    } else if (entry.type === 'remove') {
      lines.push({
        type: 'remove',
        content: entry.content,
        oldLine,
        newLine: null,
      });
      oldLine += 1;
    } else {
      lines.push({
        type: 'add',
        content: entry.content,
        oldLine: null,
        newLine,
      });
      newLine += 1;
    }
  }

  return lines;
};

const buildDiffFromModule = (
  diffModule: DiffModule,
  original: string,
  modified: string,
  config: FileDiffConfig
): DiffLine[] | null => {
  if (!diffModule.diffLines) {
    return null;
  }
  const chunks = diffModule.diffLines(original, modified);
  const lines: DiffLine[] = [];
  let oldLine = config.lineNumberStart;
  let newLine = config.lineNumberStart;

  for (const chunk of chunks) {
    const chunkLines = splitLines(chunk.value, config);
    for (const line of chunkLines) {
      if (chunk.added) {
        lines.push({ type: 'add', content: line, oldLine: null, newLine });
        newLine += 1;
      } else if (chunk.removed) {
        lines.push({ type: 'remove', content: line, oldLine, newLine: null });
        oldLine += 1;
      } else {
        lines.push({ type: 'context', content: line, oldLine, newLine });
        oldLine += 1;
        newLine += 1;
      }
    }
  }

  return lines;
};

export const computeDiffLines = (
  original: string,
  modified: string,
  config: FileDiffConfig = getFileDiffConfig()
): DiffLine[] => {
  const originalLines = splitLines(original, config);
  const modifiedLines = splitLines(modified, config);
  const diffModule = loadDiffModule();
  if (diffModule) {
    const fromModule = buildDiffFromModule(diffModule, original, modified, config);
    if (fromModule) {
      return fromModule;
    }
  }
  return buildLcsDiff(originalLines, modifiedLines, config);
};

export const createFoldedDiff = (
  lines: DiffLine[],
  config: FileDiffConfig = getFileDiffConfig()
): DiffDisplayItem[] => {
  const items: DiffDisplayItem[] = [];
  let buffer: DiffLine[] = [];
  let foldIndex = 0;

  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }
    if (buffer.length > config.foldThreshold) {
      const head = buffer.slice(0, config.foldContext);
      const tail = buffer.slice(buffer.length - config.foldContext);
      head.forEach((line) => items.push({ type: 'line', line }));
      items.push({
        type: 'fold',
        id: `fold-${foldIndex}`,
        count: buffer.length - head.length - tail.length,
        lines: buffer.slice(config.foldContext, buffer.length - config.foldContext),
      });
      tail.forEach((line) => items.push({ type: 'line', line }));
      foldIndex += 1;
    } else {
      buffer.forEach((line) => items.push({ type: 'line', line }));
    }
    buffer = [];
  };

  for (const line of lines) {
    if (line.type === 'context') {
      buffer.push(line);
    } else {
      flushBuffer();
      items.push({ type: 'line', line });
    }
  }
  flushBuffer();

  return items;
};

export const buildSideBySideRows = (
  items: DiffDisplayItem[],
  config: FileDiffConfig = getFileDiffConfig()
): DiffRow[] => {
  const rows: DiffRow[] = [];
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.type === 'fold') {
      rows.push({
        type: 'fold',
        id: item.id,
      });
      i += 1;
      continue;
    }
    const line = item.line;
    const nextItem = items[i + config.pairWindow];
    if (
      line.type === 'remove' &&
      nextItem &&
      nextItem.type === 'line' &&
      nextItem.line.type === 'add'
    ) {
      rows.push({
        type: 'modify',
        left: line,
        right: nextItem.line,
        id: `row-${i}`,
      });
      i += config.pairWindow + 1;
      continue;
    }
    if (line.type === 'add') {
      rows.push({ type: 'add', right: line, id: `row-${i}` });
    } else if (line.type === 'remove') {
      rows.push({ type: 'remove', left: line, id: `row-${i}` });
    } else {
      rows.push({ type: 'context', left: line, right: line, id: `row-${i}` });
    }
    i += 1;
  }
  return rows;
};

export const resolveLanguageFromPath = (
  filePath?: string,
  config: FileDiffConfig = getFileDiffConfig()
): string => {
  if (!filePath) {
    return config.fallbackLanguage;
  }
  const segments = filePath.split('.');
  if (segments.length <= 1) {
    return config.fallbackLanguage;
  }
  const ext = segments[segments.length - 1].toLowerCase();
  return FILE_EXTENSION_MAP[ext] ?? config.fallbackLanguage;
};

export const highlightDiffLine = (
  line: DiffLine,
  language?: string,
  config: FileDiffConfig = getFileDiffConfig()
): string => {
  const highlightModule = loadHighlightModule();
  const truncated =
    line.content.length > config.highlightMaxLength
      ? line.content.slice(0, config.highlightMaxLength)
      : line.content;
  if (highlightModule && language && highlightModule.getLanguage?.(language)) {
    const highlighted = highlightModule.highlight?.(truncated, { language });
    if (highlighted) {
      return highlighted.value;
    }
  }
  if (highlightModule) {
    const auto = highlightModule.highlightAuto?.(truncated);
    if (auto) {
      return auto.value;
    }
  }
  return escapeHtml(truncated);
};

export const buildDiffActionPayload = (
  action: DiffAction,
  data: {
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    viewMode: DiffViewMode;
  },
  config: FileDiffConfig = getFileDiffConfig()
): {
  action: DiffAction;
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  viewMode: DiffViewMode;
  timestamp?: string;
} => {
  const payload = {
    action,
    filePath: data.filePath,
    originalContent: data.originalContent,
    modifiedContent: data.modifiedContent,
    viewMode: data.viewMode,
  } as {
    action: DiffAction;
    filePath: string;
    originalContent: string;
    modifiedContent: string;
    viewMode: DiffViewMode;
    timestamp?: string;
  };
  if (config.actionTimestamp) {
    payload.timestamp = new Date().toISOString();
  }
  return payload;
};
