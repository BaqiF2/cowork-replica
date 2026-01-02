# Plugin API Documentation

This document describes the extensibility architecture and plugin API of Claude Replica, helping developers create custom tools and extensions.

## Overview

Claude Replica provides a complete extensibility architecture supporting:

- **Custom Tool Registration** - Register new tools for AI to use
- **Tool Parameter Validation** - Automatically validate tool parameter types and constraints
- **Tool Error Handling** - Unified error handling mechanism
- **Tool Hook Points** - Insert custom logic at various stages of tool execution
- **Asynchronous Execution and Streaming Output** - Support for long-running tasks and real-time output

## Quick Start

### Installation

```bash
npm install claude-replica
```

### Basic Usage

```typescript
import { ExtensibilityManager, CustomToolDefinition } from 'claude-replica';

// Create extensibility manager
const manager = new ExtensibilityManager({
  defaultTimeout: 30000,  // Default timeout 30 seconds
  enableValidation: true, // Enable parameter validation
});

// Define custom tool
const myTool: CustomToolDefinition = {
  name: 'myCustomTool',
  description: 'My custom tool',
  parameters: [
    {
      name: 'input',
      type: 'string',
      description: 'Input content',
      required: true,
    },
  ],
  executor: async (args, context) => {
    const input = args.input as string;
    return {
      success: true,
      output: `Processed: ${input}`,
    };
  },
};

// Register tool
manager.registerTool(myTool);

// Execute tool
const result = await manager.executeTool('myCustomTool', { input: 'hello' }, {
  sessionId: 'session-1',
  messageUuid: 'msg-1',
  workingDir: process.cwd(),
});

console.log(result.output); // Processed: hello
```

## Tool Definition

### CustomToolDefinition Interface

```typescript
interface CustomToolDefinition {
  // Required fields
  name: string;                    // Tool name (starts with letter, only letters, numbers, underscores)
  description: string;             // Tool description
  parameters: ToolParameter[];     // Parameter definition list
  executor: ToolExecutor;          // Execution function

  // Optional fields
  streamingExecutor?: StreamingToolExecutor;  // Streaming execution function
  dangerous?: boolean;             // Whether tool is dangerous
  category?: string;               // Tool category
  version?: string;                // Tool version
  timeout?: number;                // Timeout in milliseconds
  supportsStreaming?: boolean;     // Whether supports streaming output
}
```

### Parameter Definition

```typescript
interface ToolParameter {
  name: string;           // Parameter name
  type: ParameterType;    // Parameter type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string;    // Parameter description
  required: boolean;      // Whether required

  // Optional constraints
  default?: unknown;      // Default value
  enum?: string[];        // Enumerated values (string type only)
  items?: { type: ParameterType };  // Array element type
  properties?: Record<string, ToolParameter>;  // Object properties
  minimum?: number;       // Minimum value (number type only)
  maximum?: number;       // Maximum value (number type only)
  minLength?: number;     // Minimum length (string or array)
  maxLength?: number;     // Maximum length (string or array)
  pattern?: string;       // Regular expression pattern (string type only)
}
```

### Parameter Type Examples

#### String Parameter

```typescript
{
  name: 'email',
  type: 'string',
  description: 'Email address',
  required: true,
  pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
}
```

#### Number Parameter

```typescript
{
  name: 'count',
  type: 'number',
  description: 'Quantity',
  required: true,
  minimum: 1,
  maximum: 100,
  default: 10,
}
```

#### Enumeration Parameter

```typescript
{
  name: 'status',
  type: 'string',
  description: 'Status',
  required: true,
  enum: ['active', 'inactive', 'pending'],
}
```

#### Array Parameter

```typescript
{
  name: 'tags',
  type: 'array',
  description: 'Tag list',
  required: false,
  items: { type: 'string' },
  minLength: 1,
  maxLength: 10,
}
```

## Execution Context

Tools receive execution context when executed:

```typescript
interface ToolExecutionContext {
  sessionId: string;       // Session ID
  messageUuid: string;     // Message UUID
  workingDir: string;      // Working directory
  userConfig?: Record<string, unknown>;  // User configuration
  abortSignal?: AbortSignal;  // Cancellation signal
}
```

## Execution Results

Tools return results after execution:

```typescript
interface ToolExecutionResult {
  success: boolean;        // Whether successful
  output?: string;         // Output content
  data?: unknown;          // Structured data
  error?: string;          // Error message
  errorCode?: string;      // Error code
  executionTime?: number;  // Execution time in milliseconds
  metadata?: Record<string, unknown>;  // Metadata
}
```

## Streaming Output

For long-running tasks, use streaming output:

```typescript
const streamingTool: CustomToolDefinition = {
  name: 'longRunningTask',
  description: 'Long-running task',
  parameters: [],
  supportsStreaming: true,
  executor: async () => ({ success: true }),
  streamingExecutor: async function* (args, context) {
    // Output text
    yield { type: 'text', content: 'Starting processing...\n' };

    // Output progress
    for (let i = 0; i <= 100; i += 10) {
      yield { type: 'progress', content: `${i}%`, progress: i };
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Output data
    yield { type: 'data', content: '', data: { result: 'done' } };

    // Return final result
    return { success: true, output: 'Processing complete' };
  },
};
```

