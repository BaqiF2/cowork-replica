import { TestUIFactory } from './TestUIFactory';
import type { ToolPermissionRequest } from '../../src/permissions/types';
import type { QuestionInput } from '../../src/permissions/PermissionUI';

const ZERO = parseInt(process.env.TEST_UI_FACTORY_ZERO || '0', 10);
const ONE = parseInt(process.env.TEST_UI_FACTORY_ONE || '1', 10);

describe('TestUIFactory', () => {
  it('should return observable mocks for parser, output, and permission UI', async () => {
    const factory = new TestUIFactory();

    const parser = factory.createParser();
    const output = factory.createOutput();
    const permissionUI = factory.createPermissionUI();

    const parseArgs = ['--help'];
    parser.parse(parseArgs);
    parser.getHelpText();
    parser.getVersionText();

    output.info('info message');
    output.warn('warn message');
    output.error('error message');
    output.success('success message');
    output.section('section title');
    output.blankLine(ONE);

    const request: ToolPermissionRequest = {
      toolName: 'test-tool',
      toolUseID: 'test-use',
      input: {},
      timestamp: new Date(),
    };
    const questions: QuestionInput[] = [
      {
        question: 'question',
        header: 'header',
        options: [{ label: 'option', description: 'description' }],
        multiSelect: false,
      },
    ];

    await permissionUI.promptToolPermission(request);
    await permissionUI.promptUserQuestions(questions);

    expect(parser.parseCalls).toHaveLength(ONE);
    expect(parser.parseCalls[ZERO]).toBe(parseArgs);
    expect(parser.getHelpTextCalls).toHaveLength(ONE);
    expect(parser.getVersionTextCalls).toHaveLength(ONE);

    expect(output.infoCalls).toHaveLength(ONE);
    expect(output.warnCalls).toHaveLength(ONE);
    expect(output.errorCalls).toHaveLength(ONE);
    expect(output.successCalls).toHaveLength(ONE);
    expect(output.sectionCalls).toHaveLength(ONE);
    expect(output.blankLineCalls).toHaveLength(ONE);
    expect(output.blankLineCalls[ZERO]).toBe(ONE);

    expect(permissionUI.promptToolPermissionCalls).toHaveLength(ONE);
    expect(permissionUI.promptToolPermissionCalls[ZERO]).toBe(request);
    expect(permissionUI.promptUserQuestionsCalls).toHaveLength(ONE);
    expect(permissionUI.promptUserQuestionsCalls[ZERO]).toBe(questions);
  });
});
