import type { PermissionUI, QuestionAnswers, QuestionInput } from '../../src/permissions/PermissionUI';
import type { PermissionUIResult, ToolPermissionRequest } from '../../src/permissions/types';
import type { OutputInterface, OutputOptions } from '../../src/ui/OutputInterface';
import type { OptionsInterface } from '../../src/ui/OptionsInterface';
import type { ParserInterface } from '../../src/ui/ParserInterface';
import type { UIFactory } from '../../src/ui/factories/UIFactory';

export class TestParser implements ParserInterface {
  readonly parseCalls: string[][] = [];
  readonly getHelpTextCalls: Array<null> = [];
  readonly getVersionTextCalls: Array<null> = [];

  parse(args: string[]): OptionsInterface {
    this.parseCalls.push(args);
    return {
      help: false,
      version: false,
      debug: false,
    };
  }

  getHelpText(): string {
    this.getHelpTextCalls.push(null);
    return 'test help';
  }

  getVersionText(): string {
    this.getVersionTextCalls.push(null);
    return 'test version';
  }
}

export class TestOutput implements OutputInterface {
  readonly infoCalls: Array<[string, OutputOptions | undefined]> = [];
  readonly warnCalls: Array<[string, OutputOptions | undefined]> = [];
  readonly errorCalls: Array<[string, OutputOptions | undefined]> = [];
  readonly successCalls: Array<[string, OutputOptions | undefined]> = [];
  readonly sectionCalls: Array<[string, OutputOptions | undefined]> = [];
  readonly blankLineCalls: Array<number | undefined> = [];

  info(message: string, options?: OutputOptions): void {
    this.infoCalls.push([message, options]);
  }

  warn(message: string, options?: OutputOptions): void {
    this.warnCalls.push([message, options]);
  }

  error(message: string, options?: OutputOptions): void {
    this.errorCalls.push([message, options]);
  }

  success(message: string, options?: OutputOptions): void {
    this.successCalls.push([message, options]);
  }

  section(title: string, options?: OutputOptions): void {
    this.sectionCalls.push([title, options]);
  }

  blankLine(count?: number): void {
    this.blankLineCalls.push(count);
  }
}

export class TestPermissionUI implements PermissionUI {
  readonly promptToolPermissionCalls: ToolPermissionRequest[] = [];
  readonly promptUserQuestionsCalls: QuestionInput[][] = [];
  nextPermissionResult: PermissionUIResult = { approved: true };
  nextQuestionAnswers: QuestionAnswers = {};

  async promptToolPermission(request: ToolPermissionRequest): Promise<PermissionUIResult> {
    this.promptToolPermissionCalls.push(request);
    return this.nextPermissionResult;
  }

  async promptUserQuestions(questions: QuestionInput[]): Promise<QuestionAnswers> {
    this.promptUserQuestionsCalls.push(questions);
    return this.nextQuestionAnswers;
  }
}

export class TestUIFactory implements UIFactory {
  readonly parserInstances: TestParser[] = [];
  readonly outputInstances: TestOutput[] = [];
  readonly permissionUIInstances: TestPermissionUI[] = [];

  createParser(): TestParser {
    const parser = new TestParser();
    this.parserInstances.push(parser);
    return parser;
  }

  createOutput(): TestOutput {
    const output = new TestOutput();
    this.outputInstances.push(output);
    return output;
  }

  createPermissionUI(
    _output?: NodeJS.WritableStream,
    _input?: NodeJS.ReadableStream
  ): TestPermissionUI {
    const permissionUI = new TestPermissionUI();
    this.permissionUIInstances.push(permissionUI);
    return permissionUI;
  }
}