### Streaming Chunk Types

```typescript
interface StreamChunk {
  type: 'text' | 'progress' | 'data' | 'error';
  content: string;
  progress?: number;  // Progress percentage (0-100)
  data?: unknown;     // Structured data
}
```

### Consume Streaming Output

```typescript
const generator = manager.executeToolStreaming('longRunningTask', {}, context);

for await (const chunk of generator) {
  switch (chunk.type) {
    case 'text':
      process.stdout.write(chunk.content);
      break;
    case 'progress':
      console.log(`Progress: ${chunk.progress}%`);
      break;
    case 'data':
      console.log('Data:', chunk.data);
      break;
    case 'error':
      console.error('Error:', chunk.content);
      break;
  }
}
```

## Tool Hooks

Hooks allow inserting custom logic at various stages of tool execution:

### Hook Events

| Event | Description | Trigger Timing |
|-------|-------------|----------------|
| `beforeExecute` | Before execution | Before parameter validation |
| `afterExecute` | After execution | After successful execution |
| `onError` | On error | When execution fails |
| `onProgress` | On progress update | When streaming output progress |
| `onStream` | On streaming output | When each streaming chunk is output |

### Add Hook

```typescript
// Before execution hook
manager.addToolHook('beforeExecute', async (context) => {
  console.log(`About to execute tool: ${context.toolName}`);
  console.log(`Parameters:`, context.args);
});

// After execution hook
manager.addToolHook('afterExecute', async (context) => {
  console.log(`Tool execution completed: ${context.toolName}`);
  console.log(`Result:`, context.result);
});

// Error hook
manager.addToolHook('onError', async (context) => {
  console.error(`Tool execution failed: ${context.toolName}`);
  console.error(`Error:`, context.error);
});

// Progress hook
manager.addToolHook('onProgress', async (context) => {
  console.log(`Progress: ${context.progress}%`);
});
```

### Hook Context

```typescript
interface ToolHookContext {
  toolName: string;                    // Tool name
  args: Record<string, unknown>;       // Tool parameters
  executionContext: ToolExecutionContext;  // Execution context
  result?: ToolExecutionResult;        // Execution result (afterExecute/onError)
  error?: Error;                       // Error information (onError)
  chunk?: StreamChunk;                 // Streaming chunk (onStream)
  progress?: number;                   // Progress (onProgress)
}
```

## Error Handling

### Error Types

```typescript
// Parameter validation error
class ParameterValidationError extends Error {
  parameterName: string;
  expectedType: string;
  actualValue: unknown;
}

// Tool execution error
class ToolExecutionError extends Error {
  toolName: string;
  errorCode: string;
  cause?: Error;
}

// Tool timeout error
class ToolTimeoutError extends Error {
  toolName: string;
  timeout: number;
}
```

### Error Codes

| Error Code | Description |
|------------|-------------|
| `TOOL_NOT_FOUND` | Tool not registered |
| `PARAMETER_VALIDATION_ERROR` | Parameter validation failed |
| `TIMEOUT` | Execution timeout |
| `EXECUTION_ERROR` | Execution error |
| `MAX_CONCURRENT_EXCEEDED` | Exceeded maximum concurrency |

### Custom Error Handling

```typescript
const result = await manager.executeTool('myTool', args, context);

if (!result.success) {
  switch (result.errorCode) {
    case 'PARAMETER_VALIDATION_ERROR':
      console.error('Parameter error:', result.error);
      break;
    case 'TIMEOUT':
      console.error('Execution timeout');
      break;
    case 'EXECUTION_ERROR':
      console.error('Execution failed:', result.error);
      break;
    default:
      console.error('Unknown error:', result.error);
  }
}
```

## Configuration Options

```typescript
interface ExtensibilityManagerConfig {
  defaultTimeout?: number;           // Default timeout in milliseconds, default 30000
  debug?: boolean;                   // Whether to enable debug logs, default false
  maxConcurrentExecutions?: number;  // Maximum concurrent executions, default 10
  enableValidation?: boolean;        // Whether to enable parameter validation, default true
}
```

## Tool Schema

Get tool's JSON Schema format parameter definition:

```typescript
const schema = manager.getToolSchema('myTool');
console.log(JSON.stringify(schema, null, 2));
```

Output Example:

```json
{
  "type": "object",
  "properties": {
    "input": {
      "type": "string",
      "description": "Input content",
      "minLength": 1
    },
    "count": {
      "type": "number",
      "description": "Quantity",
      "minimum": 0,
      "maximum": 100,
      "default": 10
    }
  },
  "required": ["input"]
}
```

## Tool Summary

Get summary information for all tools:

```typescript
const summary = manager.getToolsSummary();
console.log(summary);
```

Output Example:

```json
[
  {
    "name": "myTool",
    "description": "My tool",
    "category": "utility",
    "dangerous": false,
    "supportsStreaming": true
  }
]
```

