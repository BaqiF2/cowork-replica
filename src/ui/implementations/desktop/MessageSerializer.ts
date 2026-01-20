/**
 * Message Serialization Module
 *
 * Core functionality:
 * - serialize(): Serialize objects to JSON string with Error and Date support
 * - deserialize(): Deserialize JSON string to objects
 * - createMessage(): Create standard IPC message structure
 *
 * Performance optimizations:
 * - Message ID caching for better uniqueness
 * - Optimized transformation functions
 * - Type checking optimizations
 */

export interface IPCMessage<T = any> {
  id: string;
  event: string;
  payload?: T;
  timestamp: Date;
  type?: 'request' | 'response' | 'event';
  requestId?: string;
}

export interface MessageOptions<T = any> {
  event: string;
  payload?: T;
  type?: 'request' | 'response' | 'event';
  requestId?: string;
}

const TYPE_MARKERS = {
  ERROR: '__ERROR__',
  DATE: '__DATE__',
} as const;

// Performance: Message ID counter for better uniqueness
let messageIdCounter = 0;
const MESSAGE_ID_CACHE_SIZE = 100;

function generateMessageId(): string {
  const timestamp = Date.now();
  const counter = (messageIdCounter++) % MESSAGE_ID_CACHE_SIZE;
  const random = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${counter}-${random}`;
}

/**
 * Deep clone and transform special types for serialization
 * Optimized for performance with early returns
 */
function transformForSerialization(obj: any, visited = new WeakSet()): any {
  // Handle primitives and null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  const objType = typeof obj;
  if (objType !== 'object') {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj)) {
    return '[Circular]';
  }

  // Handle Date objects (check before adding to visited set)
  if (obj instanceof Date) {
    return {
      [TYPE_MARKERS.DATE]: true,
      value: obj.toISOString(),
    };
  }

  // Handle Error objects
  if (obj instanceof Error) {
    const errorObj: any = {
      [TYPE_MARKERS.ERROR]: true,
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };

    visited.add(obj);

    // Preserve custom properties
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k !== 'name' && k !== 'message' && k !== 'stack') {
        errorObj[k] = transformForSerialization((obj as any)[k], visited);
      }
    }

    return errorObj;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    visited.add(obj);
    const result = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      result[i] = transformForSerialization(obj[i], visited);
    }
    return result;
  }

  // Handle Objects
  visited.add(obj);
  const result: any = {};
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result[key] = transformForSerialization(obj[key], visited);
  }
  return result;
}

export function serialize(obj: any): string {
  const transformed = transformForSerialization(obj);
  return JSON.stringify(transformed);
}

export function deserialize<T = any>(json: string): T {
  return JSON.parse(json, function(_key, value) {
    if (value && typeof value === 'object') {
      if (value[TYPE_MARKERS.ERROR]) {
        const error = new Error(value.message);
        error.name = value.name;
        error.stack = value.stack;

        Object.keys(value).forEach(function(k) {
          if (k !== TYPE_MARKERS.ERROR && k !== 'name' && k !== 'message' && k !== 'stack') {
            (error as any)[k] = value[k];
          }
        });

        return error;
      }

      if (value[TYPE_MARKERS.DATE]) {
        return new Date(value.value);
      }
    }

    return value;
  });
}

export function createMessage<T = any>(options: MessageOptions<T>): IPCMessage<T> {
  return {
    id: generateMessageId(),
    event: options.event,
    payload: options.payload,
    timestamp: new Date(),
    type: options.type || 'event',
    requestId: options.requestId,
  };
}

export function serializeMessage<T = any>(message: IPCMessage<T>): string {
  return serialize(message);
}

export function deserializeMessage<T = any>(json: string): IPCMessage<T> {
  return deserialize<IPCMessage<T>>(json);
}

const MessageSerializer = {
  serialize,
  deserialize,
  createMessage,
  serializeMessage,
  deserializeMessage,
};

export default MessageSerializer;
module.exports = MessageSerializer;
