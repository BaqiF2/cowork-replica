import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { SDKConfigLoader, ProjectConfig } from '../../src/config/SDKConfigLoader';

const TEMP_DIR_PREFIX =
  process.env.CHECKPOINT_CONFIG_TEMP_DIR_PREFIX || 'checkpoint-config-';
const JSON_INDENT = parseInt(process.env.CHECKPOINT_CONFIG_JSON_INDENT || '2', 10);
const DEFAULT_CHECKPOINT_KEEP_COUNT = parseInt(
  process.env.CLAUDE_CODE_CHECKPOINT_KEEP_COUNT || '10',
  10
);

describe('checkpoint configuration', () => {
  let tempDir: string;
  let configPath: string;
  let loader: SDKConfigLoader;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
    configPath = path.join(tempDir, '.claude', 'settings.json');
    loader = new SDKConfigLoader();
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('loads checkpoint options from project config', async () => {
    const config = {
      enableFileCheckpointing: false,
      checkpointKeepCount: 12,
    };

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, JSON_INDENT));

    const projectConfig = await loader.loadProjectConfig(tempDir);

    expect(projectConfig.enableFileCheckpointing).toBe(false);
    expect(projectConfig.checkpointKeepCount).toBe(12);
  });

  it('applies default checkpoint options when missing', async () => {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify({}, null, JSON_INDENT));

    const projectConfig = await loader.loadProjectConfig(tempDir);

    expect(projectConfig.enableFileCheckpointing).toBe(true);
    expect(projectConfig.checkpointKeepCount).toBe(DEFAULT_CHECKPOINT_KEEP_COUNT);
  });

  it('warns when env var is missing but config enables checkpointing', () => {
    delete process.env.CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING;
    const projectConfig: ProjectConfig = {
      enableFileCheckpointing: true,
      checkpointKeepCount: DEFAULT_CHECKPOINT_KEEP_COUNT,
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    loader.validateCheckpointEnvironment(projectConfig);

    expect(warnSpy).toHaveBeenCalledWith(
      'Warning: File checkpointing enabled in config but environment variable not set'
    );
    expect(warnSpy).toHaveBeenCalledWith(
      'Set CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING=1 to enable SDK checkpointing'
    );

    warnSpy.mockRestore();
  });
});