## Best Practices

### 1. Parameter Validation

Always define complete parameter constraints, let the system automatically validate:

```typescript
{
  name: 'filePath',
  type: 'string',
  description: 'File path',
  required: true,
  pattern: '^[a-zA-Z0-9_/.-]+$',  // Restrict allowed characters
  maxLength: 255,                  // Restrict maximum length
}
```

### 2. Error Handling

Correctly handle errors in execution functions:

```typescript
executor: async (args, context) => {
  try {
    // Execute logic
    return { success: true, output: 'done' };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorCode: 'CUSTOM_ERROR',
    };
  }
}
```

### 3. Timeout Setting

Set reasonable timeout for long-running tasks:

```typescript
{
  name: 'longTask',
  timeout: 60000,  // 60 seconds timeout
  // ...
}
```

### 4. Streaming Output

For long-running tasks, use streaming output to provide real-time feedback:

```typescript
streamingExecutor: async function* (args, context) {
  yield { type: 'text', content: 'Starting processing...\n' };

  // Regularly output progress
  for (let i = 0; i <= 100; i += 10) {
    yield { type: 'progress', content: `${i}%`, progress: i };
    // Execute partial work
  }

  return { success: true };
}
```

### 5. Dangerous Tool Marking

For tools that may cause damage, mark as dangerous:

```typescript
{
  name: 'deleteFile',
  dangerous: true,  // Mark as dangerous tool
  // ...
}
```

## Complete Example

### File Search Tool

```typescript
import { ExtensibilityManager, CustomToolDefinition } from 'claude-replica';
import * as fs from 'fs/promises';
import * as path from 'path';

const fileSearchTool: CustomToolDefinition = {
  name: 'fileSearch',
  description: 'Search for files in directory',
  category: 'file',
  dangerous: false,
  supportsStreaming: true,
  parameters: [
    {
      name: 'directory',
      type: 'string',
      description: 'Search directory',
      required: true,
    },
    {
      name: 'pattern',
      type: 'string',
      description: 'File name pattern (regular expression)',
      required: true,
    },
    {
      name: 'maxResults',
      type: 'number',
      description: 'Maximum number of results',
      required: false,
      default: 100,
      minimum: 1,
      maximum: 1000,
    },
  ],
  executor: async (args, context) => {
    const directory = args.directory as string;
    const pattern = new RegExp(args.pattern as string);
    const maxResults = args.maxResults as number;

    const results: string[] = [];

    async function search(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= maxResults) break;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await search(fullPath);
        } else if (pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    }

    await search(directory);

    return {
      success: true,
      output: results.join('\n'),
      data: { files: results, count: results.length },
    };
  },
  streamingExecutor: async function* (args, context) {
    const directory = args.directory as string;
    const pattern = new RegExp(args.pattern as string);
    const maxResults = args.maxResults as number;

    const results: string[] = [];
    let scannedDirs = 0;

    async function* search(dir: string): AsyncGenerator<string> {
      scannedDirs++;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= maxResults) return;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          yield* search(fullPath);
        } else if (pattern.test(entry.name)) {
          results.push(fullPath);
          yield fullPath;
        }
      }
    }

    yield { type: 'text', content: `Starting search: ${directory}\n` };

    for await (const file of search(directory)) {
      yield { type: 'text', content: `Found: ${file}\n` };
    }

    yield { type: 'text', content: `\nSearch completed, scanned ${scannedDirs} directories\n` };

    return {
      success: true,
      output: `Found ${results.length} files`,
      data: { files: results, count: results.length },
    };
  },
};

// Usage
const manager = new ExtensibilityManager();
manager.registerTool(fileSearchTool);

// Regular execution
const result = await manager.executeTool('fileSearch', {
  directory: '/path/to/search',
  pattern: '\\.ts$',
  maxResults: 50,
}, context);

// Streaming execution
for await (const chunk of manager.executeToolStreaming('fileSearch', {
  directory: '/path/to/search',
  pattern: '\\.ts$',
}, context)) {
  process.stdout.write(chunk.content);
}
```

## API Reference

### ExtensibilityManager

| Method | Description |
|--------|-------------|
| `registerTool(tool)` | Register custom tool |
| `unregisterTool(name)` | Unregister tool |
| `getTool(name)` | Get tool definition |
| `getAllTools()` | Get all tools |
| `hasTool(name)` | Check if tool exists |
| `getToolCount()` | Get tool count |
| `executeTool(name, args, context)` | Execute tool |
| `executeToolStreaming(name, args, context)` | Execute tool with streaming |
| `addToolHook(event, handler)` | Add hook |
| `removeToolHook(event, handler)` | Remove hook |
| `clearToolHooks(event)` | Clear hooks for specified event |
| `clearAllToolHooks()` | Clear all hooks |
| `getToolSchema(name)` | Get tool JSON Schema |
| `getToolsSummary()` | Get tool summary |
| `clearAllTools()` | Clear all tools |
| `reset()` | Reset manager state |
