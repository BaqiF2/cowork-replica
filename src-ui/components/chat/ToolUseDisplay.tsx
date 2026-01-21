/**
 * Tool use display component.
 */

import { createSignal, type Component } from 'solid-js';
import {
  formatToolUseArgs,
  formatToolUseSummary,
  getToolUseDisplayConfig,
  type ToolUseDisplayItem,
} from './toolUseDisplayUtils';

export interface ToolUseDisplayProps {
  toolUse: ToolUseDisplayItem;
}

export const ToolUseDisplay: Component<ToolUseDisplayProps> = (props) => {
  const config = getToolUseDisplayConfig();
  const [expanded, setExpanded] = createSignal(config.expandedByDefault);
  const summary = () => formatToolUseSummary(props.toolUse, config);
  const statusLabel = () => props.toolUse.status ?? 'pending';

  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        'border-radius': 'var(--border-radius-md)',
        padding: 'var(--spacing-sm)',
        'margin-top': 'var(--spacing-xs)',
        'background-color': 'var(--bg-tertiary)',
      }}
    >
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
        }}
      >
        <strong>{props.toolUse.tool}</strong>
        <span style={{ color: 'var(--text-tertiary)' }}>{statusLabel()}</span>
      </div>
      <div style={{ 'margin-top': 'var(--spacing-xs)' }}>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
            padding: '0',
          }}
        >
          {expanded() ? 'Hide details' : 'Show details'}
        </button>
      </div>
      <div style={{ 'margin-top': 'var(--spacing-xs)' }}>
        {expanded() ? (
          <pre style={{ 'white-space': 'pre-wrap' }}>
            {formatToolUseArgs(props.toolUse, config)}
          </pre>
        ) : (
          <span>{summary()}</span>
        )}
      </div>
      {props.toolUse.result && (
        <div style={{ 'margin-top': 'var(--spacing-xs)' }}>
          <div style={{ color: 'var(--text-tertiary)' }}>Result</div>
          <pre style={{ 'white-space': 'pre-wrap' }}>{props.toolUse.result}</pre>
        </div>
      )}
    </div>
  );
};
