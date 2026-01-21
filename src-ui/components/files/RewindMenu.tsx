import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Component,
} from 'solid-js';
import { ipcService } from '../../services/ipcService';
import { FileDiff } from './FileDiff';
import {
  buildRewindMenuResponse,
  buildTimelineMarkers,
  clampOffset,
  clampZoom,
  filterSnapshots,
  formatSnapshotTimestamp,
  getRewindMenuConfig,
  normalizeSnapshots,
  resolveSnapshotFile,
  type RewindSnapshot,
  type RewindSnapshotPayload,
} from './rewindMenuUtils';
import { getEnv, getEnvInt } from '../../utils/env';

export interface RewindMenuProps {
  onRestore?: (snapshot: RewindSnapshot) => void;
  onCancel?: () => void;
}

const SHOW_REWIND_MENU_EVENT = getEnv('COWORK_REWIND_MENU_EVENT', 'show_rewind_menu');
const REWIND_MENU_RESPONSE_EVENT = getEnv('COWORK_REWIND_MENU_RESPONSE_EVENT', 'show_rewind_menu_response');
const REWIND_MENU_RESTORE_EVENT = getEnv('COWORK_REWIND_MENU_RESTORE_EVENT', 'checkpoint_restore');
const MENU_TITLE = getEnv('COWORK_REWIND_MENU_TITLE', 'Checkpoint Rewind');
const LIST_TITLE = getEnv('COWORK_REWIND_MENU_LIST_TITLE', 'Snapshots');
const TIMELINE_TITLE = getEnv('COWORK_REWIND_MENU_TIMELINE_TITLE', 'Timeline');
const FILES_TITLE = getEnv('COWORK_REWIND_MENU_FILES_TITLE', 'Files');
const PREVIEW_TITLE = getEnv('COWORK_REWIND_MENU_PREVIEW_TITLE', 'Diff Preview');
const CANCEL_LABEL = getEnv('COWORK_REWIND_MENU_CANCEL_LABEL', 'Cancel');
const RESTORE_LABEL = getEnv('COWORK_REWIND_MENU_RESTORE_LABEL', 'Restore');
const CONFIRM_TITLE = getEnv('COWORK_REWIND_MENU_CONFIRM_TITLE', 'Confirm restore');
const CONFIRM_MESSAGE = getEnv('COWORK_REWIND_MENU_CONFIRM_MESSAGE', 'Restore files to selected checkpoint?');
const CONFIRM_ACTION = getEnv('COWORK_REWIND_MENU_CONFIRM_ACTION', 'Confirm');
const ZOOM_IN_LABEL = getEnv('COWORK_REWIND_MENU_ZOOM_IN_LABEL', 'Zoom in');
const ZOOM_OUT_LABEL = getEnv('COWORK_REWIND_MENU_ZOOM_OUT_LABEL', 'Zoom out');

