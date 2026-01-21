/**
 * Input box component for chat.
 */

import { createSignal, type Component } from 'solid-js';
import { getInputBoxConfig, isSubmitShortcut } from './inputBoxUtils';

export interface InputBoxProps {
  disabled?: boolean;
  initialValue?: string;
  onSend: (message: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const InputBox: Component<InputBoxProps> = (props) => {
  const config = getInputBoxConfig();
  const [value, setValue] = createSignal(props.initialValue ?? '');

  const handleSend = () => {
    const message = value().trim();
    if (!message) {
      return;
    }
    props.onSend(message);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const shouldSubmit = isSubmitShortcut(
      {
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      },
      config
    );
    if (shouldSubmit) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        'align-items': 'center',
      }}
    >
      <textarea
        value={value()}
        disabled={props.disabled}
        maxLength={props.maxLength ?? config.maxLength}
        placeholder={props.placeholder ?? config.placeholder}
        onInput={(event) => setValue(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        style={{
          flex: '1',
          resize: 'none',
          padding: 'var(--spacing-sm)',
          border: '1px solid var(--border-default)',
          'border-radius': 'var(--border-radius-md)',
          'background-color': 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          'min-height': 'var(--spacing-xl)',
        }}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={props.disabled}
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          'background-color': 'var(--accent-primary)',
          border: 'none',
          'border-radius': 'var(--border-radius-md)',
          color: 'var(--text-inverse)',
          cursor: 'pointer',
        }}
      >
        Send
      </button>
    </div>
  );
};
