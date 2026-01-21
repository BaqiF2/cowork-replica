import { Show, createSignal, onCleanup, type Component } from 'solid-js';
import { ipcService } from '../../services/ipcService';
import {
  buildPermissionResponse,
  getPermissionModalConfig,
  mapPermissionRequest,
  type PermissionDecision,
  type PermissionModalState,
  type PermissionRequestPayload,
} from './permissionModalUtils';
import { getEnv } from '../../utils/env';

export interface PermissionModalProps {
  onDecision?: (payload: PermissionRequestPayload, decision: PermissionDecision) => void;
}

const PERMISSION_REQUEST_EVENT = getEnv('COWORK_PERMISSION_REQUEST_EVENT', 'permission_request');
const PERMISSION_RESPONSE_EVENT = getEnv('COWORK_PERMISSION_RESPONSE_EVENT', 'permission_response');

export const PermissionModal: Component<PermissionModalProps> = (props) => {
  const [visible, setVisible] = createSignal(false);
  const [requestPayload, setRequestPayload] = createSignal<PermissionRequestPayload | null>(null);
  const [state, setState] = createSignal<PermissionModalState | null>(null);
  const config = getPermissionModalConfig();

  const handleRequest = (payload: PermissionRequestPayload) => {
    const mapped = mapPermissionRequest(payload);
    setRequestPayload(payload);
    setState(mapped);
    setVisible(true);
  };

  const clear = () => {
    setVisible(false);
    setState(null);
    setRequestPayload(null);
  };

  const sendDecision = async (decision: PermissionDecision) => {
    const payload = requestPayload();
    const current = state();
    if (!payload || !current) {
      return;
    }
    const response = buildPermissionResponse(current.toolUseID, decision, config);
    await ipcService.emit(PERMISSION_RESPONSE_EVENT, response);
    props.onDecision?.(payload, decision);
    clear();
  };

  ipcService.on(PERMISSION_REQUEST_EVENT, handleRequest);
  onCleanup(() => {
    ipcService.off(PERMISSION_REQUEST_EVENT, handleRequest);
  });

  return (
    <Show when={visible() && state()}>
      <div
        style={{
          position: 'fixed',
          inset: '0',
          'background-color': 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': 'var(--z-index-modal)',
        }}
      >
        <div
          style={{
            width: 'min(520px, 90vw)',
            padding: 'var(--spacing-lg)',
            'background-color': 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            'border-radius': 'var(--border-radius-lg)',
            color: 'var(--text-primary)',
            display: 'flex',
            'flex-direction': 'column',
            gap: 'var(--spacing-md)',
          }}
        >
          <h3 style={{ margin: '0' }}>Permission Request</h3>
          <div>
            <div style={{ color: 'var(--text-tertiary)' }}>Tool</div>
            <div>{state()!.toolName}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-tertiary)' }}>Target</div>
            <div>{state()!.targetSummary}</div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              'justify-content': 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => void sendDecision('allow')}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--border-default)',
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {config.allowOnceLabel}
            </button>
            <button
              type="button"
              onClick={() => void sendDecision('allow_always')}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--border-default)',
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                cursor: 'pointer',
              }}
            >
              {config.allowAlwaysLabel}
            </button>
            <button
              type="button"
              onClick={() => void sendDecision('deny')}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: '1px solid var(--border-default)',
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--accent-error)',
                color: 'var(--text-inverse)',
                cursor: 'pointer',
              }}
            >
              {config.denyLabel}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
