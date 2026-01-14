/**
 * UI Configuration Tests
 *
 * Tests the UI configuration support in the configuration system.
 */

import { UIConfig } from '../../src/config/SDKConfigLoader';

describe('UIConfig Interface', () => {
  describe('UIConfig type definition', () => {
    it('should have required type field', () => {
      const uiConfig: UIConfig = {
        type: 'terminal',
      };

      expect(uiConfig.type).toBe('terminal');
      expect(uiConfig.options).toBeUndefined();
    });

    it('should accept optional options field', () => {
      const uiConfig: UIConfig = {
        type: 'terminal',
        options: {
          theme: 'dark',
          timeout: 5000,
        },
      };

      expect(uiConfig.type).toBe('terminal');
      expect(uiConfig.options).toBeDefined();
      expect(uiConfig.options?.theme).toBe('dark');
      expect(uiConfig.options?.timeout).toBe(5000);
    });

    it('should accept different UI types', () => {
      const terminalConfig: UIConfig = {
        type: 'terminal',
      };

      const webConfig: UIConfig = {
        type: 'web',
      };

      const guiConfig: UIConfig = {
        type: 'gui',
      };

      expect(terminalConfig.type).toBe('terminal');
      expect(webConfig.type).toBe('web');
      expect(guiConfig.type).toBe('gui');
    });
  });
});
