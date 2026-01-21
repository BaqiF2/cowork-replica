import { getEnv, getEnvInt } from '../../utils/env';

export interface SubmitShortcutConfig {
  submitKey: string;
  submitOnMeta: boolean;
  submitOnCtrl: boolean;
}

export interface SubmitShortcutState {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface InputBoxConfig extends SubmitShortcutConfig {
  maxLength: number;
  placeholder: string;
}

const DEFAULT_MAX_LENGTH = getEnvInt('COWORK_CHAT_INPUT_MAX_LENGTH', 4000);
const DEFAULT_PLACEHOLDER = getEnv('COWORK_CHAT_INPUT_PLACEHOLDER', 'Type a message');
const DEFAULT_SUBMIT_KEY = getEnv('COWORK_CHAT_INPUT_SUBMIT_KEY', 'Enter');
const SUBMIT_ON_META =
  getEnv('COWORK_CHAT_INPUT_SUBMIT_META', 'true').toLowerCase() === 'true';
const SUBMIT_ON_CTRL =
  getEnv('COWORK_CHAT_INPUT_SUBMIT_CTRL', 'true').toLowerCase() === 'true';

export const getInputBoxConfig = (): InputBoxConfig => ({
  maxLength: DEFAULT_MAX_LENGTH,
  placeholder: DEFAULT_PLACEHOLDER,
  submitKey: DEFAULT_SUBMIT_KEY,
  submitOnMeta: SUBMIT_ON_META,
  submitOnCtrl: SUBMIT_ON_CTRL,
});

export const isSubmitShortcut = (
  state: SubmitShortcutState,
  config: SubmitShortcutConfig = getInputBoxConfig()
): boolean => {
  if (state.key !== config.submitKey) {
    return false;
  }
  return (
    (config.submitOnMeta && state.metaKey) ||
    (config.submitOnCtrl && state.ctrlKey)
  );
};
