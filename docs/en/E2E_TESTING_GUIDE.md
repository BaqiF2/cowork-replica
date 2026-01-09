# Claude Replica End-to-End Testing Guide

This document provides a complete guide for testing every feature of Claude Replica in a real environment.

## Table of Contents

- [Test Environment Preparation](#test-environment-preparation)
- [Core Functionality Testing](#core-functionality-testing)
- [Extension System Testing](#extension-system-testing)
- [Integration Testing](#integration-testing)
- [CI/CD Testing](#cicd-testing)
- [Fault Recovery Testing](#fault-recovery-testing)
- [Performance Testing](#performance-testing)

---

## Test Environment Preparation

### 1. Environment Requirements Check

```bash
# Check Node.js version (requires >= 20.0.0)
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

### 2. Install Claude Replica

```bash
# Method 1: Global installation
npm install -g claude-replica

# Method 2: Install from source
git clone https://github.com/BaqiF2/claude-replica.git
cd claude-replica
npm install
npm run build
npm link

# Verify installation
claude-replica --version
```

### 3. Configure Authentication

Claude Replica uses the Claude Agent SDK and automatically retrieves authentication information from Claude Code configuration.

**Ensure Claude Code is properly configured:**

```bash
# Method 1: Use Claude Code CLI login
claude login

# Method 2: Check if configuration file exists
ls ~/.claude/settings.json
```

**Verify configuration:**

```bash
# Test if it runs normally
claude-replica -p "Hello" --max-turns 1
```

### 4. Create Test Project

```bash
# Create test directory
mkdir -p ~/claude-replica-e2e-test
cd ~/claude-replica-e2e-test

# Initialize test project
npm init -y
mkdir -p src tests
echo 'console.log("Hello World");' > src/index.js
echo '# Test Project' > README_ZH.md
```

---

## Core Functionality Testing

### Test 1: Interactive Mode Startup

**Goal**: Verify interactive mode starts and exits normally

**Steps**:
```bash
# Start interactive mode
claude-replica
```

**Expected Results**:
- [ ] Show welcome message
- [ ] Show command prompt
- [ ] Can input messages

**Exit Test**:
```
# In interactive mode, input
/exit
```

**Expected Results**:
- [ ] Program exits normally
- [ ] No error messages

---

### Test 2: Non-Interactive Mode Query

**Goal**: Verify single query functionality

**Steps**:
```bash
# Basic query
claude-replica -p "Please introduce yourself in one sentence"

# Query with timeout
claude-replica -p "What is 1+1?" --timeout 30

# Specify model
claude-replica -p "Hello" --model sonnet
```

**Expected Results**:
- [ ] Return AI response
- [ ] Program automatically exits
- [ ] Exit code is 0

---

### Test 3: Output Format

**Goal**: Verify different output formats

**Steps**:
```bash
# Text format (default)
claude-replica -p "Say hello" --output-format text

# JSON format
claude-replica -p "Say hello" --output-format json

# Markdown format
claude-replica -p "Say hello" --output-format markdown

# Streaming JSON format
claude-replica -p "Say hello" --output-format stream-json
```

**Expected Results**:
- [ ] text: Plain text output
- [ ] json: Valid JSON structure
- [ ] markdown: Markdown format
- [ ] stream-json: One JSON event per line

---

### Test 4: File Operations

**Goal**: Verify file read/write functionality

**Steps**:
```bash
# Read file
claude-replica -p "Read src/index.js file content and explain"

# Create file
claude-replica -p "Create a src/utils.js file with an add function"

# Edit file
claude-replica -p "Modify src/index.js, add a comment line"
```

**Expected Results**:
- [ ] Can correctly read file content
- [ ] Can create new files
- [ ] Can edit existing files
- [ ] File content is correct

**Verification**:
```bash
cat src/index.js
cat src/utils.js
```

---

### Test 5: Command Execution

**Goal**: Verify Bash command execution functionality

**Steps**:
```bash
# Execute simple command
claude-replica -p "Execute ls -la command and explain output"

# Execute npm command
claude-replica -p "Execute npm list to view dependencies"

# Execute git command
claude-replica -p "Execute git status to view status"
```

**Expected Results**:
- [ ] Commands execute correctly
- [ ] Output is correctly parsed
- [ ] Dangerous commands require confirmation

---

### Test 6: Code Search

**Goal**: Verify Grep and Glob functionality

**Steps**:
```bash
# Search file content
claude-replica -p "Search for code containing console in the project"

# Find files
claude-replica -p "List all .js files"

# Complex search
claude-replica -p "Find all places where functions are defined"
```

**Expected Results**:
- [ ] Search results are accurate
- [ ] Show file paths and line numbers
- [ ] Support regular expressions

---

### Test 7: Session Management

**Goal**: Verify session saving and restoration

**Steps**:
```bash
# Start new session and converse
claude-replica
# Input: Remember the number 42
# Input: /exit

# Continue most recent session
claude-replica -c
# Input: What number did I ask you to remember?
# Input: /exit

# List all sessions
claude-replica sessions

# Restore specific session (use session ID from above)
claude-replica --resume <session-id>
```

**Expected Results**:
- [ ] Sessions are saved correctly
- [ ] Can continue most recent session
- [ ] Session list displays correctly
- [ ] Can restore specific session
- [ ] Context is correctly preserved

---

### Test 8: Built-in Commands

**Goal**: Verify all built-in commands

**Steps**:
```bash
# Start interactive mode
claude-replica

# Test each command
/help
/sessions
/config
/permissions
/mcp
/clear
/exit
```

**Expected Results**:
- [ ] `/help` shows help information
- [ ] `/sessions` lists sessions
- [ ] `/config` shows configuration
- [ ] `/permissions` shows permissions
- [ ] `/mcp` shows MCP status
- [ ] `/clear` clears screen
- [ ] `/exit` exits program

---

## Extension System Testing

### Test 9: Skills System

**Goal**: Verify skill loading and matching

**Preparation**:
```bash
# Create skills directory and file
mkdir -p .claude/skills

cat > .claude/skills/javascript-expert.md << 'EOF'
---
name: javascript-expert
description: JavaScript development expert
triggers:
  - javascript
  - js
  - node
tools:
  - Read
  - Write
  - Bash
---

You are a JavaScript development expert, specializing in:

## Core Capabilities
- ES6+ syntax
- Node.js development
- Asynchronous programming
- Module systems

## Best Practices
- Use const and let
- Avoid callback hell
- Use async/await
EOF
```

**Steps**:
```bash
# Trigger skill
claude-replica -p "Help me write a JavaScript function to calculate Fibonacci sequence"
```

**Expected Results**:
- [ ] Skill is automatically loaded
- [ ] AI response matches the skill's defined professional domain
- [ ] Uses best practices defined in the skill

---

### Test 10: Custom Commands

**Goal**: Verify custom command functionality

**Preparation**:
```bash
# Create commands directory and file
mkdir -p .claude/commands

cat > .claude/commands/review.md << 'EOF'
---
name: review
description: Code review
argumentHint: <file>
allowedTools:
  - Read
  - Grep
---

Please review the code quality of the following file:

$ARGUMENTS

Focus on:
1. Code style and readability
2. Potential bugs
3. Performance issues
4. Security vulnerabilities
EOF
```

**Steps**:
```bash
# Start interactive mode
claude-replica

# Use custom command
/review src/index.js
```

**Expected Results**:
- [ ] Command is correctly recognized
- [ ] Parameters are correctly replaced
- [ ] Executes code review task

---

### Test 11: Subagents

**Goal**: Verify subagent functionality

**Preparation**:
```bash
# Create agents directory and file
mkdir -p .claude/agents

cat > .claude/agents/test-expert.agent.md << 'EOF'
---
description: Testing expert, focused on writing high-quality tests
model: sonnet
tools:
  - Read
  - Write
  - Bash
---

You are a testing expert responsible for:

## Responsibilities
- Writing unit tests
- Analyzing test coverage
- Providing testing strategy advice

## Testing Principles
- Tests should be independent and repeatable
- Use descriptive test names
- Follow AAA pattern
EOF
```

**Steps**:
```bash
# Use subagent
claude-replica -p "@test-expert Please write unit tests for src/index.js"
```

**Expected Results**:
- [ ] Subagent is correctly called
- [ ] Uses专业知识 defined in subagent
- [ ] Generates test code that meets requirements

---

### Test 12: Hook System

**Goal**: Verify hook auto-triggering

**Preparation**:
```bash
# Create hook configuration
cat > .claude/hooks.json << 'EOF'
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "echo 'File modified: $FILE'"
        }
      ]
    }
  ],
  "SessionStart": [
    {
      "matcher": ".*",
      "hooks": [
        {
          "type": "prompt",
          "prompt": "Please remember: this is a test project"
        }
      ]
    }
  ]
}
EOF
```

**Steps**:
```bash
# Start new session (triggers SessionStart hook)
claude-replica

# Create file (triggers PostToolUse hook)
# Input: Create a test.txt file
```

**Expected Results**:
- [ ] SessionStart hook triggers at session start
- [ ] PostToolUse hook triggers after file write
- [ ] Hook commands execute correctly

---

## Integration Testing

### Test 13: MCP Integration

**Goal**: Verify MCP server integration

**Preparation**:
```bash
# Create MCP configuration (using filesystem server as example)
cat > .mcp.json << 'EOF'
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
  }
}
EOF
```

**Steps**:
```bash
# Start and check MCP status
claude-replica

