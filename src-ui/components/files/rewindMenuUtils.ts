import { getEnv, getEnvInt } from '../../utils/env';

export interface RewindSnapshotFile {
  path: string;
  originalContent: string;
  modifiedContent: string;
  language?: string;
}

export interface RewindSnapshotPayload {
  id: string;
  timestamp: string | Date;
  description: string;
  files?: RewindSnapshotFile[];
}

export interface RewindSnapshot {
  id: string;
  timestamp: Date;
  description: string;
  files: RewindSnapshotFile[];
}

export interface TimelineMarker {
  id: string;
  description: string;
  timestamp: Date;
  positionPercent: number;
  snapshot: RewindSnapshot;
}

export interface RewindMenuConfig {
  minSearchLength: number;
  timelineMaxMarkers: number;
  timelineMinSpanMs: number;
  timelinePercentScale: number;
  timelineMinZoom: number;
  timelineMaxZoom: number;
  timelineZoomStep: number;
  timelineZoomDivisor: number;
  timelineDefaultZoom: number;
  timelineMaxOffset: number;
  emptyLabel: string;
  searchPlaceholder: string;
  diffEmptyLabel: string;
  fallbackTimestamp: string;
  emptyDescription: string;
}

const MIN_SEARCH_LENGTH = getEnvInt('COWORK_REWIND_SEARCH_MIN_LENGTH', 1);
const TIMELINE_MAX_MARKERS = getEnvInt('COWORK_REWIND_TIMELINE_MAX_MARKERS', 120);
const TIMELINE_MIN_SPAN_MS = getEnvInt('COWORK_REWIND_TIMELINE_MIN_SPAN_MS', 60000);
const TIMELINE_PERCENT_SCALE = getEnvInt('COWORK_REWIND_TIMELINE_PERCENT_SCALE', 100);
const TIMELINE_MIN_ZOOM = getEnvInt('COWORK_REWIND_TIMELINE_MIN_ZOOM', 50);
const TIMELINE_MAX_ZOOM = getEnvInt('COWORK_REWIND_TIMELINE_MAX_ZOOM', 200);
const TIMELINE_ZOOM_STEP = getEnvInt('COWORK_REWIND_TIMELINE_ZOOM_STEP', 25);
const TIMELINE_ZOOM_DIVISOR = getEnvInt('COWORK_REWIND_TIMELINE_ZOOM_DIVISOR', 100);
const TIMELINE_DEFAULT_ZOOM = getEnvInt('COWORK_REWIND_TIMELINE_DEFAULT_ZOOM', 100);
const TIMELINE_MAX_OFFSET = getEnvInt('COWORK_REWIND_TIMELINE_MAX_OFFSET', 240);
const EMPTY_LABEL = getEnv('COWORK_REWIND_EMPTY_LABEL', 'No checkpoints available');
const SEARCH_PLACEHOLDER = getEnv('COWORK_REWIND_SEARCH_PLACEHOLDER', 'Search checkpoints');
const DIFF_EMPTY_LABEL = getEnv('COWORK_REWIND_DIFF_EMPTY_LABEL', 'No file changes');
const FALLBACK_TIMESTAMP = getEnv('COWORK_REWIND_FALLBACK_TIMESTAMP', '1970-01-01T00:00:00.000Z');
const EMPTY_DESCRIPTION = getEnv('COWORK_REWIND_EMPTY_DESCRIPTION', 'Untitled checkpoint');
const INDEX_START = getEnvInt('COWORK_REWIND_INDEX_START', 0);
const STEP_MIN = getEnvInt('COWORK_REWIND_STEP_MIN', 1);

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

const clampValue = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const getRewindMenuConfig = (): RewindMenuConfig => ({
  minSearchLength: MIN_SEARCH_LENGTH,
  timelineMaxMarkers: TIMELINE_MAX_MARKERS,
  timelineMinSpanMs: TIMELINE_MIN_SPAN_MS,
  timelinePercentScale: TIMELINE_PERCENT_SCALE,
  timelineMinZoom: TIMELINE_MIN_ZOOM,
  timelineMaxZoom: TIMELINE_MAX_ZOOM,
  timelineZoomStep: TIMELINE_ZOOM_STEP,
  timelineZoomDivisor: TIMELINE_ZOOM_DIVISOR,
  timelineDefaultZoom: clampValue(
    TIMELINE_DEFAULT_ZOOM,
    TIMELINE_MIN_ZOOM,
    TIMELINE_MAX_ZOOM
  ),
  timelineMaxOffset: TIMELINE_MAX_OFFSET,
  emptyLabel: EMPTY_LABEL,
  searchPlaceholder: SEARCH_PLACEHOLDER,
  diffEmptyLabel: DIFF_EMPTY_LABEL,
  fallbackTimestamp: FALLBACK_TIMESTAMP,
  emptyDescription: EMPTY_DESCRIPTION,
});