const PANEL_WIDTH = getEnvInt('COWORK_REWIND_MENU_PANEL_WIDTH', 960);
const PANEL_WIDTH_VW = getEnvInt('COWORK_REWIND_MENU_PANEL_WIDTH_VW', 95);
const PANEL_HEIGHT = getEnvInt('COWORK_REWIND_MENU_PANEL_HEIGHT', 720);
const PANEL_HEIGHT_VH = getEnvInt('COWORK_REWIND_MENU_PANEL_HEIGHT_VH', 90);
const BORDER_WIDTH = getEnvInt('COWORK_REWIND_MENU_BORDER_WIDTH', 1);
const SIDEBAR_MIN_WIDTH = getEnvInt('COWORK_REWIND_MENU_SIDEBAR_MIN_WIDTH', 240);
const GRID_LEFT_FRACTION = getEnvInt('COWORK_REWIND_MENU_GRID_LEFT_FRACTION', 1);
const GRID_RIGHT_FRACTION = getEnvInt('COWORK_REWIND_MENU_GRID_RIGHT_FRACTION', 2);
const TIMELINE_HEIGHT = getEnvInt('COWORK_REWIND_MENU_TIMELINE_HEIGHT', 140);
const TIMELINE_MARKER_SIZE = getEnvInt('COWORK_REWIND_MENU_MARKER_SIZE', 10);
const TIMELINE_MARKER_BORDER = getEnvInt('COWORK_REWIND_MENU_MARKER_BORDER', 2);
const TIMELINE_LINE_HEIGHT = getEnvInt('COWORK_REWIND_MENU_LINE_HEIGHT', 2);
const MARKER_TRANSLATE_PERCENT = getEnvInt('COWORK_REWIND_MENU_MARKER_TRANSLATE_PERCENT', 50);
const CENTER_PERCENT = getEnvInt('COWORK_REWIND_MENU_CENTER_PERCENT', 50);
const OVERLAY_ALPHA = getEnvInt('COWORK_REWIND_MENU_OVERLAY_ALPHA', 45);
const OVERLAY_ALPHA_DIVISOR = getEnvInt('COWORK_REWIND_MENU_OVERLAY_ALPHA_DIVISOR', 100);
const OVERLAY_COLOR = getEnv('COWORK_REWIND_MENU_OVERLAY_COLOR', '0, 0, 0');
const CONFIRM_WIDTH = getEnvInt('COWORK_REWIND_MENU_CONFIRM_WIDTH', 420);
const CONFIRM_WIDTH_VW = getEnvInt('COWORK_REWIND_MENU_CONFIRM_WIDTH_VW', 92);
const DRAG_MULTIPLIER = getEnvInt('COWORK_REWIND_MENU_DRAG_MULTIPLIER', 1);
const DRAG_DIVISOR = getEnvInt('COWORK_REWIND_MENU_DRAG_DIVISOR', 1);
const OPACITY_DIMMED = getEnvInt('COWORK_REWIND_MENU_OPACITY_DIMMED', 6);
const OPACITY_FULL = getEnvInt('COWORK_REWIND_MENU_OPACITY_FULL', 10);
const OPACITY_DIVISOR = getEnvInt('COWORK_REWIND_MENU_OPACITY_DIVISOR', 10);
const ZERO = getEnvInt('COWORK_REWIND_MENU_ZERO', 0);

const OVERLAY_BG = `rgba(${OVERLAY_COLOR}, ${
  OVERLAY_ALPHA / OVERLAY_ALPHA_DIVISOR
})`;

interface RewindMenuPayload {
  snapshots?: RewindSnapshotPayload[];
}

