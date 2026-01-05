/**
 * 文件功能：流式查询管理器，负责管理流式输入会话的生命周期
 *
 * 核心类：
 * - StreamingQueryManager: 流式查询管理器核心类
 *
 * 核心方法：
 * - startSession(): 开始新的流式会话
 * - sendMessage(): 发送消息到当前会话
 * - queueMessage(): 将消息添加到队列
 * - interruptSession(): 中断当前会话
 * - isProcessing(): 检查是否正在处理消息
 */

import { Session } from '../core/SessionManager';
import { MessageRouter } from '../core/MessageRouter';
import {
  SDKQueryExecutor,
  SDKQueryResult,
  StreamMessage,
  StreamContentBlock,
} from './SDKQueryExecutor';

/**
 * 流式会话状态
 */
export type StreamingSessionState = 'idle' | 'processing' | 'interrupted';

/**
 * 流式会话接口
 *
 * 表示一个活跃的流式输入会话
 */
export interface StreamingSession {
  /** 关联的会话对象 */
  session: Session;
  /** 当前状态 */
  state: StreamingSessionState;
  /** 消息队列 */
  messageQueue: QueuedMessage[];
  /** 中断控制器 */
  abortController: AbortController;
}

/**
 * 排队的消息接口
 */
export interface QueuedMessage {
  /** 原始文本（可能包含图像引用） */
  rawText: string;
  /** 解析后的内容块（如果已解析） */
  contentBlocks?: StreamContentBlock[];
  /** 解析错误（如果有） */
  errors?: Array<{ reference: string; error: string }>;
  /** 加入队列的时间 */
  queuedAt: Date;
}

/**
 * 消息处理结果
 */
export interface MessageProcessResult {
  /** 是否成功 */
  success: boolean;
  /** SDK 查询结果（如果成功） */
  result?: SDKQueryResult;
  /** 错误消息（如果失败） */
  error?: string;
  /** 图像处理错误列表 */
  imageErrors?: Array<{ reference: string; error: string }>;
}

/**
 * StreamingQueryManager 选项接口
 */
export interface StreamingQueryManagerOptions {
  /** 消息路由器 */
  messageRouter: MessageRouter;
  /** SDK 查询执行器 */
  sdkExecutor: SDKQueryExecutor;
}

/**
 * 流式查询管理器类
 *
 * 封装流式输入会话的完整生命周期管理：
 * - 会话创建和销毁
 * - 消息解析和构建（包含图像处理）
 * - 消息队列管理
 * - 中断支持
 */
export class StreamingQueryManager {
  /** 消息路由器 */
  private readonly messageRouter: MessageRouter;
  /** SDK 查询执行器 */
  private readonly sdkExecutor: SDKQueryExecutor;

  /** 当前活跃的流式会话 */
  private activeSession: StreamingSession | null = null;

  constructor(options: StreamingQueryManagerOptions) {
    this.messageRouter = options.messageRouter;
    this.sdkExecutor = options.sdkExecutor;
  }

  /**
   * 开始新的流式会话
   *
   * 创建一个新的流式会话，关联到指定的 Session 对象
   *
   * @param session - 会话对象
   * @returns 流式会话
   */
  startSession(session: Session): StreamingSession {
    // 如果已有活跃会话，先中断
    if (this.activeSession) {
      this.interruptSession();
    }

    const streamingSession: StreamingSession = {
      session,
      state: 'idle',
      messageQueue: [],
      abortController: new AbortController(),
    };

    this.activeSession = streamingSession;
    return streamingSession;
  }

  /**
   * 获取当前活跃会话
   *
   * @returns 当前活跃的流式会话，如果没有则返回 null
   */
  getActiveSession(): StreamingSession | null {
    return this.activeSession;
  }

  /**
   * 发送消息到当前会话
   *
   * 解析消息中的图像引用，构建流式消息并发送到 SDK
   * 如果当前正在处理消息，则将新消息加入队列
   *
   * @param rawMessage - 原始消息文本（可能包含 @./image.png 引用）
   * @returns 消息处理结果
   */
  async sendMessage(rawMessage: string): Promise<MessageProcessResult> {
    if (!this.activeSession) {
      return {
        success: false,
        error: 'No active streaming session',
      };
    }

    // 如果正在处理消息，加入队列
    if (this.activeSession.state === 'processing') {
      this.queueMessage(rawMessage);
      return {
        success: true,
        // 消息已加入队列，稍后处理
      };
    }

    // 处理消息
    return this.processMessage(rawMessage);
  }

