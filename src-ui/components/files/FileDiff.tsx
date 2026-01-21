import { For, Show, createMemo, createSignal, onCleanup, onMount, type Component } from 'solid-js';
import { ipcService } from '../../services/ipcService';
import {
  buildDiffActionPayload,
  buildSideBySideRows,
  computeDiffLines,
  createFoldedDiff,
  getFileDiffConfig,
  highlightDiffLine,
  resolveLanguageFromPath,
  type DiffDisplayItem,
  type DiffFoldItem,
  type DiffLine,
  type DiffViewMode,
} from './fileDiffUtils';
import { getEnv, getEnvInt } from '../../utils/env';

export interface FileDiffProps {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  viewMode?: DiffViewMode;
  language?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const CONFIRM_LABEL = getEnv('COWORK_FILE_DIFF_CONFIRM_LABEL', 'Confirm');
const CANCEL_LABEL = getEnv('COWORK_FILE_DIFF_CANCEL_LABEL', 'Cancel');
const COLLAPSE_LABEL = getEnv('COWORK_FILE_DIFF_COLLAPSE_LABEL', 'Show hidden lines');
const EXPAND_LABEL = getEnv('COWORK_FILE_DIFF_EXPAND_LABEL', 'Hide hidden lines');
const CONFIRM_EVENT = getEnv('COWORK_FILE_DIFF_CONFIRM_EVENT', 'file_diff_confirm');
const CANCEL_EVENT = getEnv('COWORK_FILE_DIFF_CANCEL_EVENT', 'file_diff_cancel');
const DEFAULT_VIEW_MODE = getEnv('COWORK_FILE_DIFF_VIEW_MODE', 'unified') as DiffViewMode;
const CODEMIRROR_ENABLED =
  getEnv('COWORK_FILE_DIFF_CODEMIRROR_ENABLED', 'false').toLowerCase() === 'true';
const BORDER_WIDTH = getEnvInt('COWORK_FILE_DIFF_BORDER_WIDTH', 1);
const LINE_NUMBER_PADDING = getEnvInt('COWORK_FILE_DIFF_LINE_NUMBER_PADDING', 4);
const LINE_NUMBER_GAP = getEnv('COWORK_FILE_DIFF_LINE_NUMBER_GAP', 'var(--spacing-sm)');
const SIDE_BY_SIDE_TEMPLATE = getEnv('COWORK_FILE_DIFF_SIDE_BY_SIDE_TEMPLATE', '1fr 1fr');
const UNIFIED_TEMPLATE = getEnv('COWORK_FILE_DIFF_UNIFIED_TEMPLATE', 'auto auto 1fr');
const SIDE_TEMPLATE = getEnv('COWORK_FILE_DIFF_SIDE_TEMPLATE', 'auto 1fr');
const BG_CONTEXT = getEnv('COWORK_FILE_DIFF_BG_CONTEXT', 'var(--bg-secondary)');
const BG_ADD = getEnv('COWORK_FILE_DIFF_BG_ADD', 'var(--accent-success)');
const BG_REMOVE = getEnv('COWORK_FILE_DIFF_BG_REMOVE', 'var(--accent-error)');
const BG_MODIFY = getEnv('COWORK_FILE_DIFF_BG_MODIFY', 'var(--accent-warning)');

type CodeMirrorView = {
  destroy: () => void;
};

const tryRequire = <T,>(moduleName: string): T | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(moduleName) as T;
  } catch {
    return null;
  }
};

const createCodeMirrorView = (
  target: HTMLDivElement,
  content: string,
  language: string
): CodeMirrorView | null => {
  const stateModule = tryRequire<any>('@codemirror/state');
  const viewModule = tryRequire<any>('@codemirror/view');
  const basicSetupModule = tryRequire<any>('@codemirror/basic-setup');
  if (!stateModule || !viewModule || !basicSetupModule) {
    return null;
  }

  const languageModuleMap: Record<string, string> = {
    javascript: '@codemirror/lang-javascript',
    typescript: '@codemirror/lang-javascript',
    json: '@codemirror/lang-json',
    markdown: '@codemirror/lang-markdown',
    python: '@codemirror/lang-python',
    rust: '@codemirror/lang-rust',
  };

  const languageModuleName = languageModuleMap[language];
  const languageModule = languageModuleName ? tryRequire<any>(languageModuleName) : null;
  const extensions = [basicSetupModule.basicSetup];
  if (languageModule?.javascript && language === 'typescript') {
    extensions.push(languageModule.javascript({ typescript: true }));
  } else if (languageModule?.javascript) {
    extensions.push(languageModule.javascript());
  } else if (languageModule?.json) {
    extensions.push(languageModule.json());
  } else if (languageModule?.markdown) {
    extensions.push(languageModule.markdown());
  } else if (languageModule?.python) {
    extensions.push(languageModule.python());
  } else if (languageModule?.rust) {
    extensions.push(languageModule.rust());
  }

  const state = stateModule.EditorState.create({
    doc: content,
    extensions,
  });
  const view = new viewModule.EditorView({
    state,
    parent: target,
  });

  return view;
};

