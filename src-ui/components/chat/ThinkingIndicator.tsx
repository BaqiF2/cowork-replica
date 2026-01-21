/**
 * Thinking indicator component.
 */

import { type Component } from 'solid-js';
import {
  getThinkingIndicatorConfig,
  shouldShowThinking,
  trimLines,
} from './thinkingIndicatorUtils';

export interface ThinkingIndicatorProps {
  content?: string | null;
  isComputing: boolean;
}

export const ThinkingIndicator: Component<ThinkingIndicatorProps> = (props) => {
  const config = getThinkingIndicatorConfig();
  const visible = () => shouldShowThinking(props.isComputing, props.content, config);
  const displayText = () => {
    if (props.content && props.content.trim().length > 0) {
      return trimLines(props.content, config.maxLines);
    }
    return config.idleLabel;
  };

  return visible() ? (
    <div
      style={{
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        'background-color': 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        'border-radius': 'var(--border-radius-md)',
        'margin-bottom': 'var(--spacing-sm)',
        'white-space': 'pre-wrap',
      }}
    >
      {displayText()}
    </div>
  ) : null;
};
