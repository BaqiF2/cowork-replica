/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src-ui'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'src-ui/**/*.ts',
    '!src/**/*.d.ts',
    '!src-ui/**/*.d.ts',
    '!src/index.ts',
    '!src/cli.ts',
    '!src/docs/DocumentGenerator.ts',
    '!src/ui/InteractiveUI.ts',
    '!src/main.ts',
    '!src/plugins/PluginManager.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
  // 默认超时时间
  testTimeout: 10000,
  // 属性测试需要更多时间
  slowTestThreshold: 5000,
};