const formatLineNumber = (value: number | null): string => {
  if (value === null) {
    return ''.padStart(LINE_NUMBER_PADDING, ' ');
  }
  return String(value).padStart(LINE_NUMBER_PADDING, ' ');
};

const renderLineContent = (line: DiffLine, language: string): string =>
  highlightDiffLine(line, language);

const renderFoldLabel = (fold: DiffFoldItem, expanded: boolean): string =>
  `${expanded ? EXPAND_LABEL : COLLAPSE_LABEL} (${fold.count})`;

const isFoldItem = (item: DiffDisplayItem): item is DiffFoldItem => item.type === 'fold';

export const FileDiff: Component<FileDiffProps> = (props) => {
  const config = getFileDiffConfig();
  const viewMode = () => props.viewMode ?? DEFAULT_VIEW_MODE;
  const language = () => props.language ?? resolveLanguageFromPath(props.filePath, config);

  const [expandedFolds, setExpandedFolds] = createSignal<Set<string>>(new Set());
  let codeMirrorRef: HTMLDivElement | undefined;
  let codeMirrorView: CodeMirrorView | null = null;

  const diffLines = createMemo(() =>
    computeDiffLines(props.originalContent, props.modifiedContent, config)
  );
  const foldedItems = createMemo(() => createFoldedDiff(diffLines(), config));
  const sideBySideRows = createMemo(() => buildSideBySideRows(foldedItems(), config));

  const handleToggleFold = (fold: DiffFoldItem) => {
    setExpandedFolds((prev) => {
      const next = new Set(prev);
      if (next.has(fold.id)) {
        next.delete(fold.id);
      } else {
        next.add(fold.id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const payload = buildDiffActionPayload('confirm', {
      filePath: props.filePath,
      originalContent: props.originalContent,
      modifiedContent: props.modifiedContent,
      viewMode: viewMode(),
    });
    await ipcService.emit(CONFIRM_EVENT, payload);
    props.onConfirm?.();
  };

  const handleCancel = async () => {
    const payload = buildDiffActionPayload('cancel', {
      filePath: props.filePath,
      originalContent: props.originalContent,
      modifiedContent: props.modifiedContent,
      viewMode: viewMode(),
    });
    await ipcService.emit(CANCEL_EVENT, payload);
    props.onCancel?.();
  };

  onMount(() => {
    if (!CODEMIRROR_ENABLED || !codeMirrorRef) {
      return;
    }
    codeMirrorView = createCodeMirrorView(
      codeMirrorRef,
      props.modifiedContent,
      language()
    );
  });

  onCleanup(() => {
    codeMirrorView?.destroy();
    codeMirrorView = null;
  });

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--spacing-md)',
      }}
    >
      <header style={{ display: 'flex', 'justify-content': 'space-between' }}>
        <div>
          <strong>{props.filePath}</strong>
        </div>
        <div style={{ color: 'var(--text-tertiary)' }}>{viewMode()}</div>
      </header>

      <Show when={CODEMIRROR_ENABLED} fallback={
        <div
          style={{
            border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
            'border-radius': 'var(--border-radius-md)',
            overflow: 'hidden',
          }}
        >
          <Show when={viewMode() === 'unified'} fallback={
            <div style={{ display: 'grid', 'grid-template-columns': SIDE_BY_SIDE_TEMPLATE }}>
              <For each={sideBySideRows()}>
                {(row) => (
                  <Show
                    when={row.type !== 'fold'}
                    fallback={
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          color: 'var(--text-tertiary)',
                          'background-color': 'var(--bg-tertiary)',
                        }}
                      >
                        {COLLAPSE_LABEL}
                      </div>
                    }
                  >
                    <div
                      style={{
                        display: 'grid',
                        'grid-template-columns': SIDE_TEMPLATE,
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        'border-bottom': `${BORDER_WIDTH}px solid var(--border-subtle)`,
                        'background-color': row.type === 'add'
                          ? BG_ADD
                          : row.type === 'remove'
                          ? BG_REMOVE
                          : row.type === 'modify'
                          ? BG_MODIFY
                          : BG_CONTEXT,
                      }}
                    >
                      <span style={{ color: 'var(--text-tertiary)', 'margin-right': LINE_NUMBER_GAP }}>
                        {formatLineNumber(row.left?.oldLine ?? null)}
                      </span>
                      <div
                        innerHTML={row.left ? renderLineContent(row.left, language()) : ''}
                      />
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        'grid-template-columns': SIDE_TEMPLATE,
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        'border-bottom': `${BORDER_WIDTH}px solid var(--border-subtle)`,
                        'background-color': row.type === 'add'
                          ? BG_ADD
                          : row.type === 'remove'
                          ? BG_REMOVE
                          : row.type === 'modify'
                          ? BG_MODIFY
                          : BG_CONTEXT,
                      }}
                    >
                      <span style={{ color: 'var(--text-tertiary)', 'margin-right': LINE_NUMBER_GAP }}>
                        {formatLineNumber(row.right?.newLine ?? null)}
                      </span>
                      <div
                        innerHTML={row.right ? renderLineContent(row.right, language()) : ''}
                      />
                    </div>
                  </Show>
                )}
              </For>
            </div>
          }>
            <div>
              <For each={foldedItems()}>
                {(item) => (
                  <Show
                    when={!isFoldItem(item)}
                    fallback={
                      <div
                        style={{
                          padding: 'var(--spacing-xs) var(--spacing-sm)',
                          'background-color': 'var(--bg-tertiary)',
                          color: 'var(--text-tertiary)',
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'center',
                        }}
                      >
                        <span>{item.count} lines hidden</span>
                        <button
                          type="button"
                          onClick={() => handleToggleFold(item)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {renderFoldLabel(item, expandedFolds().has(item.id))}
                        </button>
                      </div>
                    }
                  >
                    <div
                      style={{
                        display: 'grid',
                        'grid-template-columns': UNIFIED_TEMPLATE,
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        'border-bottom': `${BORDER_WIDTH}px solid var(--border-subtle)`,
                        'background-color': item.line.type === 'add'
                          ? BG_ADD
                          : item.line.type === 'remove'
                          ? BG_REMOVE
                          : BG_CONTEXT,
                      }}
                    >
                      <span style={{ color: 'var(--text-tertiary)', 'margin-right': LINE_NUMBER_GAP }}>
                        {formatLineNumber(item.line.oldLine)}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', 'margin-right': LINE_NUMBER_GAP }}>
                        {formatLineNumber(item.line.newLine)}
                      </span>
                      <div innerHTML={renderLineContent(item.line, language())} />
                    </div>
                  </Show>
                )}
              </For>
              <For each={foldedItems().filter(isFoldItem)}>
                {(fold) => (
                  <Show when={expandedFolds().has(fold.id)}>
                    <For each={fold.lines}>
                      {(line) => (
                        <div
                          style={{
                            display: 'grid',
                            'grid-template-columns': UNIFIED_TEMPLATE,
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            'border-bottom': `${BORDER_WIDTH}px solid var(--border-subtle)`,
                            'background-color': 'var(--bg-secondary)',
                          }}
                        >
                          <span style={{ color: 'var(--text-tertiary)', 'margin-right': LINE_NUMBER_GAP }}>
                            {formatLineNumber(line.oldLine)}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)', 'margin-right': LINE_NUMBER_GAP }}>
                            {formatLineNumber(line.newLine)}
                          </span>
                          <div innerHTML={renderLineContent(line, language())} />
                        </div>
                      )}
                    </For>
                  </Show>
                )}
              </For>
            </div>
          </Show>
        </div>
      }>
        <div
          ref={codeMirrorRef}
          style={{
            border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
            'border-radius': 'var(--border-radius-md)',
            overflow: 'hidden',
          }}
        />
      </Show>

      <footer style={{ display: 'flex', 'justify-content': 'flex-end', gap: 'var(--spacing-sm)' }}>
        <button
          type="button"
          onClick={() => void handleCancel()}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            border: `${BORDER_WIDTH}px solid var(--border-default)`,
            'border-radius': 'var(--border-radius-md)',
            'background-color': 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          {CANCEL_LABEL}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            border: `${BORDER_WIDTH}px solid var(--border-default)`,
            'border-radius': 'var(--border-radius-md)',
            'background-color': 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            cursor: 'pointer',
          }}
        >
          {CONFIRM_LABEL}
        </button>
      </footer>
    </div>
  );
};
