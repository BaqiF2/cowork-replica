# Contributing Guide

Thank you for your interest in the Claude Replica project! We welcome all forms of contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Commit Standards](#commit-standards)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)

## Code of Conduct

Please maintain friendliness and respect when participating in the project. We are committed to providing an open and friendly environment for everyone.

## How to Contribute

### Report Bugs

1. Search [Issues](https://github.com/your-username/claude-replica/issues) to see if the same problem already exists
2. If not, create a new Issue
3. Use the bug report template
4. Provide detailed reproduction steps
5. Include environment information ( operating system, etcNode.js version,.)

### Suggest Features

1. Search Issues to see if the same suggestion already exists
2. If not, create a new Issue
3. Use the feature request template
4. Describe the feature requirements and use cases in detail

### Submit Code

1. Fork the repository
2. Create a feature branch
3. Write code and tests
4. Ensure all tests pass
5. Submit a Pull Request

## Development Workflow

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/claude-replica.git
cd claude-replica

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Branch Naming

- `feature/xxx` - New features
- `fix/xxx` - Bug fixes
- `docs/xxx` - Documentation updates
- `refactor/xxx` - Code refactoring
- `test/xxx` - Test-related

### Development Commands

```bash
# Development mode (watch for changes)
npm run dev

# Run tests
npm test

# Run tests (watch mode)
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Commit Standards

Use [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation update |
| `style` | Code formatting (no functional changes) |
| `refactor` | Code refactoring |
| `test` | Test-related |
| `chore` | Build/tool-related |
| `perf` | Performance optimization |

### Examples

```
feat(cli): add --timeout option for CI environments

Add a new --timeout option that allows users to set a maximum
execution time for queries. This is particularly useful in CI
environments where tasks should not run indefinitely.

Closes #123
```

```
fix(session): resolve session expiration check

The session expiration check was using the wrong timestamp,
causing sessions to expire prematurely.

Fixes #456
```

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Explicit type annotations
- Avoid `any` type
- Use interfaces to define data structures

```typescript
// Good practice
interface UserConfig {
  model?: string;
  maxTurns?: number;
}

function processConfig(config: UserConfig): void {
  // ...
}

// Avoid
function processConfig(config: any): void {
  // ...
}
```

### Naming Conventions

- Class names: PascalCase (e.g., `SessionManager`)
- Functions/methods: camelCase (e.g., `createSession`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_SESSIONS`)
- File names: PascalCase (classes) or camelCase (utilities)

### Comment Standards

Use JSDoc style:

```typescript
/**
 * Create a new session
 *
 * @param workingDir - Working directory path
 * @param config - Configuration options
 * @returns Newly created session
 * @throws If unable to create session
 *
 * @example
 * ```typescript
 * const session = await createSession('/path/to/project');
 * ```
 */
async function createSession(
  workingDir: string,
  config?: SessionConfig
): Promise<Session> {
  // ...
}
```

### Code Checking

Ensure all checks pass before committing:

```bash
npm run lint
npm run format:check
```

## Testing Requirements

### Test Coverage

- All new features must have tests
- Bug fixes should include regression tests
- Target test coverage > 80%

### Test Types

1. **Unit Tests**: Test individual functions/classes
2. **Integration Tests**: Test module interactions
3. **Property Tests**: Use fast-check to test general properties

### Test Example

```typescript
describe('SessionManager', () => {
  describe('createSession', () => {
    it('should create a new session with unique ID', async () => {
      const manager = new SessionManager();
      const session = await manager.createSession('/test/dir');

      expect(session.id).toBeDefined();
      expect(session.workingDirectory).toBe('/test/dir');
    });

    it('should throw error for invalid directory', async () => {
      const manager = new SessionManager();

      await expect(
        manager.createSession('')
      ).rejects.toThrow('Invalid directory');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testPathPattern="SessionManager"

# View coverage
npm run test:coverage
```

## Documentation Requirements

### Code Documentation

- All public APIs must have JSDoc comments
- Complex logic should have inline comments
- README should be kept updated

### Documentation Updates

When modifying functionality, please also update:

1. Code comments
2. README.md (if it affects users)
3. Related documentation in docs/ directory
4. CHANGELOG.md (for important changes)

## Pull Request Process

1. **Create PR**
   - Use PR template
   - Describe changes
   - Link related Issues

2. **Code Review**
   - At least one reviewer approval required
   - Resolve all review comments
   - Ensure CI checks pass

3. **Merge**
   - Use Squash and merge
   - Ensure commit message follows standards

## Release Process

Releases are handled by maintainers:

1. Update version number
2. Update CHANGELOG
3. Create Release Tag
4. Publish to npm

## Getting Help

- 📖 [Documentation](docs/)
- 💬 [Discussions](https://github.com/BaqiF2/claude-replica/discussions)
- 🐛 [Issues](https://github.com/BaqiF2/claude-replica/issues)

Thank you for your contribution! 🎉
