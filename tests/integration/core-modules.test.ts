import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { DesktopInteractiveUI } from '../../src/ui/implementations/desktop/DesktopInteractiveUI';
import type { InteractiveUICallbacks } from '../../src/ui/contracts/interactive/InteractiveUIInterface';
import type { IPCMessageAdapter } from '../../src/ui/implementations/desktop/IPCMessageAdapter';

const MAIN_PATH = path.join(__dirname, '../../src/main.ts');
const RUNNER_FACTORY_PATH = path.join(__dirname, '../../src/runners/RunnerFactory.ts');
const INTERACTIVE_RUNNER_PATH = path.join(
  __dirname,
  '../../src/runners/InteractiveRunner.ts'
);

const USER_MESSAGE_EVENT =
  process.env.COWORK_TEST_USER_MESSAGE_EVENT || 'user_message';
const USER_QUEUE_EVENT =
  process.env.COWORK_TEST_USER_QUEUE_EVENT || 'user_queue_message';
const TEST_MESSAGE = process.env.COWORK_TEST_USER_MESSAGE || 'hello';

const readSourceFile = (filePath: string): ts.SourceFile => {
  const sourceText = fs.readFileSync(filePath, 'utf-8');
  return ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
};

const getClassDeclaration = (sourceFile: ts.SourceFile, name: string): ts.ClassDeclaration => {
  let found: ts.ClassDeclaration | undefined;
  sourceFile.forEachChild((node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === name) {
      found = node;
    }
  });
  if (!found) {
    throw new Error(`Class not found: ${name}`);
  }
  return found;
};

const getMethodDeclaration = (
  classDecl: ts.ClassDeclaration,
  name: string
): ts.MethodDeclaration => {
  const methodDecl = classDecl.members.find((member) => {
    if (!ts.isMethodDeclaration(member)) {
      return false;
    }
    if (!member.name || !ts.isIdentifier(member.name)) {
      return false;
    }
    return member.name.text === name;
  });
  if (!methodDecl || !ts.isMethodDeclaration(methodDecl)) {
    throw new Error(`Method not found: ${name}`);
  }
  return methodDecl;
};

const findNewExpression = (
  methodDecl: ts.MethodDeclaration,
  className: string
): ts.NewExpression => {
  let found: ts.NewExpression | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isNewExpression(node)) {
      if (ts.isIdentifier(node.expression) && node.expression.text === className) {
        found = node;
      }
    }
    node.forEachChild(visit);
  };
  if (methodDecl.body) {
    methodDecl.body.forEachChild(visit);
  }
  if (!found) {
    throw new Error(`New ${className}() not found`);
  }
  return found;
};

const containsThisPropertyAccess = (node: ts.Node, propertyName: string): boolean => {
  let found = false;
  const visit = (child: ts.Node): void => {
    if (ts.isPropertyAccessExpression(child)) {
      if (
        child.expression.kind === ts.SyntaxKind.ThisKeyword &&
        child.name.text === propertyName
      ) {
        found = true;
        return;
      }
    }
    child.forEachChild(visit);
  };
  visit(node);
  return found;
};

class MockIPCAdapter {
  private handlers = new Map<string, Array<(payload: unknown) => void>>();

  emit = jest.fn().mockResolvedValue(undefined);
  request = jest.fn().mockResolvedValue({ confirmed: true });

