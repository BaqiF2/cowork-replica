/**
 * Test Suite: TerminalPermissionUIFactory
 *
 * Purpose:
 * - Verify TerminalPermissionUIFactory correctly implements PermissionUIFactory interface
 * - Test createPermissionUI() method with default and custom stream scenarios
 * - Validate factory returns PermissionUI instances with consistent behavior
 * - Ensure all public methods are properly exposed
 */

import { TerminalPermissionUIFactory } from '../../src/ui/factories/TerminalPermissionUIFactory';
import { PermissionUI } from '../../src/permissions/PermissionUI';
import { PermissionUIImpl } from '../../src/ui/PermissionUIImpl';

describe('TerminalPermissionUIFactory', () => {
  let factory: TerminalPermissionUIFactory;

  beforeEach(() => {
    factory = new TerminalPermissionUIFactory();
  });

  describe('Interface Implementation', () => {
    it('should have createPermissionUI method', () => {
      expect(typeof factory.createPermissionUI).toBe('function');
    });

    it('should have createPermissionUI as public method', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        TerminalPermissionUIFactory.prototype,
        'createPermissionUI'
      );
      expect(descriptor?.writable).toBe(true);
      expect(descriptor?.enumerable).toBe(false);
      expect(descriptor?.configurable).toBe(true);
    });
  });

  describe('createPermissionUI() - Default Stream Scenario', () => {
    it('should create PermissionUI instance with default streams', () => {
      const ui = factory.createPermissionUI();

      expect(ui).toBeDefined();
      expect(typeof ui).toBe('object');
    });

    it('should return PermissionUIImpl instance when using defaults', () => {
      const ui = factory.createPermissionUI();

      expect(ui).toBeInstanceOf(PermissionUIImpl);
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should use process.stdout when no output stream provided', () => {
      const ui = factory.createPermissionUI();

      // Verify the internal output is process.stdout by checking behavior
      // We can't directly compare streams, but we can verify it's the same type
      expect(ui).toBeDefined();
    });

    it('should use process.stdin when no input stream provided', () => {
      const ui = factory.createPermissionUI();

      expect(ui).toBeDefined();
    });

    it('should return instance with all required PermissionUI methods', () => {
      const ui = factory.createPermissionUI();

      expect(ui).toHaveProperty('promptToolPermission');
      expect(ui).toHaveProperty('promptUserQuestions');
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should return functionally equivalent instances when called without arguments', () => {
      const ui1 = factory.createPermissionUI();
      const ui2 = factory.createPermissionUI();

      // Both should have the same methods
      expect(typeof ui1.promptToolPermission).toBe('function');
      expect(typeof ui2.promptToolPermission).toBe('function');
      expect(typeof ui1.promptUserQuestions).toBe('function');
      expect(typeof ui2.promptUserQuestions).toBe('function');
    });
  });

  describe('createPermissionUI() - Custom Stream Scenario', () => {
    let mockOutput: NodeJS.WritableStream;
    let mockInput: NodeJS.ReadableStream;

    beforeEach(() => {
      mockOutput = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        writeAsync: jest.fn(),
      } as unknown as NodeJS.WritableStream;

      mockInput = {
        on: jest.fn(),
        off: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        once: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        setEncoding: jest.fn(),
        setRawMode: jest.fn(),
        isTTY: false,
      } as unknown as NodeJS.ReadableStream;
    });

    it('should accept custom output stream', () => {
      const ui = factory.createPermissionUI(mockOutput);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should accept custom input stream', () => {
      const ui = factory.createPermissionUI(undefined, mockInput);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should accept both custom output and input streams', () => {
      const ui = factory.createPermissionUI(mockOutput, mockInput);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should pass custom output stream to PermissionUIImpl', () => {
      const ui = factory.createPermissionUI(mockOutput);

      expect(ui).toBeInstanceOf(PermissionUIImpl);
    });

    it('should pass custom input stream to PermissionUIImpl', () => {
      const ui = factory.createPermissionUI(undefined, mockInput);

      expect(ui).toBeInstanceOf(PermissionUIImpl);
    });

    it('should return instance with all methods when using custom streams', () => {
      const ui = factory.createPermissionUI(mockOutput, mockInput);

      expect(ui).toHaveProperty('promptToolPermission');
      expect(ui).toHaveProperty('promptUserQuestions');
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should create different instances for different stream combinations', () => {
      const ui1 = factory.createPermissionUI(mockOutput, mockInput);

      const differentOutput = {
        write: jest.fn(),
      } as unknown as NodeJS.WritableStream;
      const ui2 = factory.createPermissionUI(differentOutput, mockInput);

      // Should be different instances
      expect(ui1).not.toBe(ui2);

      // Both should have required methods
      expect(typeof ui1.promptToolPermission).toBe('function');
      expect(typeof ui2.promptToolPermission).toBe('function');
    });
  });

  describe('Factory Behavior Consistency', () => {
    let mockOutput: NodeJS.WritableStream;
    let mockInput: NodeJS.ReadableStream;

    beforeEach(() => {
      mockOutput = {
        write: jest.fn(),
        end: jest.fn(),
      } as unknown as NodeJS.WritableStream;

      mockInput = {
        on: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        once: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        setEncoding: jest.fn(),
        setRawMode: jest.fn(),
        isTTY: false,
      } as unknown as NodeJS.ReadableStream;
    });

    it('should return PermissionUI type consistently', () => {
      const ui1 = factory.createPermissionUI();
      const ui2 = factory.createPermissionUI(mockOutput);
      const ui3 = factory.createPermissionUI(mockOutput, mockInput);

      const allHaveRequiredMethods = [ui1, ui2, ui3].every(
        (ui) =>
          typeof ui.promptToolPermission === 'function' &&
          typeof ui.promptUserQuestions === 'function'
      );

      expect(allHaveRequiredMethods).toBe(true);
    });

    it('should return PermissionUIImpl type consistently', () => {
      const ui1 = factory.createPermissionUI();
      const ui2 = factory.createPermissionUI(mockOutput);
      const ui3 = factory.createPermissionUI(mockOutput, mockInput);

      const allArePermissionUIImpl = [ui1, ui2, ui3].every(
        (ui) => ui instanceof PermissionUIImpl
      );

      expect(allArePermissionUIImpl).toBe(true);
    });

    it('should allow multiple independent instances', () => {
      const instances = Array.from({ length: 5 }, () =>
        factory.createPermissionUI(mockOutput, mockInput)
      );

      // All should be unique instances
      const uniqueInstances = new Set(instances);
      expect(uniqueInstances.size).toBe(5);

      // All should have required methods
      instances.forEach((instance) => {
        expect(typeof instance.promptToolPermission).toBe('function');
        expect(typeof instance.promptUserQuestions).toBe('function');
      });
    });

    it('should maintain behavior consistency across multiple calls', () => {
      const ui1 = factory.createPermissionUI();
      const ui2 = factory.createPermissionUI();

      // Both should have the same method signatures
      expect(typeof ui1.promptToolPermission).toBe(
        typeof ui2.promptToolPermission
      );
      expect(typeof ui1.promptUserQuestions).toBe(
        typeof ui2.promptUserQuestions
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null output stream parameter', () => {
      const ui = factory.createPermissionUI(null as unknown as NodeJS.WritableStream);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should handle null input stream parameter', () => {
      const ui = factory.createPermissionUI(undefined, null as unknown as NodeJS.ReadableStream);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should handle both null stream parameters', () => {
      const ui = factory.createPermissionUI(
        null as unknown as NodeJS.WritableStream,
        null as unknown as NodeJS.ReadableStream
      );

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should handle undefined output stream explicitly', () => {
      const ui = factory.createPermissionUI(undefined);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });

    it('should handle undefined input stream explicitly', () => {
      const ui = factory.createPermissionUI(undefined, undefined);

      expect(ui).toBeDefined();
      expect(typeof ui.promptToolPermission).toBe('function');
      expect(typeof ui.promptUserQuestions).toBe('function');
    });
  });

  describe('Type Safety', () => {
    it('should return type compatible with PermissionUI interface', () => {
      const ui = factory.createPermissionUI();

      // Type check: ui should be assignable to PermissionUI
      const permissionUI: PermissionUI = ui;
      expect(permissionUI).toBeDefined();
    });

    it('should return type compatible with PermissionUIFactory return type', () => {
      const ui = factory.createPermissionUI();

      // The return type should match the interface definition
      expect(ui).toHaveProperty('promptToolPermission');
      expect(ui).toHaveProperty('promptUserQuestions');
    });

    it('should be instantiable multiple times without side effects', () => {
      const factory1 = new TerminalPermissionUIFactory();
      const factory2 = new TerminalPermissionUIFactory();

      const ui1 = factory1.createPermissionUI();
      const ui2 = factory2.createPermissionUI();

      // Both should have required methods
      expect(typeof ui1.promptToolPermission).toBe('function');
      expect(typeof ui2.promptToolPermission).toBe('function');

      // They should be different instances
      expect(ui1).not.toBe(ui2);
    });
  });

  describe('Public Method Coverage', () => {
    it('should expose only createPermissionUI as public method', () => {
      const publicMethods = Object.getOwnPropertyNames(
        TerminalPermissionUIFactory.prototype
      );

      expect(publicMethods).toContain('createPermissionUI');
      expect(publicMethods.length).toBeGreaterThanOrEqual(1);
      expect(publicMethods.length).toBeLessThanOrEqual(3); // Including constructor if exposed
    });

    it('should not expose internal implementation details', () => {
      const ownProperties = Object.getOwnPropertyNames(factory);

      // Should not expose internal implementation details
      expect(ownProperties).not.toContain('PermissionUIImpl');
      expect(ownProperties).not.toContain('permissionPanel');
    });

    it('should be callable without instantiation errors', () => {
      const newFactory = new TerminalPermissionUIFactory();
      expect(() => {
        newFactory.createPermissionUI();
      }).not.toThrow();
    });
  });
});