# View MCP server status
/mcp

# Use MCP tool
# Input: Use MCP filesystem tool to list current directory
```

**Expected Results**:
- [ ] MCP server starts correctly
- [ ] `/mcp` shows server status
- [ ] MCP tools are available

---

### Test 14: Permission Management

**Goal**: Verify permission control functionality

**Steps**:
```bash
# Default mode (requires confirmation)
claude-replica -p "Delete test.txt file" --permission-mode default

# Auto-accept edits mode
claude-replica -p "Create auto-test.txt file" --permission-mode acceptEdits

# Plan mode (only generates plans)
claude-replica -p "Refactor entire project" --permission-mode plan

# Tool whitelist
claude-replica -p "Read README.md" --allowed-tools Read,Grep

# Tool blacklist
claude-replica -p "Execute ls command" --disallowed-tools Bash
```

**Expected Results**:
- [ ] default mode requires confirmation for sensitive operations
- [ ] acceptEdits mode auto-accepts file edits
- [ ] plan mode only generates plans without execution
- [ ] Whitelist restricts available tools
- [ ] Blacklist forbids specific tools

---

### Test 15: Rewind System

**Goal**: Verify file modification rewind functionality

**Steps**:
```bash
# Create test file
echo "Original content" > rewind-test.txt

# Start interactive mode
claude-replica

