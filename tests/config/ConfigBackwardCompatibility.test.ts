/**
 * Configuration Backward Compatibility Tests
 *
 * Tests that the configuration system maintains backward compatibility
 * when legacy UI configuration fields appear in settings.
 */

import { SDKConfigLoader } from '../../src/config/SDKConfigLoader';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Config Backward Compatibility', () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(__dirname, 'temp-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    configPath = path.join(tempDir, '.claude', 'settings.json');
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe('Config without ui field', () => {
    it('should parse configuration without ui field', async () => {
      const oldConfig = {
        model: 'claude-3-5-sonnet-20241022',
        permissionMode: 'acceptEdits',
        maxTurns: 10,
      };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(oldConfig, null, 2));

      const loader = new SDKConfigLoader();
      const config = await loader.loadProjectConfig(tempDir);
      const configWithUIResult = config as { ui?: unknown };

      expect(config.model).toBe('claude-3-5-sonnet-20241022');
      expect(config.permissionMode).toBe('acceptEdits');
      expect(config.maxTurns).toBe(10);
      expect(configWithUIResult.ui).toBeUndefined();
    });

    it('should have undefined ui when not specified', async () => {
      const minimalConfig = {};

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(minimalConfig, null, 2));

      const loader = new SDKConfigLoader();
      const config = await loader.loadProjectConfig(tempDir);
      const configWithUIResult = config as { ui?: unknown };

      expect(configWithUIResult.ui).toBeUndefined();
    });
  });

  describe('Config with ui field', () => {
    it('should ignore configuration ui field', async () => {
      const configWithUI = {
        model: 'claude-3-5-sonnet-20241022',
        permissionMode: 'acceptEdits',
        ui: {
          type: 'terminal',
          options: {
            theme: 'dark',
          },
        },
      };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(configWithUI, null, 2));

      const loader = new SDKConfigLoader();
      const config = await loader.loadProjectConfig(tempDir);
      const configWithUIResult = config as { ui?: unknown };

      expect(configWithUIResult.ui).toBeUndefined();
    });

    it('should ignore minimal ui configuration', async () => {
      const configWithMinimalUI = {
        ui: {
          type: 'terminal',
        },
      };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(configWithMinimalUI, null, 2));

      const loader = new SDKConfigLoader();
      const config = await loader.loadProjectConfig(tempDir);
      const configWithUIResult = config as { ui?: unknown };

      expect(configWithUIResult.ui).toBeUndefined();
    });
  });

  describe('Mixed configurations', () => {
    it('should handle all permission fields without ui', async () => {
      const fullConfigWithoutUI = {
        model: 'claude-3-5-sonnet-20241022',
        permissionMode: 'default',
        allowedTools: ['Read', 'Write'],
        disallowedTools: ['Delete'],
        maxTurns: 10,
        maxBudgetUsd: 100,
      };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(fullConfigWithoutUI, null, 2));

      const loader = new SDKConfigLoader();
      const config = await loader.loadProjectConfig(tempDir);
      const configWithUIResult = config as { ui?: unknown };

      expect(config.model).toBe('claude-3-5-sonnet-20241022');
      expect(config.permissionMode).toBe('default');
      expect(config.allowedTools).toEqual(['Read', 'Write']);
      expect(config.disallowedTools).toEqual(['Delete']);
      expect(configWithUIResult.ui).toBeUndefined();
    });

    it('should handle all fields and ignore ui', async () => {
      const fullConfigWithUI = {
        model: 'claude-3-5-sonnet-20241022',
        permissionMode: 'acceptEdits',
        allowedTools: ['Read', 'Write'],
        disallowedTools: ['Delete'],
        ui: {
          type: 'terminal',
          options: {
            theme: 'dark',
            timeout: 5000,
          },
        },
      };

      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(fullConfigWithUI, null, 2));

      const loader = new SDKConfigLoader();
      const config = await loader.loadProjectConfig(tempDir);
      const configWithUIResult = config as { ui?: unknown };

      expect(config.model).toBe('claude-3-5-sonnet-20241022');
      expect(config.permissionMode).toBe('acceptEdits');
      expect(config.allowedTools).toEqual(['Read', 'Write']);
      expect(config.disallowedTools).toEqual(['Delete']);
      expect(configWithUIResult.ui).toBeUndefined();
    });
  });
});