export const normalizeSnapshotTimestamp = (
  timestamp: string | Date,
  config: RewindMenuConfig = getRewindMenuConfig()
): Date => {
  const resolved = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(resolved.getTime())) {
    return new Date(config.fallbackTimestamp);
  }
  return resolved;
};

export const normalizeSnapshot = (
  snapshot: RewindSnapshotPayload,
  config: RewindMenuConfig = getRewindMenuConfig()
): RewindSnapshot => ({
  id: snapshot.id,
  timestamp: normalizeSnapshotTimestamp(snapshot.timestamp, config),
  description: snapshot.description || config.emptyDescription,
  files: Array.isArray(snapshot.files) ? snapshot.files : [],
});

export const sortSnapshots = (snapshots: RewindSnapshot[]): RewindSnapshot[] =>
  [...snapshots].sort(
    (left, right) => right.timestamp.getTime() - left.timestamp.getTime()
  );

export const normalizeSnapshots = (
  snapshots: RewindSnapshotPayload[],
  config: RewindMenuConfig = getRewindMenuConfig()
): RewindSnapshot[] => sortSnapshots(snapshots.map((snapshot) =>
  normalizeSnapshot(snapshot, config)
));

export const filterSnapshots = (
  snapshots: RewindSnapshot[],
  query: string,
  config: RewindMenuConfig = getRewindMenuConfig()
): RewindSnapshot[] => {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < config.minSearchLength) {
    return snapshots;
  }
  return snapshots.filter((snapshot) => {
    const description = snapshot.description.toLowerCase();
    const files = snapshot.files;
    return (
      description.includes(normalized) ||
      files.some((file) => file.path.toLowerCase().includes(normalized))
    );
  });
};

export const formatSnapshotTimestamp = (timestamp: Date): string =>
  timestamp.toLocaleString();

export const limitSnapshotsForTimeline = (
  snapshots: RewindSnapshot[],
  config: RewindMenuConfig = getRewindMenuConfig()
): RewindSnapshot[] => {
  if (snapshots.length <= config.timelineMaxMarkers) {
    return snapshots;
  }
  const step = Math.max(
    Math.ceil(snapshots.length / config.timelineMaxMarkers),
    STEP_MIN
  );
  const limited = snapshots.filter((_snapshot, index) => index % step === INDEX_START);
  const lastIndex = snapshots.length - STEP_MIN;
  const last = snapshots[lastIndex];
  if (last && !limited.includes(last)) {
    limited.push(last);
  }
  return limited;
};

export const buildTimelineMarkers = (
  snapshots: RewindSnapshot[],
  config: RewindMenuConfig = getRewindMenuConfig()
): TimelineMarker[] => {
  const limited = limitSnapshotsForTimeline(snapshots, config);
  if (limited.length === 0) {
    return [];
  }
  const times = limited.map((snapshot) => snapshot.timestamp.getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const span = Math.max(maxTime - minTime, config.timelineMinSpanMs);
  return limited.map((snapshot) => ({
    id: snapshot.id,
    description: snapshot.description,
    timestamp: snapshot.timestamp,
    positionPercent: ((snapshot.timestamp.getTime() - minTime) / span) *
      config.timelinePercentScale,
    snapshot,
  }));
};

export const clampZoom = (
  value: number,
  config: RewindMenuConfig = getRewindMenuConfig()
): number => clampValue(value, config.timelineMinZoom, config.timelineMaxZoom);

export const clampOffset = (
  value: number,
  config: RewindMenuConfig = getRewindMenuConfig()
): number => clampValue(value, -config.timelineMaxOffset, config.timelineMaxOffset);

export const resolveSnapshotFile = (
  snapshot: RewindSnapshot | null,
  preferredPath: string | null = null
): RewindSnapshotFile | null => {
  if (!snapshot || snapshot.files.length === 0) {
    return null;
  }
  if (preferredPath) {
    const match = snapshot.files.find((file) => file.path === preferredPath);
    if (match) {
      return match;
    }
  }
  return snapshot.files[INDEX_START] ?? null;
};

export interface RewindMenuResponse {
  snapshot: RewindSnapshot | null;
}

export const buildRewindMenuResponse = (
  snapshot: RewindSnapshot | null
): RewindMenuResponse => ({
  snapshot,
});