# Modify file
# Input: Change rewind-test.txt content to "Modified content"

# Verify modification
# Input: Read rewind-test.txt

# Trigger rewind menu (press Esc + Esc)
# Select restore to previous snapshot

# Verify rewind
# Input: Read rewind-test.txt
```

**Expected Results**:
- [ ] File modifications are recorded
- [ ] Rewind menu displays correctly
- [ ] File successfully restores to previous state

---

### Test 16: CLAUDE.md Project Context

**Goal**: Verify project context loading

**Preparation**:
```bash
# Create CLAUDE.md
cat > CLAUDE.md << 'EOF'
# Test Project

## Overview
This is a project for end-to-end testing.

## Tech Stack
- Node.js
- JavaScript

## Coding Standards
- Use 2-space indentation
- Use single quotes
- Keep blank line at end of files

## Common Commands
- npm test - Run tests
- npm start - Start project
EOF
```

**Steps**:
```bash
# Start session
claude-replica -p "What tech stack does this project use?"
```

**Expected Results**:
- [ ] CLAUDE.md is automatically loaded
- [ ] AI understands project context
- [ ] Response follows project standards

---

## CI/CD Testing

### Test 17: CI Environment Detection

**Goal**: Verify automatic CI environment detection

**Steps**:
```bash
# Simulate GitHub Actions environment
GITHUB_ACTIONS=true claude-replica -p "Hello" --output-format json

# Simulate GitLab CI environment
GITLAB_CI=true claude-replica -p "Hello" --output-format json

# Simulate Jenkins environment
JENKINS_URL=http://localhost claude-replica -p "Hello" --output-format json
```

**Expected Results**:
- [ ] Automatically use non-interactive mode
- [ ] Output structured logs
- [ ] Return appropriate exit codes

---

### Test 18: Exit Code Verification

**Goal**: Verify exit codes in various situations

**Steps**:
```bash
# Successful execution
claude-replica -p "1+1" --max-turns 1
echo "Exit code: $?"

# Timeout error
claude-replica -p "Write a 10000-word article" --timeout 1
echo "Exit code: $?"

# Configuration error (invalid model)
claude-replica -p "Hello" --model invalid-model
echo "Exit code: $?"
```

**Expected Results**:
- [ ] Success: Exit code 0
- [ ] Timeout: Exit code 5
- [ ] Configuration error: Exit code 2

---

### Test 19: GitHub Actions Integration

**Goal**: Verify GitHub Actions workflow

**Preparation**:
```yaml
# Create .github/workflows/test.yml
name: Claude Replica Test

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Claude Code CLI
        run: npm install -g @anthropic-ai/claude-code

      - name: Install Claude Replica
        run: npm install -g claude-replica

      - name: Run Test
        env:
          # Claude Agent SDK automatically retrieves authentication from Claude Code configuration
          # In CI, can be overridden by setting ANTHROPIC_API_KEY environment variable
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude-replica -p "Analyze this project" \
            --output-format json \
            --timeout 60
