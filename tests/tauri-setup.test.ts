/**
 * Tauri Project Initialization Test
 *
 * Tests the Tauri project structure, configuration files, and build workflow.
 *
 * Validates:
 * - Tauri project directory structure exists
 * - tauri.conf.json is properly configured
 * - package.json includes Tauri dev and build scripts
 * - macOS permissions are correctly set
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TAURI_DIR = path.join(PROJECT_ROOT, 'src-tauri');
const TAURI_CONF_PATH = path.join(TAURI_DIR, 'tauri.conf.json');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

describe('Tauri Project Setup', () => {
  describe('Project Structure', () => {
    test('src-tauri directory should exist', () => {
      expect(fs.existsSync(TAURI_DIR)).toBe(true);
      expect(fs.statSync(TAURI_DIR).isDirectory()).toBe(true);
    });

    test('tauri.conf.json should exist', () => {
      expect(fs.existsSync(TAURI_CONF_PATH)).toBe(true);
      expect(fs.statSync(TAURI_CONF_PATH).isFile()).toBe(true);
    });

    test('Cargo.toml should exist in src-tauri', () => {
      const cargoPath = path.join(TAURI_DIR, 'Cargo.toml');
      expect(fs.existsSync(cargoPath)).toBe(true);
    });

    test('src/main.rs should exist in src-tauri', () => {
      const mainRsPath = path.join(TAURI_DIR, 'src', 'main.rs');
      expect(fs.existsSync(mainRsPath)).toBe(true);
    });
  });

  describe('Tauri Configuration', () => {
    let tauriConfig: any;

    beforeAll(() => {
      const configContent = fs.readFileSync(TAURI_CONF_PATH, 'utf-8');
      tauriConfig = JSON.parse(configContent);
    });

    test('tauri.conf.json should have valid structure', () => {
      expect(tauriConfig).toBeDefined();
      expect(tauriConfig.build).toBeDefined();
      expect(tauriConfig.bundle).toBeDefined();
      expect(tauriConfig.app).toBeDefined();
    });

    test('should configure macOS file system permissions', () => {
      const macosConfig = tauriConfig.bundle?.macOS;
      expect(macosConfig).toBeDefined();

      // Check for entitlements file
      const entitlements = macosConfig?.entitlements;
      expect(entitlements).toBeDefined();
      expect(entitlements).toContain('entitlements.plist');

      // Check if entitlements file exists
      const entitlementsPath = path.join(TAURI_DIR, 'entitlements.plist');
      expect(fs.existsSync(entitlementsPath)).toBe(true);
    });

    test('should configure macOS notification permissions', () => {
      const macosConfig = tauriConfig.bundle?.macOS;
      expect(macosConfig).toBeDefined();

      // Check for notification plugin configuration
      const notificationConfig = tauriConfig.plugins?.notification;
      expect(notificationConfig).toBeDefined();
      expect(notificationConfig?.all).toBe(true);
    });

    test('should have proper build configuration', () => {
      expect(tauriConfig.build?.frontendDist).toBeDefined();
      expect(tauriConfig.build?.beforeDevCommand).toBeDefined();
      expect(tauriConfig.build?.beforeBuildCommand).toBeDefined();
    });
  });

  describe('Package Scripts', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8');
      packageJson = JSON.parse(packageContent);
    });

    test('should have tauri:dev script', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts['tauri:dev']).toBeDefined();
      expect(packageJson.scripts['tauri:dev']).toContain('tauri dev');
    });

    test('should have tauri:build script', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts['tauri:build']).toBeDefined();
      expect(packageJson.scripts['tauri:build']).toContain('tauri build');
    });

    test('should have @tauri-apps/cli as dependency', () => {
      const hasTauriCli =
        (packageJson.dependencies && packageJson.dependencies['@tauri-apps/cli']) ||
        (packageJson.devDependencies && packageJson.devDependencies['@tauri-apps/cli']);

      expect(hasTauriCli).toBeDefined();
    });
  });

  describe('Build Workflow', () => {
    test('tauri.conf.json should specify correct build paths', () => {
      const configContent = fs.readFileSync(TAURI_CONF_PATH, 'utf-8');
      const tauriConfig = JSON.parse(configContent);

      // Build output should point to a valid directory
      expect(tauriConfig.build?.frontendDist).toBeTruthy();

      // Build commands should be defined
      expect(tauriConfig.build?.beforeDevCommand).toBeTruthy();
      expect(tauriConfig.build?.beforeBuildCommand).toBeTruthy();
    });

    test('should configure beforeDevCommand for development', () => {
      const configContent = fs.readFileSync(TAURI_CONF_PATH, 'utf-8');
      const tauriConfig = JSON.parse(configContent);

      // Should have a command to prepare frontend before dev mode
      expect(tauriConfig.build?.beforeDevCommand).toBeDefined();
      expect(typeof tauriConfig.build.beforeDevCommand).toBe('string');
    });

    test('should configure beforeBuildCommand for production', () => {
      const configContent = fs.readFileSync(TAURI_CONF_PATH, 'utf-8');
      const tauriConfig = JSON.parse(configContent);

      // Should have a command to build frontend before production build
      expect(tauriConfig.build?.beforeBuildCommand).toBeDefined();
      expect(typeof tauriConfig.build.beforeBuildCommand).toBe('string');
    });
  });
});
