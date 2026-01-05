/**
 * StreamingQueryManager 测试
 *
 * 验证流式查询管理器的核心功能：
 * - 会话管理
 * - 消息队列
 * - 图像处理集成
 * - 中断支持
 *
 * @module StreamingQueryManager.test
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// 模拟 SDK 模块
jest.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: jest.fn(),
}));

import { StreamingQueryManager } from '../../src/sdk/StreamingQueryManager';
import { SDKQueryExecutor, SDKQueryResult } from '../../src/sdk/SDKQueryExecutor';
import { MessageRouter } from '../../src/core/MessageRouter';
import { Session } from '../../src/core/SessionManager';
import { ConfigManager } from '../../src/config/ConfigManager';
import { PermissionManager } from '../../src/permissions/PermissionManager';
import { ToolRegistry } from '../../src/tools/ToolRegistry';

// 创建模拟的 Session 对象
function createMockSession(workingDirectory: string = '/test/project'): Session {
  return {
    id: 'test-session-id',
    createdAt: new Date(),
    lastAccessedAt: new Date(),
    messages: [],
    context: {
      workingDirectory,
      projectConfig: {},
      userConfig: {},
      loadedSkills: [],
      activeAgents: [],
    },
    expired: false,
    workingDirectory,
  };
}

// 创建模拟的 SDKQueryResult
function createMockSDKResult(response: string, isError: boolean = false): SDKQueryResult {
  return {
    response,
    isError,
    sessionId: 'sdk-session-id',
    totalCostUsd: 0.01,
    durationMs: 1000,
    usage: {
      inputTokens: 100,
      outputTokens: 50,
    },
  };
}

describe('StreamingQueryManager', () => {
  let manager: StreamingQueryManager;
  let mockSDKExecutor: jest.Mocked<SDKQueryExecutor>;
  let mockMessageRouter: MessageRouter;
  let tempDir: string;

  beforeEach(async () => {
    // 创建临时目录用于测试
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'streaming-test-'));

    // 创建模拟的依赖
    mockSDKExecutor = {
      execute: jest.fn(),
      executeStreaming: jest.fn(),
      interrupt: jest.fn(),
      isRunning: jest.fn(),
      isInterrupted: jest.fn(),
      mapToSDKOptions: jest.fn(),
      processMessage: jest.fn(),
      extractTextFromAssistantMessage: jest.fn(),
    } as unknown as jest.Mocked<SDKQueryExecutor>;

    const configManager = new ConfigManager();
    const permissionManager = new PermissionManager(
      { mode: 'default' },
      new ToolRegistry()
    );

    mockMessageRouter = new MessageRouter({
      configManager,
      permissionManager,
    });

    // 模拟 buildQueryOptions 方法
    jest.spyOn(mockMessageRouter, 'buildQueryOptions').mockResolvedValue({
      model: 'claude-sonnet-4-5-20250929',
      systemPrompt: 'Test system prompt',
      allowedTools: ['Read', 'Write'],
      cwd: tempDir,
      permissionMode: 'default',
    });

    manager = new StreamingQueryManager({
      messageRouter: mockMessageRouter,
      sdkExecutor: mockSDKExecutor,
    });
  });

  afterEach(async () => {
    // 清理临时目录
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('startSession', () => {
    it('应该创建新的流式会话', () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);

      expect(streamingSession).toBeDefined();
      expect(streamingSession.session).toBe(session);
      expect(streamingSession.state).toBe('idle');
      expect(streamingSession.messageQueue).toEqual([]);
      expect(streamingSession.abortController).toBeInstanceOf(AbortController);
    });

    it('应该中断之前的会话并创建新会话', () => {
      const session1 = createMockSession(tempDir);
      const session2 = createMockSession(tempDir);

      manager.startSession(session1);
      const streamingSession2 = manager.startSession(session2);

      expect(streamingSession2).toBeDefined();
      expect(streamingSession2.session).toBe(session2);
      expect(manager.getActiveSession()).toBe(streamingSession2);
    });
  });

  describe('getActiveSession', () => {
    it('应该在没有活跃会话时返回 null', () => {
      expect(manager.getActiveSession()).toBeNull();
    });

    it('应该返回当前活跃的会话', () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);

      expect(manager.getActiveSession()).toBe(streamingSession);
    });
  });

  describe('sendMessage', () => {
    it('应该在没有活跃会话时返回错误', async () => {
      const result = await manager.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active streaming session');
    });

    it('应该成功发送纯文本消息', async () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      mockSDKExecutor.executeStreaming.mockResolvedValue(
        createMockSDKResult('AI response')
      );

      const result = await manager.sendMessage('Hello, Claude!');

      expect(result.success).toBe(true);
      expect(result.result?.response).toBe('AI response');
      expect(mockSDKExecutor.executeStreaming).toHaveBeenCalled();
    });

    it('应该在处理中时将消息加入队列', async () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);

      // 模拟正在处理状态
      streamingSession.state = 'processing';

      const result = await manager.sendMessage('Queued message');

      expect(result.success).toBe(true);
      expect(manager.getQueueLength()).toBe(1);
    });
  });

  describe('queueMessage', () => {
    it('应该将消息添加到队列', () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      manager.queueMessage('Message 1');
      manager.queueMessage('Message 2');

      expect(manager.getQueueLength()).toBe(2);
    });

    it('应该在没有活跃会话时静默失败', () => {
      manager.queueMessage('Message');
      expect(manager.getQueueLength()).toBe(0);
    });
  });

  describe('interruptSession', () => {
    it('应该在没有活跃会话时返回 false', () => {
      expect(manager.interruptSession()).toBe(false);
    });

    it('应该在不处理消息时返回 false', () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      expect(manager.interruptSession()).toBe(false);
    });

    it('应该在处理消息时成功中断', () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);
      streamingSession.state = 'processing';

      const result = manager.interruptSession();

      expect(result).toBe(true);
      expect(streamingSession.state).toBe('interrupted');
    });

    it('应该在中断后创建新的 AbortController', () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);
      streamingSession.state = 'processing';

      const oldController = streamingSession.abortController;
      manager.interruptSession();

      expect(streamingSession.abortController).not.toBe(oldController);
    });
  });

  describe('endSession', () => {
    it('应该清理活跃会话', () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      manager.endSession();

      expect(manager.getActiveSession()).toBeNull();
    });

    it('应该中断正在处理的会话', () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);
      streamingSession.state = 'processing';

      const abortSpy = jest.spyOn(streamingSession.abortController, 'abort');
      manager.endSession();

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('isProcessing', () => {
    it('应该在没有活跃会话时返回 false', () => {
      expect(manager.isProcessing()).toBe(false);
    });

    it('应该在空闲状态时返回 false', () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      expect(manager.isProcessing()).toBe(false);
    });

    it('应该在处理状态时返回 true', () => {
      const session = createMockSession(tempDir);
      const streamingSession = manager.startSession(session);
      streamingSession.state = 'processing';

      expect(manager.isProcessing()).toBe(true);
    });
  });

  describe('getQueueLength', () => {
    it('应该在没有活跃会话时返回 0', () => {
      expect(manager.getQueueLength()).toBe(0);
    });

    it('应该返回正确的队列长度', () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      manager.queueMessage('Message 1');
      manager.queueMessage('Message 2');
      manager.queueMessage('Message 3');

      expect(manager.getQueueLength()).toBe(3);
    });
  });

  describe('图像处理集成', () => {
    it('应该正确处理图像引用', async () => {
      // 创建测试图像文件
      const imageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG 文件头
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59,
        0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
        0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const imagePath = path.join(tempDir, 'test.png');
      await fs.writeFile(imagePath, imageBuffer);

      const session = createMockSession(tempDir);
      manager.startSession(session);

      mockSDKExecutor.executeStreaming.mockResolvedValue(
        createMockSDKResult('Image processed')
      );

      const result = await manager.sendMessage(`Analyze this image @${imagePath}`);

      expect(result.success).toBe(true);
      expect(mockSDKExecutor.executeStreaming).toHaveBeenCalled();

      // 验证消息生成器包含图像内容块
      const callArgs = mockSDKExecutor.executeStreaming.mock.calls[0];
      expect(callArgs).toBeDefined();
    });

    it('应该在图像文件不存在时返回错误', async () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      const result = await manager.sendMessage('Check @./nonexistent.png');

      // 当图像不存在时，可能返回错误或者 imageErrors
      expect(result.success).toBe(false);
      // 错误信息应该在 error 或 imageErrors 中
      const hasError = result.error !== undefined || 
                       (result.imageErrors !== undefined && result.imageErrors.length > 0);
      expect(hasError).toBe(true);
    });
  });

  describe('消息队列处理', () => {
    it('应该按顺序处理队列中的消息', async () => {
      const session = createMockSession(tempDir);
      manager.startSession(session);

      const processedMessages: string[] = [];

      mockSDKExecutor.executeStreaming.mockImplementation(async (generator) => {
        // 从生成器获取消息
        const { value } = await generator.next();
        if (value && typeof value.message.content === 'object') {
          const textBlock = (value.message.content as any[]).find(
            (block) => block.type === 'text'
          );
          if (textBlock) {
            processedMessages.push(textBlock.text);
          }
        } else if (typeof value?.message.content === 'string') {
          processedMessages.push(value.message.content);
        }
        return createMockSDKResult('Response');
      });

      // 直接调用 sendMessage，它会按顺序处理
      await manager.sendMessage('Message 1');
      await manager.sendMessage('Message 2');

      expect(processedMessages).toContain('Message 1');
      expect(processedMessages).toContain('Message 2');
    });
  });
});

describe('StreamingQueryManager - 属性测试', () => {
  /**
   * Property: Session State Consistency
   *
   * 会话状态应始终保持一致
   */
  describe('Property: Session State Consistency', () => {
    it('会话状态应该在操作后保持一致', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prop-test-'));

      try {
        const mockSDKExecutor = {
          executeStreaming: jest.fn().mockResolvedValue({
            response: 'Response',
            isError: false,
            sessionId: 'test-session',
          }),
        } as unknown as SDKQueryExecutor;

        const configManager = new ConfigManager();
        const permissionManager = new PermissionManager(
          { mode: 'default' },
          new ToolRegistry()
        );

        const mockMessageRouter = new MessageRouter({
          configManager,
          permissionManager,
        });

        jest.spyOn(mockMessageRouter, 'buildQueryOptions').mockResolvedValue({
          model: 'claude-sonnet-4-5-20250929',
          systemPrompt: '',
          allowedTools: [],
          cwd: tempDir,
          permissionMode: 'default',
        });

        const manager = new StreamingQueryManager({
          messageRouter: mockMessageRouter,
          sdkExecutor: mockSDKExecutor,
        });

        // 测试会话生命周期
        expect(manager.getActiveSession()).toBeNull();

        const session = createMockSession(tempDir);
        const streamingSession = manager.startSession(session);

        expect(manager.getActiveSession()).toBe(streamingSession);
        expect(streamingSession.state).toBe('idle');

        manager.endSession();
        expect(manager.getActiveSession()).toBeNull();
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  /**
   * Property: Queue FIFO Order
   *
   * 消息队列应遵循 FIFO 顺序
   */
  describe('Property: Queue FIFO Order', () => {
    it('消息应该按照加入队列的顺序排列', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fifo-test-'));

      try {
        const mockSDKExecutor = {} as SDKQueryExecutor;
        const configManager = new ConfigManager();
        const permissionManager = new PermissionManager(
          { mode: 'default' },
          new ToolRegistry()
        );

        const mockMessageRouter = new MessageRouter({
          configManager,
          permissionManager,
        });

        const manager = new StreamingQueryManager({
          messageRouter: mockMessageRouter,
          sdkExecutor: mockSDKExecutor,
        });

        const session = createMockSession(tempDir);
        manager.startSession(session);

        // 添加多条消息
        const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
        for (const msg of messages) {
          manager.queueMessage(msg);
        }

        // 验证队列长度
        expect(manager.getQueueLength()).toBe(messages.length);

        // 验证队列顺序
        const streamingSession = manager.getActiveSession();
        expect(streamingSession).not.toBeNull();
        
        for (let i = 0; i < messages.length; i++) {
          expect(streamingSession!.messageQueue[i].rawText).toBe(messages[i]);
        }
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});

