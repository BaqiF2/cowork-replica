/**
 * 文件功能：ConfigManager 单元测试
 *
 * 核心测试场景：
 * - 权限配置加载测试
 * - hooks 配置加载测试
 * - 无效 hooks 配置处理测试
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../src/config/ConfigManager';
import { Logger } from '../../src/logging/Logger';

const TEMP_DIR_PREFIX = process.env.CONFIG_MANAGER_TEMP_DIR_PREFIX || 'config-manager-';
const JSON_INDENT = parseInt(process.env.CONFIG_MANAGER_JSON_INDENT || '2', 10);
const logger = new Logger();

describe('ConfigManager', () => {
  it('should ignore legacy ui field when building permission config', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
    const configPath = path.join(tempDir, '.claude', 'settings.json');

    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(
        configPath,
        JSON.stringify(
          {
            permissionMode: 'acceptEdits',
            ui: {
              type: 'terminal',
            },
          },
          null,
          JSON_INDENT
        )
      );

      const manager = new ConfigManager(logger);
      const permissionConfig = await manager.loadPermissionConfig({}, tempDir);
      const permissionConfigWithUI = permissionConfig as { ui?: unknown };

      expect(permissionConfig.mode).toBe('acceptEdits');
      expect(permissionConfigWithUI.ui).toBeUndefined();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('hooks configuration loading', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
      await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should load hooks configuration from settings.json', async () => {
      // GIVEN: settings.json contains hooks field with valid configuration
      const hooksConfig = {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                type: 'command',
                command: 'echo "Pre tool use hook"',
              },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: '*',
            hooks: [
              {
                type: 'prompt',
                prompt: 'Tool $TOOL was executed',
              },
            ],
          },
        ],
      };

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify({ hooks: hooksConfig }, null, JSON_INDENT)
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: hooks configuration is correctly parsed and stored in ProjectConfig.hooks
      expect(projectConfig.hooks).toBeDefined();
      expect(projectConfig.hooks?.PreToolUse).toBeDefined();
      expect(projectConfig.hooks?.PreToolUse).toHaveLength(1);
      expect(projectConfig.hooks?.PreToolUse?.[0].matcher).toBe('Bash');
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks).toHaveLength(1);
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks[0].type).toBe('command');
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks[0].command).toBe('echo "Pre tool use hook"');

      expect(projectConfig.hooks?.PostToolUse).toBeDefined();
      expect(projectConfig.hooks?.PostToolUse).toHaveLength(1);
      expect(projectConfig.hooks?.PostToolUse?.[0].matcher).toBe('*');
      expect(projectConfig.hooks?.PostToolUse?.[0].hooks[0].type).toBe('prompt');
      expect(projectConfig.hooks?.PostToolUse?.[0].hooks[0].prompt).toBe('Tool $TOOL was executed');
    });

    it('should load hooks configuration with script type', async () => {
      // GIVEN: settings.json contains hooks field with script type configuration
      const hooksConfig = {
        UserPromptSubmit: [
          {
            matcher: '*',
            hooks: [
              {
                type: 'script',
                script: './.claude/hooks/validate-prompt.ts',
              },
            ],
          },
        ],
      };

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify({ hooks: hooksConfig }, null, JSON_INDENT)
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: hooks configuration with script type is correctly stored
      expect(projectConfig.hooks?.UserPromptSubmit).toBeDefined();
      expect(projectConfig.hooks?.UserPromptSubmit).toHaveLength(1);
      expect(projectConfig.hooks?.UserPromptSubmit?.[0].hooks[0].type).toBe('script');
      expect(projectConfig.hooks?.UserPromptSubmit?.[0].hooks[0].script).toBe(
        './.claude/hooks/validate-prompt.ts'
      );
    });

    it('should load hooks configuration with multiple events', async () => {
      // GIVEN: settings.json contains hooks for multiple events
      const hooksConfig = {
        PreToolUse: [
          {
            matcher: 'Edit',
            hooks: [{ type: 'command', command: 'echo "editing"' }],
          },
        ],
        PostToolUse: [
          {
            matcher: 'Write',
            hooks: [{ type: 'prompt', prompt: 'File written' }],
          },
        ],
        SessionStart: [
          {
            matcher: '*',
            hooks: [{ type: 'command', command: 'echo "session started"' }],
          },
        ],
        Stop: [
          {
            matcher: '*',
            hooks: [{ type: 'command', command: 'echo "stopped"' }],
          },
        ],
      };

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify({ hooks: hooksConfig }, null, JSON_INDENT)
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: all hook events are correctly loaded
      expect(projectConfig.hooks?.PreToolUse).toHaveLength(1);
      expect(projectConfig.hooks?.PostToolUse).toHaveLength(1);
      expect(projectConfig.hooks?.SessionStart).toHaveLength(1);
      expect(projectConfig.hooks?.Stop).toHaveLength(1);
    });

    it('should return empty hooks when settings.json has no hooks field', async () => {
      // GIVEN: settings.json exists but has no hooks field
      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify({ model: 'claude-3-opus' }, null, JSON_INDENT)
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: hooks field is undefined
      expect(projectConfig.hooks).toBeUndefined();
    });

    it('should return empty hooks when settings.json does not exist', async () => {
      // GIVEN: settings.json does not exist
      // (no file created in tempDir/.claude/settings.json)

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: hooks field is undefined
      expect(projectConfig.hooks).toBeUndefined();
    });

    it('should handle invalid hooks configuration gracefully', async () => {
      // GIVEN: settings.json contains invalid hooks configuration (not an object)
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify({ hooks: 'invalid-string-value' }, null, JSON_INDENT)
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: invalid hooks configuration is skipped and warning is logged
      expect(projectConfig.hooks).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid hooks configuration')
      );

      consoleSpy.mockRestore();
    });

    it('should handle malformed hooks event configuration gracefully', async () => {
      // GIVEN: settings.json contains hooks with malformed event configuration
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify(
          {
            hooks: {
              PreToolUse: 'not-an-array', // invalid: should be an array
              PostToolUse: [
                {
                  matcher: 'Bash',
                  hooks: [{ type: 'command', command: 'echo "valid"' }],
                },
              ],
            },
          },
          null,
          JSON_INDENT
        )
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: invalid event configuration is skipped, valid ones are kept
      expect(projectConfig.hooks?.PreToolUse).toBeUndefined();
      expect(projectConfig.hooks?.PostToolUse).toBeDefined();
      expect(projectConfig.hooks?.PostToolUse).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid hooks configuration for event PreToolUse')
      );

      consoleSpy.mockRestore();
    });

    it('should handle unknown hook event type with warning', async () => {
      // GIVEN: settings.json contains hooks with unknown event type
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify(
          {
            hooks: {
              UnknownEvent: [
                {
                  matcher: '*',
                  hooks: [{ type: 'command', command: 'echo "unknown"' }],
                },
              ],
              PreToolUse: [
                {
                  matcher: 'Bash',
                  hooks: [{ type: 'command', command: 'echo "valid"' }],
                },
              ],
            },
          },
          null,
          JSON_INDENT
        )
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: unknown event is skipped with warning, valid events are kept
      expect(projectConfig.hooks?.PreToolUse).toBeDefined();
      expect((projectConfig.hooks as Record<string, unknown>)?.['UnknownEvent']).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown hook event type: UnknownEvent')
      );

      consoleSpy.mockRestore();
    });

    it('should validate hook definition structure', async () => {
      // GIVEN: settings.json contains hooks with invalid hook definition
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await fs.writeFile(
        path.join(tempDir, '.claude', 'settings.json'),
        JSON.stringify(
          {
            hooks: {
              PreToolUse: [
                {
                  matcher: 'Bash',
                  hooks: [
                    { type: 'command' }, // missing command field
                    { type: 'prompt', prompt: 'valid prompt' },
                  ],
                },
              ],
            },
          },
          null,
          JSON_INDENT
        )
      );

      // WHEN: ConfigManager loads project configuration
      const manager = new ConfigManager(logger);
      const projectConfig = await manager.loadProjectConfig(tempDir);

      // THEN: invalid hook definition is skipped, valid ones are kept
      expect(projectConfig.hooks?.PreToolUse).toBeDefined();
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks).toHaveLength(1);
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks[0].type).toBe('prompt');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid hook definition: command type requires command field')
      );

      consoleSpy.mockRestore();
    });
  });
});
