/**
 * Message Serialization Tests
 */

import { describe, test, expect } from '@jest/globals';
import * as MessageSerializer from '../../src/ui/implementations/desktop/MessageSerializer';

describe('Message Serialization', () => {
  describe('IPCMessage Interface', () => {
    test('should define MessageSerializer functions', () => {
      expect(MessageSerializer).toBeDefined();
      expect(MessageSerializer.serialize).toBeDefined();
      expect(MessageSerializer.deserialize).toBeDefined();
      expect(MessageSerializer.createMessage).toBeDefined();
    });
  });

  describe('Simple Object Serialization', () => {
    test('should serialize simple object', () => {
      const obj = { name: 'test', value: 42 };
      const serialized = MessageSerializer.serialize(obj);

      expect(typeof serialized).toBe('string');
      const deserialized = MessageSerializer.deserialize(serialized);
      expect(deserialized).toEqual(obj);
    });

    test('should handle null values', () => {
      const obj = { a: null, c: 'value' };
      const serialized = MessageSerializer.serialize(obj);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized.a).toBeNull();
      expect(deserialized.c).toBe('value');
    });

    test('should serialize arrays', () => {
      const arr = [1, 2, 3, 'test', { nested: true }];
      const serialized = MessageSerializer.serialize(arr);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toEqual(arr);
    });
  });

  describe('Complex Object Serialization', () => {
    test('should serialize nested objects', () => {
      const complex = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              number: 123,
              array: [1, 2, { nested: true }]
            }
          }
        },
        topLevel: 'test'
      };

      const serialized = MessageSerializer.serialize(complex);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toEqual(complex);
    });

    test('should handle mixed types in objects', () => {
      const mixed = {
        string: 'text',
        number: 42,
        boolean: true,
        null_value: null,
        array: [1, 'two', { three: 3 }],
        nested: {
          inner: 'value'
        }
      };

      const serialized = MessageSerializer.serialize(mixed);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toEqual(mixed);
    });
  });

  describe('Error Object Serialization', () => {
    test('should serialize Error objects', () => {
      const error = new Error('Test error message');
      error.name = 'TestError';

      const serialized = MessageSerializer.serialize(error);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(Error);
      expect(deserialized.message).toBe('Test error message');
      expect(deserialized.name).toBe('TestError');
    });

    test('should preserve error stack trace', () => {
      const error = new Error('Stack test');

      const serialized = MessageSerializer.serialize(error);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized.stack).toBeDefined();
      expect(typeof deserialized.stack).toBe('string');
    });

    test('should handle custom error properties', () => {
      const error: any = new Error('Custom error');
      error.code = 'ERR_CUSTOM';
      error.statusCode = 404;

      const serialized = MessageSerializer.serialize(error);
      const deserialized: any = MessageSerializer.deserialize(serialized);

      expect(deserialized.message).toBe('Custom error');
      expect(deserialized.code).toBe('ERR_CUSTOM');
      expect(deserialized.statusCode).toBe(404);
    });
  });

  describe('Date Object Serialization', () => {
    test('should serialize Date objects', () => {
      const now = new Date('2024-01-20T12:00:00Z');
      const serialized = MessageSerializer.serialize(now);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(Date);
      expect(deserialized.getTime()).toBe(now.getTime());
    });

    test('should handle Dates in nested objects', () => {
      const obj = {
        timestamp: new Date('2024-01-20T12:00:00Z'),
        data: {
          created: new Date('2024-01-19T12:00:00Z'),
          value: 'test'
        }
      };

      const serialized = MessageSerializer.serialize(obj);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized.timestamp).toBeInstanceOf(Date);
      expect(deserialized.data.created).toBeInstanceOf(Date);
      expect(deserialized.timestamp.getTime()).toBe(obj.timestamp.getTime());
      expect(deserialized.data.created.getTime()).toBe(obj.data.created.getTime());
    });
  });

  describe('IPCMessage Protocol', () => {
    test('should create valid IPC message structure', () => {
      const message = MessageSerializer.createMessage({
        event: 'test_event',
        payload: { data: 'test' }
      });

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('event');
      expect(message).toHaveProperty('payload');
      expect(message.event).toBe('test_event');
      expect(message.payload).toEqual({ data: 'test' });
    });

    test('should generate unique message IDs', () => {
      const msg1 = MessageSerializer.createMessage({ event: 'test1' });
      const msg2 = MessageSerializer.createMessage({ event: 'test2' });

      expect(msg1.id).not.toBe(msg2.id);
    });

    test('should include timestamp in messages', () => {
      const message = MessageSerializer.createMessage({ event: 'test' });

      expect(message).toHaveProperty('timestamp');
      expect(message.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty objects', () => {
      const empty = {};
      const serialized = MessageSerializer.serialize(empty);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toEqual(empty);
    });

    test('should handle empty arrays', () => {
      const empty: any[] = [];
      const serialized = MessageSerializer.serialize(empty);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized).toEqual(empty);
    });

    test('should handle large objects', () => {
      const large = {
        data: new Array(1000).fill(null).map((_, i) => ({
          id: i,
          value: `item_${i}`
        }))
      };

      const serialized = MessageSerializer.serialize(large);
      const deserialized = MessageSerializer.deserialize(serialized);

      expect(deserialized.data).toHaveLength(1000);
      expect(deserialized.data[0]).toEqual({ id: 0, value: 'item_0' });
    });
  });
});
