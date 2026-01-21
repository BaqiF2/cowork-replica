/**
 * FileDiff Tests
 *
 * Tests for file diff helpers:
 * - diff rendering output
 * - syntax highlight fallback
 * - folding logic
 * - confirm payload
 *
 * _Requirements: file diff preview_
 * _TaskGroup: 8_
 */

import {
  buildDiffActionPayload,
  computeDiffLines,
  createFoldedDiff,
  getFileDiffConfig,
  highlightDiffLine,
  resolveLanguageFromPath,
} from '../fileDiffUtils';

const ORIGINAL_CONTENT = process.env.COWORK_TEST_ORIGINAL_CONTENT || 'alpha\nbeta\ncharlie';
const MODIFIED_APPEND = process.env.COWORK_TEST_MODIFIED_APPEND || 'delta';
const MODIFIED_CONTENT = `${ORIGINAL_CONTENT}\n${MODIFIED_APPEND}`;
const FILE_PATH = process.env.COWORK_TEST_FILE_PATH || '/tmp/example.ts';
const EXPECTED_ADD_TYPE = process.env.COWORK_TEST_EXPECTED_ADD_TYPE || 'add';
const EXPECTED_ACTION = process.env.COWORK_TEST_EXPECTED_ACTION || 'confirm';
const REPEAT_COUNT = parseInt(process.env.COWORK_TEST_REPEAT_COUNT || '12', 10);
const EXPECTED_FOLD_EXISTS =
  (process.env.COWORK_TEST_EXPECTED_FOLD_EXISTS || 'true').toLowerCase() === 'true';
const EXPECTED_LANGUAGE = process.env.COWORK_TEST_EXPECTED_LANGUAGE || 'typescript';
const EXPECTED_LT_ENTITY = process.env.COWORK_TEST_EXPECTED_LT_ENTITY || '&lt;';
const EXPECTED_LINE_NUMBER = parseInt(
  process.env.COWORK_TEST_EXPECTED_LINE_NUMBER || '1',
  10
);
const EXPECTED_NEW_LINE =
  ORIGINAL_CONTENT.split('\n').length + EXPECTED_LINE_NUMBER;

describe('FileDiff helpers', () => {
  it('should compute diff lines with additions', () => {
    const lines = computeDiffLines(ORIGINAL_CONTENT, MODIFIED_CONTENT);
    const last = lines[lines.length - 1];
    expect(last.type).toBe(EXPECTED_ADD_TYPE);
    expect(last.content).toBe(MODIFIED_APPEND);
    expect(last.newLine).toBe(EXPECTED_NEW_LINE);
  });

  it('should fold long context sections', () => {
    const lines = Array.from({ length: REPEAT_COUNT }, (_, index) => `line-${index}`).join('\n');
    const diffLines = computeDiffLines(lines, lines);
    const config = getFileDiffConfig();
    const folded = createFoldedDiff(diffLines, config);
    const hasFold = folded.some((item) => item.type === 'fold');
    expect(hasFold).toBe(EXPECTED_FOLD_EXISTS);
  });

  it('should escape HTML in highlighted output', () => {
    const line = {
      type: 'add' as const,
      content: '<tag>',
      oldLine: null,
      newLine: EXPECTED_LINE_NUMBER,
    };
    const language = resolveLanguageFromPath(FILE_PATH);
    const highlighted = highlightDiffLine(line, language);
    expect(highlighted).toContain(EXPECTED_LT_ENTITY);
  });

  it('should build confirm payload', () => {
    const payload = buildDiffActionPayload('confirm', {
      filePath: FILE_PATH,
      originalContent: ORIGINAL_CONTENT,
      modifiedContent: MODIFIED_CONTENT,
      viewMode: 'unified',
    });
    expect(payload.action).toBe(EXPECTED_ACTION);
    expect(payload.filePath).toBe(FILE_PATH);
  });

  it('should resolve language from file path', () => {
    const language = resolveLanguageFromPath(FILE_PATH);
    expect(language).toBe(EXPECTED_LANGUAGE);
  });
});