```

**Expected Results**:
- [ ] Workflow executes correctly
- [ ] Outputs JSON format results
- [ ] Correctly handles timeout

---

## Fault Recovery Testing

### Test 20: Network Error Handling

**Goal**: Verify network error handling

**Steps**:
```bash
# Use invalid API endpoint
ANTHROPIC_BASE_URL=https://invalid.example.com claude-replica -p "Hello"
```

**Expected Results**:
- [ ] Show network error message
- [ ] Exit code is 4

---

### Test 21: API Authentication Error

**Goal**: Verify API authentication error handling

**Steps**:
```bash
# Run in environment without Claude Code authentication configured
# Or use invalid authentication configuration
claude-replica -p "Hello"
```

**Expected Results**:
- [ ] Show authentication error message
- [ ] Exit code is 3

---

### Test 22: Interrupt Handling

**Goal**: Verify user interrupt handling

**Steps**:
```bash
# Start long-running task
claude-replica -p "Write a very long article"

# Press Ctrl+C to interrupt
```

**Expected Results**:
- [ ] Task is correctly interrupted
- [ ] Show interrupt message
- [ ] Program exits normally

---

## Performance Testing

### Test 23: Response Time

**Goal**: Measure response time of basic operations

**Steps**:
```bash
# Measure simple query response time
time claude-replica -p "1+1" --max-turns 1

# Measure file read response time
time claude-replica -p "Read README.md" --max-turns 1

# Measure code generation response time
time claude-replica -p "Write a simple hello world function" --max-turns 1
```

**Expected Results**:
- [ ] Simple query < 5 seconds
- [ ] File read < 10 seconds
- [ ] Code generation < 30 seconds

---

### Test 24: Session Cleanup

**Goal**: Verify session cleanup functionality

**Steps**:
```bash
# Create multiple test sessions
for i in {1..5}; do
  claude-replica -p "Test session $i" --max-turns 1
done

# List sessions
claude-replica sessions

# Clean old sessions
claude-replica sessions clean --older-than 0d

# Verify cleanup results
claude-replica sessions
```

**Expected Results**:
- [ ] Sessions are correctly created
- [ ] Cleanup command executes correctly
- [ ] Old sessions are deleted

---

## Test Result Recording

### Test Environment Information

| Item | Value |
|------|-------|
| Operating System | |
| Node.js Version | |
| npm Version | |
| Claude Replica Version | |
| Test Date | |

### Test Result Summary

| Test Number | Test Name | Status | Notes |
|-------------|-----------|--------|-------|
| 1 | Interactive Mode Startup | ⬜ | |
| 2 | Non-Interactive Mode Query | ⬜ | |
| 3 | Output Format | ⬜ | |
| 4 | File Operations | ⬜ | |
| 5 | Command Execution | ⬜ | |
| 6 | Code Search | ⬜ | |
| 7 | Session Management | ⬜ | |
| 8 | Built-in Commands | ⬜ | |
| 9 | Skills System | ⬜ | |
| 10 | Custom Commands | ⬜ | |
| 11 | Subagents | ⬜ | |
| 12 | Hook System | ⬜ | |
| 13 | MCP Integration | ⬜ | |
| 14 | Permission Management | ⬜ | |
| 15 | Rewind System | ⬜ | |
| 16 | CLAUDE.md Project Context | ⬜ | |
| 17 | CI Environment Detection | ⬜ | |
| 18 | Exit Code Verification | ⬜ | |
| 19 | GitHub Actions Integration | ⬜ | |
| 20 | Network Error Handling | ⬜ | |
| 21 | API Authentication Error | ⬜ | |
| 22 | Interrupt Handling | ⬜ | |
| 23 | Response Time | ⬜ | |
| 24 | Session Cleanup | ⬜ | |

Status Legend: ⬜ Untested | ✅ Passed | ❌ Failed | ⚠️ Partially Passed

---

## Issue Recording

### Issues Found

| Issue Number | Test Number | Issue Description | Severity | Status |
|--------------|-------------|-------------------|----------|--------|
| | | | | |

Severity: 🔴 Severe | 🟡 Medium | 🟢 Minor

---

## Appendix

### A. Test Data Cleanup

```bash
# Clean up test directory
rm -rf ~/claude-replica-e2e-test

# Clean up session data
rm -rf ~/.claude-replica/sessions/*

# Clean up logs
rm -rf ~/.claude-replica/logs/*
```

### B. Debug Mode

```bash
# Enable debug mode
CLAUDE_REPLICA_DEBUG=true claude-replica -p "test" --verbose
```

### C. Log Viewing

```bash
# View latest logs
ls -la ~/.claude-replica/logs/
tail -f ~/.claude-replica/logs/latest.log
```