  on(event: string, handler: (payload: unknown) => void): void {
    const handlers = this.handlers.get(event) ?? [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  off(event: string, handler: (payload: unknown) => void): void {
    const handlers = this.handlers.get(event);
    if (!handlers) {
      return;
    }
    this.handlers.set(
      event,
      handlers.filter((entry) => entry !== handler)
    );
  }

  trigger(event: string, payload: unknown): void {
    const handlers = this.handlers.get(event) ?? [];
    handlers.forEach((handler) => handler(payload));
  }
}

describe('Core module integration', () => {
  it('Application wires core modules into RunnerFactory', () => {
    const sourceFile = readSourceFile(MAIN_PATH);
    const appClass = getClassDeclaration(sourceFile, 'Application');
    const initializeMethod = getMethodDeclaration(appClass, 'initialize');
    const messageRouterInstantiation = findNewExpression(initializeMethod, 'MessageRouter');
    const runnerFactoryInstantiation = findNewExpression(initializeMethod, 'RunnerFactory');

    expect(containsThisPropertyAccess(messageRouterInstantiation, 'permissionManager')).toBe(
      true
    );
    expect(containsThisPropertyAccess(runnerFactoryInstantiation, 'sessionManager')).toBe(true);
    expect(containsThisPropertyAccess(runnerFactoryInstantiation, 'messageRouter')).toBe(true);
    expect(containsThisPropertyAccess(runnerFactoryInstantiation, 'permissionManager')).toBe(
      true
    );
    expect(containsThisPropertyAccess(runnerFactoryInstantiation, 'checkpointManager')).toBe(true);
  });

  it('RunnerFactory passes core modules to InteractiveRunner', () => {
    const sourceFile = readSourceFile(RUNNER_FACTORY_PATH);
    const runnerFactoryClass = getClassDeclaration(sourceFile, 'RunnerFactory');
    const createRunnerMethod = getMethodDeclaration(runnerFactoryClass, 'createRunner');
    const interactiveRunnerInstantiation = findNewExpression(
      createRunnerMethod,
      'InteractiveRunner'
    );

    expect(containsThisPropertyAccess(interactiveRunnerInstantiation, 'sessionManager')).toBe(
      true
    );
    expect(containsThisPropertyAccess(interactiveRunnerInstantiation, 'messageRouter')).toBe(true);
    expect(containsThisPropertyAccess(interactiveRunnerInstantiation, 'permissionManager')).toBe(
      true
    );
    expect(containsThisPropertyAccess(interactiveRunnerInstantiation, 'checkpointManager')).toBe(
      true
    );
  });

  it('InteractiveRunner connects StreamingQueryManager with core modules', () => {
    const sourceFile = readSourceFile(INTERACTIVE_RUNNER_PATH);
    const runnerClass = getClassDeclaration(sourceFile, 'InteractiveRunner');
    const runMethod = getMethodDeclaration(runnerClass, 'run');
    const streamingManagerInstantiation = findNewExpression(runMethod, 'StreamingQueryManagerImpl');

    expect(containsThisPropertyAccess(streamingManagerInstantiation, 'messageRouter')).toBe(true);
    expect(containsThisPropertyAccess(streamingManagerInstantiation, 'sessionManager')).toBe(true);
    expect(containsThisPropertyAccess(streamingManagerInstantiation, 'checkpointManager')).toBe(
      true
    );
  });

  it('InteractiveRunner uses SessionManager for workspace state', () => {
    const sourceFile = readSourceFile(INTERACTIVE_RUNNER_PATH);
    const runnerClass = getClassDeclaration(sourceFile, 'InteractiveRunner');
    const sessionMethod = getMethodDeclaration(runnerClass, 'getOrCreateSession');

    expect(containsThisPropertyAccess(sessionMethod, 'sessionManager')).toBe(true);
  });

  it('DesktopInteractiveUI forwards user events to callbacks', async () => {
    const adapter = new MockIPCAdapter();
    const callbacks: InteractiveUICallbacks = {
      onMessage: jest.fn().mockResolvedValue(undefined),
      onInterrupt: jest.fn(),
      onRewind: jest.fn().mockResolvedValue(undefined),
      onQueueMessage: jest.fn(),
    };

    const ui = new DesktopInteractiveUI(
      callbacks,
      undefined,
      adapter as unknown as IPCMessageAdapter
    );

    await ui.start();

    adapter.trigger(USER_MESSAGE_EVENT, { message: TEST_MESSAGE });
    expect(callbacks.onMessage).toHaveBeenCalledWith(TEST_MESSAGE);

    adapter.trigger(USER_QUEUE_EVENT, { message: TEST_MESSAGE });
    expect(callbacks.onQueueMessage).toHaveBeenCalledWith(TEST_MESSAGE);

    ui.stop();
  });
});