export const RewindMenu: Component<RewindMenuProps> = (props) => {
  const config = getRewindMenuConfig();
  const [visible, setVisible] = createSignal(false);
  const [snapshots, setSnapshots] = createSignal<RewindSnapshot[]>([]);
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [activeFilePath, setActiveFilePath] = createSignal<string | null>(null);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [timelineZoom, setTimelineZoom] = createSignal(config.timelineDefaultZoom);
  const [timelineOffset, setTimelineOffset] = createSignal(ZERO);
  const [confirmVisible, setConfirmVisible] = createSignal(false);

  let isDragging = false;
  let dragStartX = ZERO;
  let dragStartOffset = ZERO;

  const filteredSnapshots = createMemo(() =>
    filterSnapshots(snapshots(), searchQuery(), config)
  );
  const selectedSnapshot = createMemo(() => {
    const candidates = filteredSnapshots();
    const current = candidates.find((snapshot) => snapshot.id === selectedId());
    return current ?? candidates[ZERO] ?? null;
  });
  const selectedFile = createMemo(() =>
    resolveSnapshotFile(selectedSnapshot(), activeFilePath())
  );
  const markers = createMemo(() =>
    buildTimelineMarkers(filteredSnapshots(), config)
  );
  const timelineScale = createMemo(
    () => timelineZoom() / config.timelineZoomDivisor
  );

  const handleOpen = (payload: RewindMenuPayload) => {
    const normalized = normalizeSnapshots(payload.snapshots ?? [], config);
    setSnapshots(normalized);
    setSelectedId(normalized[ZERO]?.id ?? null);
    setActiveFilePath(null);
    setSearchQuery('');
    setTimelineZoom(config.timelineDefaultZoom);
    setTimelineOffset(ZERO);
    setConfirmVisible(false);
    setVisible(true);
  };

  const closeMenu = () => {
    setVisible(false);
    setConfirmVisible(false);
  };

  const emitResponse = async (snapshot: RewindSnapshot | null) => {
    const payload = buildRewindMenuResponse(snapshot);
    await ipcService.emit(REWIND_MENU_RESPONSE_EVENT, payload);
  };

  const handleCancel = async () => {
    await emitResponse(null);
    props.onCancel?.();
    closeMenu();
  };

  const handleConfirmRestore = async () => {
    const snapshot = selectedSnapshot();
    if (!snapshot) {
      return;
    }
    await emitResponse(snapshot);
    await ipcService.emit(REWIND_MENU_RESTORE_EVENT, { snapshotId: snapshot.id, snapshot });
    props.onRestore?.(snapshot);
    closeMenu();
  };

  const handleSelectSnapshot = (snapshot: RewindSnapshot) => {
    setSelectedId(snapshot.id);
    setActiveFilePath(null);
  };

  const handleSelectFile = (filePath: string) => {
    setActiveFilePath(filePath);
  };

  const handleZoom = (delta: number) => {
    setTimelineZoom((prev) => clampZoom(prev + delta, config));
  };

  const handlePointerDown = (event: PointerEvent) => {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartOffset = timelineOffset();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging) {
      return;
    }
    const delta = event.clientX - dragStartX;
    const scaledDelta = (delta * DRAG_MULTIPLIER) / DRAG_DIVISOR;
    setTimelineOffset(clampOffset(dragStartOffset + scaledDelta, config));
  };

  const handlePointerUp = () => {
    isDragging = false;
  };

  ipcService.on(SHOW_REWIND_MENU_EVENT, handleOpen);
  onCleanup(() => {
    ipcService.off(SHOW_REWIND_MENU_EVENT, handleOpen);
  });

  onMount(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    onCleanup(() => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    });
  });

  createEffect(() => {
    const snapshot = selectedSnapshot();
    if (snapshot && snapshot.id !== selectedId()) {
      setSelectedId(snapshot.id);
    }
  });

  return (
    <Show when={visible()}>
      <div
        style={{
          position: 'fixed',
          inset: '0',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'background-color': OVERLAY_BG,
          'z-index': 'var(--z-index-modal)',
        }}
      >
        <div
          style={{
            width: `min(${PANEL_WIDTH}px, ${PANEL_WIDTH_VW}vw)`,
            height: `min(${PANEL_HEIGHT}px, ${PANEL_HEIGHT_VH}vh)`,
            display: 'flex',
            'flex-direction': 'column',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-lg)',
            'background-color': 'var(--bg-secondary)',
            border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
            'border-radius': 'var(--border-radius-lg)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <header
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
            }}
          >
            <h2 style={{ margin: '0', 'font-size': 'var(--font-size-lg)' }}>
              {MENU_TITLE}
            </h2>
            <div style={{ color: 'var(--text-tertiary)' }}>
              {filteredSnapshots().length}
            </div>
          </header>

          <div
            style={{
              display: 'grid',
              'grid-template-columns': `minmax(${SIDEBAR_MIN_WIDTH}px, ${GRID_LEFT_FRACTION}fr) ${GRID_RIGHT_FRACTION}fr`,
              gap: 'var(--spacing-lg)',
              flex: '1',
              overflow: 'hidden',
            }}
          >
            <section
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: 'var(--spacing-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'space-between',
                }}
              >
                <strong>{LIST_TITLE}</strong>
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {snapshots().length}
                </span>
              </div>
              <input
                type="search"
                value={searchQuery()}
                onInput={(event) => setSearchQuery(event.currentTarget.value)}
                placeholder={config.searchPlaceholder}
                style={{
                  padding: 'var(--spacing-sm)',
                  border: `${BORDER_WIDTH}px solid var(--border-default)`,
                  'border-radius': 'var(--border-radius-md)',
                  'background-color': 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              />
              <div
                style={{
                  flex: '1',
                  overflow: 'auto',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <Show
                  when={filteredSnapshots().length > ZERO}
                  fallback={<div style={{ color: 'var(--text-tertiary)' }}>{config.emptyLabel}</div>}
                >
                  <For each={filteredSnapshots()}>
                    {(snapshot) => (
                      <button
                        type="button"
                        onClick={() => handleSelectSnapshot(snapshot)}
                        style={{
                          padding: 'var(--spacing-sm)',
                          border: `${BORDER_WIDTH}px solid ${
                            snapshot.id === selectedSnapshot()?.id
                              ? 'var(--accent-primary)'
                              : 'var(--border-subtle)'
                          }`,
                          'border-radius': 'var(--border-radius-md)',
                          'background-color': 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          'text-align': 'left',
                        }}
                      >
                        <div style={{ 'font-weight': 'var(--font-weight-semibold)' }}>
                          {snapshot.description}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)' }}>
                          {formatSnapshotTimestamp(snapshot.timestamp)}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)' }}>
                          {snapshot.files.length} {FILES_TITLE.toLowerCase()}
                        </div>
                      </button>
                    )}
                  </For>
                </Show>
              </div>
            </section>

            <section
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: 'var(--spacing-md)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                  }}
                >
                  <strong>{TIMELINE_TITLE}</strong>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                      type="button"
                      onClick={() => handleZoom(-config.timelineZoomStep)}
                      style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        border: `${BORDER_WIDTH}px solid var(--border-default)`,
                        'border-radius': 'var(--border-radius-md)',
                        'background-color': 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {ZOOM_OUT_LABEL}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleZoom(config.timelineZoomStep)}
                      style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        border: `${BORDER_WIDTH}px solid var(--border-default)`,
                        'border-radius': 'var(--border-radius-md)',
                        'background-color': 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {ZOOM_IN_LABEL}
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    height: `${TIMELINE_HEIGHT}px`,
                    'background-color': 'var(--bg-tertiary)',
                    border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                    'border-radius': 'var(--border-radius-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'grab',
                  }}
                  onPointerDown={(event) => handlePointerDown(event)}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0',
                      transform: `translateX(${timelineOffset()}px) scaleX(${timelineScale()})`,
                      'transform-origin': 'left center',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: `${CENTER_PERCENT}%`,
                        left: '0',
                        right: '0',
                        height: `${TIMELINE_LINE_HEIGHT}px`,
                        'background-color': 'var(--border-default)',
                        transform: `translateY(-${CENTER_PERCENT}%)`,
                      }}
                    />
                    <For each={markers()}>
                      {(marker) => (
                        <button
                          type="button"
                          title={marker.description}
                          onClick={() => handleSelectSnapshot(marker.snapshot)}
                          style={{
                            position: 'absolute',
                            top: `${CENTER_PERCENT}%`,
                            left: `${marker.positionPercent}%`,
                            width: `${TIMELINE_MARKER_SIZE}px`,
                            height: `${TIMELINE_MARKER_SIZE}px`,
                            transform: `translate(-${MARKER_TRANSLATE_PERCENT}%, -${MARKER_TRANSLATE_PERCENT}%)`,
                            'border-radius': '50%',
                            border: `${TIMELINE_MARKER_BORDER}px solid ${
                              marker.snapshot.id === selectedSnapshot()?.id
                                ? 'var(--accent-primary)'
                                : 'var(--border-default)'
                            }`,
                            'background-color': 'var(--bg-secondary)',
                            cursor: 'pointer',
                          }}
                        />
                      )}
                    </For>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--spacing-sm)', overflow: 'hidden' }}>
                <strong>{PREVIEW_TITLE}</strong>
                <Show
                  when={selectedSnapshot() && selectedSnapshot()!.files.length > ZERO}
                  fallback={<div style={{ color: 'var(--text-tertiary)' }}>{config.diffEmptyLabel}</div>}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-sm)',
                      overflow: 'auto',
                    }}
                  >
                    <For each={selectedSnapshot()?.files ?? []}>
                      {(file) => (
                        <button
                          type="button"
                          onClick={() => handleSelectFile(file.path)}
                          style={{
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            border: `${BORDER_WIDTH}px solid ${
                              selectedFile()?.path === file.path
                                ? 'var(--accent-primary)'
                                : 'var(--border-subtle)'
                            }`,
                            'border-radius': 'var(--border-radius-md)',
                            'background-color': 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            'white-space': 'nowrap',
                          }}
                        >
                          {file.path}
                        </button>
                      )}
                    </For>
                  </div>
                  <Show when={selectedFile()}>
                    {(file) => (
                      <div
                        style={{
                          flex: '1',
                          overflow: 'auto',
                          border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                          'border-radius': 'var(--border-radius-md)',
                          padding: 'var(--spacing-sm)',
                          'background-color': 'var(--bg-secondary)',
                        }}
                      >
                        <FileDiff
                          filePath={file().path}
                          originalContent={file().originalContent}
                          modifiedContent={file().modifiedContent}
                          language={file().language}
                        />
                      </div>
                    )}
                  </Show>
                </Show>
              </div>
            </section>
          </div>

          <footer
            style={{
              display: 'flex',
              'justify-content': 'flex-end',
              gap: 'var(--spacing-sm)',
            }}
          >
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
              onClick={() => setConfirmVisible(true)}
              disabled={!selectedSnapshot()}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: `${BORDER_WIDTH}px solid var(--border-default)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                cursor: 'pointer',
                opacity:
                  (selectedSnapshot() ? OPACITY_FULL : OPACITY_DIMMED) /
                  OPACITY_DIVISOR,
              }}
            >
              {RESTORE_LABEL}
            </button>
          </footer>
        </div>
        <Show when={confirmVisible()}>
          <div
            style={{
              position: 'fixed',
              inset: '0',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'background-color': OVERLAY_BG,
              'z-index': 'var(--z-index-modal)',
            }}
          >
            <div
              style={{
                width: `min(${CONFIRM_WIDTH}px, ${CONFIRM_WIDTH_VW}vw)`,
                padding: 'var(--spacing-lg)',
                'background-color': 'var(--bg-secondary)',
                border: `${BORDER_WIDTH}px solid var(--border-default)`,
                'border-radius': 'var(--border-radius-lg)',
                display: 'flex',
                'flex-direction': 'column',
                gap: 'var(--spacing-md)',
              }}
            >
              <h3 style={{ margin: '0' }}>{CONFIRM_TITLE}</h3>
              <p style={{ margin: '0', color: 'var(--text-tertiary)' }}>
                {CONFIRM_MESSAGE}
              </p>
              <Show when={selectedSnapshot()}>
                {(snapshot) => (
                  <div>
                    <div style={{ 'font-weight': 'var(--font-weight-semibold)' }}>
                      {snapshot().description}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)' }}>
                      {formatSnapshotTimestamp(snapshot().timestamp)}
                    </div>
                  </div>
                )}
              </Show>
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'flex-end',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmVisible(false)}
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
                  onClick={() => void handleConfirmRestore()}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    border: `${BORDER_WIDTH}px solid var(--border-default)`,
                    'border-radius': 'var(--border-radius-md)',
                    'background-color': 'var(--accent-primary)',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                  }}
                >
                  {CONFIRM_ACTION}
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};
