import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../src/config/ConfigManager';

const TEMP_DIR_PREFIX = process.env.CONFIG_MANAGER_TEMP_DIR_PREFIX || 'config-manager-';
const JSON_INDENT = parseInt(process.env.CONFIG_MANAGER_JSON_INDENT || '2', 10);

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

      const manager = new ConfigManager();
      const permissionConfig = await manager.loadPermissionConfig({}, tempDir);
      const permissionConfigWithUI = permissionConfig as { ui?: unknown };

      expect(permissionConfig.mode).toBe('acceptEdits');
      expect(permissionConfigWithUI.ui).toBeUndefined();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