  /**
   * 将消息添加到队列
   *
   * @param rawMessage - 原始消息文本
   */
  queueMessage(rawMessage: string): void {
    if (!this.activeSession) {
      return;
    }

    this.activeSession.messageQueue.push({
      rawText: rawMessage,
      queuedAt: new Date(),
    });
  }

  /**
   * 中断当前会话
   *
   * 调用 AbortController.abort() 停止当前正在进行的消息处理
   * 消息队列中的后续消息不受影响，会继续处理
   *
   * @returns 是否成功发送中断信号
   */
  interruptSession(): boolean {
    if (!this.activeSession) {
      return false;
    }

    if (this.activeSession.state === 'processing') {
      this.activeSession.abortController.abort();
      this.activeSession.state = 'interrupted';
      // 创建新的 AbortController 供后续消息使用
      this.activeSession.abortController = new AbortController();
      return true;
    }

    return false;
  }

  /**
   * 结束当前会话（保留，为后面的/clear准备）
   *
   * 清理会话资源，中断任何进行中的处理
   */
  endSession(): void {
    if (this.activeSession) {
      if (this.activeSession.state === 'processing') {
        this.activeSession.abortController.abort();
      }
      this.activeSession = null;
    }
  }

  /**
   * 检查是否正在处理消息
   *
   * @returns 是否正在处理
   */
  isProcessing(): boolean {
    return this.activeSession?.state === 'processing';
  }

  /**
   * 获取队列中的消息数量
   *
   * @returns 队列长度
   */
  getQueueLength(): number {
    return this.activeSession?.messageQueue.length ?? 0;
  }

  /**
   * 处理单条消息
   *
   * @param rawMessage - 原始消息文本
   * @returns 处理结果
   */
  private async processMessage(rawMessage: string): Promise<MessageProcessResult> {
    if (!this.activeSession) {
      return {
        success: false,
        error: 'No active streaming session',
      };
    }

    // 标记开始处理
    this.activeSession.state = 'processing';

    try {
      // 使用 MessageRouter 构建流式消息（处理图像引用）
      const buildResult = await this.messageRouter.buildStreamMessage(
        rawMessage,
        this.activeSession.session
      );

      // 如果有严重的图像错误（所有图像都无法加载），返回错误
      if (buildResult.errors && buildResult.errors.length > 0 && buildResult.contentBlocks.length === 0) {
        this.activeSession.state = 'idle';
        return {
          success: false,
          error: buildResult.errors.map((e) => `${e.reference}: ${e.error}`).join('; '),
          imageErrors: buildResult.errors,
        };
      }

      // 构建查询选项
      const queryOptions = await this.messageRouter.buildQueryOptions(this.activeSession.session);

      // 创建消息生成器
      const messageGenerator = this.createMessageGenerator(buildResult.contentBlocks);

      // 执行流式查询
      // 注意：由于类型不兼容（canUseTool），我们只传递必要的选项
      const sdkResult = await this.sdkExecutor.executeStreaming(messageGenerator, {
        model: queryOptions.model,
        systemPrompt: queryOptions.systemPrompt,
        allowedTools: queryOptions.allowedTools,
        disallowedTools: queryOptions.disallowedTools,
        cwd: queryOptions.cwd,
        permissionMode: queryOptions.permissionMode,
        maxTurns: queryOptions.maxTurns,
        maxBudgetUsd: queryOptions.maxBudgetUsd,
        maxThinkingTokens: queryOptions.maxThinkingTokens,
        sandbox: queryOptions.sandbox,
        abortController: this.activeSession.abortController,
      });

      // 恢复空闲状态
      this.activeSession.state = 'idle';

      // 处理队列中的下一条消息
      await this.processNextQueuedMessage();

      return {
        success: !sdkResult.isError,
        result: sdkResult,
        imageErrors: buildResult.errors && buildResult.errors.length > 0 ? buildResult.errors : undefined,
      };
    } catch (error) {
      // 恢复空闲状态
      if (this.activeSession) {
        this.activeSession.state = 'idle';
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 处理队列中的下一条消息
   */
  private async processNextQueuedMessage(): Promise<void> {
    if (!this.activeSession || this.activeSession.messageQueue.length === 0) {
      return;
    }

    const nextMessage = this.activeSession.messageQueue.shift();
    if (nextMessage) {
      await this.processMessage(nextMessage.rawText);
    }
  }

  /**
   * 创建消息生成器
   *
   * @param contentBlocks - 内容块数组
   * @returns 消息生成器
   */
  private async *createMessageGenerator(
    contentBlocks: StreamContentBlock[]
  ): AsyncGenerator<StreamMessage, void, unknown> {
    yield {
      type: 'user',
      message: {
        role: 'user',
        content: contentBlocks,
      },
    };
  }
}

