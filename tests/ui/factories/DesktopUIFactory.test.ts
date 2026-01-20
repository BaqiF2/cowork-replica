/**
 * DesktopUIFactory Tests
 *
 * Tests for Desktop UI Factory implementation:
 * - Scenario: 创建 DesktopUIFactory 实例
 * - Scenario: 创建 InteractiveUI 实例
 * - Scenario: 创建其他 UI 组件
 *
 * _Requirements: DesktopUIFactory 实现_
 * _TaskGroup: 7_
 */

import { DesktopUIFactory } from '../../../src/ui/factories/DesktopUIFactory';
import type { UIFactory } from '../../../src/ui/contracts/core/UIFactory';
import type { ParserInterface } from '../../../src/ui/contracts/core/ParserInterface';
import type { OutputInterface } from '../../../src/ui/contracts/core/OutputInterface';
import type { PermissionUI } from '../../../src/permissions/PermissionUI';
import type { InteractiveUIInterface } from '../../../src/ui/contracts/interactive/InteractiveUIInterface';

describe('DesktopUIFactory', () => {
  let factory: DesktopUIFactory;

  beforeEach(() => {
    factory = new DesktopUIFactory();
  });

  describe('Scenario: 创建 DesktopUIFactory 实例', () => {
    it('should create a DesktopUIFactory instance', () => {
      expect(factory).toBeDefined();
      expect(factory).toBeInstanceOf(DesktopUIFactory);
    });

    it('should implement UIFactory interface', () => {
      // Check that factory has all UIFactory methods
      expect(typeof factory.createParser).toBe('function');
      expect(typeof factory.createOutput).toBe('function');
      expect(typeof factory.createPermissionUI).toBe('function');
      expect(typeof factory.createInteractiveUI).toBe('function');
    });

    it('should be assignable to UIFactory type', () => {
      // TypeScript compile-time check
      const uiFactory: UIFactory = factory;
      expect(uiFactory).toBe(factory);
    });
  });

  describe('Scenario: 创建 InteractiveUI 实例', () => {
    it('should create InteractiveUI with callbacks', () => {
      const callbacks = {
        onMessage: jest.fn(),
        onInterrupt: jest.fn(),
        onRewind: jest.fn(),
      };

      const interactiveUI = factory.createInteractiveUI(callbacks);

      expect(interactiveUI).toBeDefined();
      // Verify it has required InteractiveUIInterface methods
      expect(typeof interactiveUI.start).toBe('function');
      expect(typeof interactiveUI.stop).toBe('function');
    });

    it('should create InteractiveUI with config', () => {
      const callbacks = {
        onMessage: jest.fn(),
        onInterrupt: jest.fn(),
        onRewind: jest.fn(),
      };
      const config = {
        enableColors: true,
      };

      const interactiveUI = factory.createInteractiveUI(callbacks, config);

      expect(interactiveUI).toBeDefined();
    });

    it('should return InteractiveUIInterface compatible instance', () => {
      const callbacks = {
        onMessage: jest.fn(),
        onInterrupt: jest.fn(),
        onRewind: jest.fn(),
      };

      const interactiveUI: InteractiveUIInterface = factory.createInteractiveUI(callbacks);

      // Verify CORE methods exist
      expect(typeof interactiveUI.displayMessage).toBe('function');
      expect(typeof interactiveUI.displayToolUse).toBe('function');
      expect(typeof interactiveUI.displayToolResult).toBe('function');
      expect(typeof interactiveUI.displayThinking).toBe('function');
      expect(typeof interactiveUI.displayComputing).toBe('function');
      expect(typeof interactiveUI.stopComputing).toBe('function');
      expect(typeof interactiveUI.clearProgress).toBe('function');
      expect(typeof interactiveUI.displayError).toBe('function');
      expect(typeof interactiveUI.displayWarning).toBe('function');
      expect(typeof interactiveUI.displaySuccess).toBe('function');
      expect(typeof interactiveUI.displayInfo).toBe('function');
    });
  });

  describe('Scenario: 创建其他 UI 组件', () => {
    it('should create Parser instance', () => {
      const parser = factory.createParser();

      expect(parser).toBeDefined();
      // Verify it has ParserInterface methods
      expect(typeof parser.parseArgs).toBe('function');
    });

    it('should return ParserInterface compatible instance', () => {
      const parser: ParserInterface = factory.createParser();
      expect(parser).toBeDefined();
    });

    it('should create Output instance', () => {
      const output = factory.createOutput();

      expect(output).toBeDefined();
      // Verify it has OutputInterface methods
      expect(typeof output.display).toBe('function');
    });

    it('should return OutputInterface compatible instance', () => {
      const output: OutputInterface = factory.createOutput();
      expect(output).toBeDefined();
    });

    it('should create PermissionUI instance', () => {
      const permissionUI = factory.createPermissionUI();

      expect(permissionUI).toBeDefined();
      // Verify it has PermissionUI methods
      expect(typeof permissionUI.promptToolPermission).toBe('function');
    });

    it('should return PermissionUI compatible instance', () => {
      const permissionUI: PermissionUI = factory.createPermissionUI();
      expect(permissionUI).toBeDefined();
    });

    it('should create PermissionUI with custom streams', () => {
      const mockOutput = { write: jest.fn() } as unknown as NodeJS.WritableStream;
      const mockInput = { on: jest.fn() } as unknown as NodeJS.ReadableStream;

      const permissionUI = factory.createPermissionUI(mockOutput, mockInput);

      expect(permissionUI).toBeDefined();
    });
  });

  describe('Factory method isolation', () => {
    it('should create new instances on each call', () => {
      const parser1 = factory.createParser();
      const parser2 = factory.createParser();

      expect(parser1).not.toBe(parser2);
    });

    it('should create independent InteractiveUI instances', () => {
      const callbacks1 = {
        onMessage: jest.fn(),
        onInterrupt: jest.fn(),
        onRewind: jest.fn(),
      };
      const callbacks2 = {
        onMessage: jest.fn(),
        onInterrupt: jest.fn(),
        onRewind: jest.fn(),
      };

      const ui1 = factory.createInteractiveUI(callbacks1);
      const ui2 = factory.createInteractiveUI(callbacks2);

      expect(ui1).not.toBe(ui2);
    });
  });
});
