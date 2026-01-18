# 任务 3 状态报告：实现 HookManager 核心逻辑

## 任务概要
- **任务编号**: 3
- **任务类型**: [实现]
- **任务组**: 1 (HookManager 核心方法实现)
- **执行时间**: 2026-01-18

## 执行结果
**状态**: ✅ 完成

### 修改的文件

#### 1. `src/hooks/HookManager.ts`
**新增/修改的类型定义:**
- `Hook.type` 扩展为 `'command' | 'prompt' | 'script'`
- `Hook.script` 新增字段用于 script 类型
- `HookExecutionResult.type` 扩展为 `'command' | 'prompt' | 'script'`
- `HookInput` 新增接口 - SDK 传入的钩子输入数据
- `HookJSONOutput` 新增接口 - 钩子返回给 SDK 的输出数据

**新增方法:**
- `executeScript(scriptPath, context, toolUseID, signal)` - 执行脚本类型钩子
  - 动态加载 JS/TS 模块
  - 调用导出函数
  - 返回完整的 SDK HookJSONOutput 对象
  - 脚本不存在或执行失败时返回 `{ continue: true }`

- `createSDKCallback(hook)` - 为单个钩子创建 SDK 回调函数
  - 支持 command、prompt、script 三种类型
  - 返回可用于 SDK 的回调函数

- `expandVariablesFromSDKInput(template, input)` - 从 SDK HookInput 扩展变量
  - 支持 $TOOL、$FILE、$COMMAND、$CWD、$SESSION_ID、$MESSAGE_UUID 变量

**修改的方法:**
- `executeHooks()` - 添加对 script 类型的处理
- `validateConfig()` - 添加对 script 类型的验证

#### 2. `src/hooks/index.ts`
- 新增导出 `HookInput` 和 `HookJSONOutput` 接口

#### 3. `tests/hooks/HookManager.test.ts`
- 更新导入使用真实的 HookInput 类型
- 移除 Mock 类型定义

### 实现细节

#### executeScript 方法
```typescript
async executeScript(
  scriptPath: string,
  context: HookInput,
  toolUseID: string | undefined,
  signal: AbortSignal
): Promise<HookJSONOutput>
```
- 支持相对路径和绝对路径
- 动态加载 CommonJS 模块
- 调用 `module.default` 或 `module.hook` 导出函数
- 传递 (context, toolUseID, { signal }) 参数
- 错误处理：返回 `{ continue: true }` 不阻止流程

#### createSDKCallback 方法
```typescript
createSDKCallback(hook: Hook): (context: HookContext) => void | Promise<void>
```
- 根据 hook.type 创建对应的回调函数
- 支持 command、prompt、script 三种类型

#### expandVariablesFromSDKInput 方法
```typescript
expandVariablesFromSDKInput(template: string, input: HookInput): string
```
- $TOOL → input.tool_name
- $FILE → input.tool_input.file_path 或 input.tool_input.path
- $COMMAND → input.tool_input.command
- $CWD → input.cwd
- $SESSION_ID → input.session_id
- $MESSAGE_UUID → input.message_uuid

## Green 阶段验证 (任务 4)

### 运行命令
```bash
npm test -- tests/hooks/HookManager.test.ts
```

### 测试结果
✅ 所有测试通过

```
Test Suites: 1 passed, 1 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        0.998 s
```

### 通过的测试用例
- loadHooks (4 个测试)
- executeCommand (6 个测试)
- executeScript (6 个测试)
- executePrompt (6 个测试)
- createSDKCallback (5 个测试)
- expandVariablesFromSDKInput (7 个测试)
- convertToSDKFormat (5 个测试)
- HookManager constructor options (4 个测试)
- Three hook callback types integration (1 个测试)

## 文件变更清单
| 文件 | 操作 | 说明 |
|-----|------|------|
| src/hooks/HookManager.ts | 修改 | 添加新方法和类型定义 |
| src/hooks/index.ts | 修改 | 导出新增接口 |
| tests/hooks/HookManager.test.ts | 修改 | 使用真实类型定义 |

## 下一步任务
- 任务 5: [重构] 优化 HookManager 代码质量
  - 改进错误处理和日志记录
  - 优化变量替换的可读性
