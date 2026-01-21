/**
 * RewindMenu Tests
 *
 * Tests for checkpoint UI helpers:
 * - snapshot list ordering and search
 * - timeline marker generation and sampling
 * - diff preview selection and restore payloads
 *
 * _Requirements: checkpoint rewind UI_
 * _Scenarios: snapshot list, timeline visualization, diff preview, restore checkpoint_
 * _TaskGroup: 9_
 */

import {
  buildRewindMenuResponse,
  buildTimelineMarkers,
  filterSnapshots,
  getRewindMenuConfig,
  normalizeSnapshots,
  resolveSnapshotFile,
  type RewindSnapshotPayload,
} from '../rewindMenuUtils';

const INDEX_FIRST = parseInt(process.env.COWORK_TEST_REWIND_INDEX_FIRST || '0', 10);
const INDEX_SECOND = parseInt(process.env.COWORK_TEST_REWIND_INDEX_SECOND || '1', 10);
const EXPECTED_ONE = parseInt(process.env.COWORK_TEST_REWIND_EXPECTED_ONE || '1', 10);
const EXPECTED_TWO = parseInt(process.env.COWORK_TEST_REWIND_EXPECTED_TWO || '2', 10);
const EXPECTED_MIN_PERCENT = parseInt(
  process.env.COWORK_TEST_REWIND_EXPECTED_MIN_PERCENT || '0',
  10
);
const EXPECTED_MAX_PERCENT = parseInt(
  process.env.COWORK_TEST_REWIND_EXPECTED_MAX_PERCENT || '100',
  10
);
const SEARCH_QUERY = process.env.COWORK_TEST_REWIND_SEARCH_QUERY || 'baseline';
const SNAPSHOT_DESC_BASE = process.env.COWORK_TEST_REWIND_DESC_BASE || 'Baseline';
const SNAPSHOT_DESC_NEW = process.env.COWORK_TEST_REWIND_DESC_NEW || 'Checkpoint';
const SNAPSHOT_ID_OLD = process.env.COWORK_TEST_REWIND_ID_OLD || 'snapshot-old';
const SNAPSHOT_ID_NEW = process.env.COWORK_TEST_REWIND_ID_NEW || 'snapshot-new';
const TIMESTAMP_OLD = process.env.COWORK_TEST_REWIND_TIMESTAMP_OLD || '2024-01-01T00:00:00.000Z';
const TIMESTAMP_NEW = process.env.COWORK_TEST_REWIND_TIMESTAMP_NEW || '2024-02-01T00:00:00.000Z';
const FILE_PATH = process.env.COWORK_TEST_REWIND_FILE_PATH || '/tmp/example.ts';
const ORIGINAL_CONTENT =
  process.env.COWORK_TEST_REWIND_ORIGINAL_CONTENT || 'const value = 1;';
const MODIFIED_CONTENT =
  process.env.COWORK_TEST_REWIND_MODIFIED_CONTENT || 'const value = 2;';
const MARKER_EXTRA = parseInt(process.env.COWORK_TEST_REWIND_MARKER_EXTRA || '2', 10);
const MARKER_SPACING_MS = parseInt(
  process.env.COWORK_TEST_REWIND_MARKER_SPACING_MS || '60000',
  10
);
const MARKER_BASE_TIMESTAMP =
  process.env.COWORK_TEST_REWIND_MARKER_BASE_TIMESTAMP || '2024-01-01T00:00:00.000Z';

describe('RewindMenu helpers', () => {
  it('should normalize and filter snapshots', () => {
    const payloads: RewindSnapshotPayload[] = [
      {
        id: SNAPSHOT_ID_OLD,
        timestamp: TIMESTAMP_OLD,
        description: SNAPSHOT_DESC_BASE,
        files: [],
      },
      {
        id: SNAPSHOT_ID_NEW,
        timestamp: TIMESTAMP_NEW,
        description: SNAPSHOT_DESC_NEW,
        files: [],
      },
    ];

    const normalized = normalizeSnapshots(payloads);
    expect(normalized[INDEX_FIRST].id).toBe(SNAPSHOT_ID_NEW);
    expect(normalized[INDEX_SECOND].id).toBe(SNAPSHOT_ID_OLD);

    const filtered = filterSnapshots(normalized, SEARCH_QUERY);
    expect(filtered).toHaveLength(EXPECTED_ONE);
    expect(filtered[INDEX_FIRST].id).toBe(SNAPSHOT_ID_OLD);
  });

  it('should build timeline markers and clamp to max markers', () => {
    const config = getRewindMenuConfig();
    const baseTime = new Date(MARKER_BASE_TIMESTAMP).getTime();
    const totalCount = config.timelineMaxMarkers + MARKER_EXTRA;
    const payloads: RewindSnapshotPayload[] = Array.from(
      { length: totalCount },
      (_, index) => ({
        id: `snapshot-${index}`,
        timestamp: new Date(baseTime + index * MARKER_SPACING_MS).toISOString(),
        description: `${SNAPSHOT_DESC_BASE} ${index}`,
        files: [],
      })
    );

    const normalized = normalizeSnapshots(payloads);
    const markers = buildTimelineMarkers(normalized, config);
    expect(markers.length).toBeLessThanOrEqual(config.timelineMaxMarkers);

    const rangePayloads: RewindSnapshotPayload[] = [
      {
        id: SNAPSHOT_ID_OLD,
        timestamp: TIMESTAMP_OLD,
        description: SNAPSHOT_DESC_BASE,
        files: [],
      },
      {
        id: SNAPSHOT_ID_NEW,
        timestamp: TIMESTAMP_NEW,
        description: SNAPSHOT_DESC_NEW,
        files: [],
      },
    ];
    const rangeMarkers = buildTimelineMarkers(normalizeSnapshots(rangePayloads), config);
    expect(rangeMarkers).toHaveLength(EXPECTED_TWO);
    expect(Math.round(rangeMarkers[INDEX_FIRST].positionPercent)).toBe(EXPECTED_MAX_PERCENT);
    expect(Math.round(rangeMarkers[INDEX_SECOND].positionPercent)).toBe(EXPECTED_MIN_PERCENT);
  });

  it('should resolve diff preview and build restore response', () => {
    const payload: RewindSnapshotPayload = {
      id: SNAPSHOT_ID_NEW,
      timestamp: TIMESTAMP_NEW,
      description: SNAPSHOT_DESC_NEW,
      files: [
        {
          path: FILE_PATH,
          originalContent: ORIGINAL_CONTENT,
          modifiedContent: MODIFIED_CONTENT,
        },
      ],
    };
    const normalized = normalizeSnapshots([payload])[INDEX_FIRST];
    const file = resolveSnapshotFile(normalized, FILE_PATH);
    expect(file?.path).toBe(FILE_PATH);

    const response = buildRewindMenuResponse(normalized);
    expect(response.snapshot?.id).toBe(SNAPSHOT_ID_NEW);
  });
});
