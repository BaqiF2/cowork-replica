# Claude Code Complete Feature Documentation

> **Version Note**: This document is written based on the latest information from 2025
> **Latest Models**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) and Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

---

## 📋 Table of Contents

1. [Product Overview](#product-overview)
2. [Core Features](#core-features)
3. [Installation and Configuration](#installation-and-configuration)
4. [Command-Line Interface (CLI)](#command-line-interface-cli)
5. [Interactive Mode Details](#interactive-mode-details)
6. [Extension Systems](#extension-systems)
7. [Advanced Features](#advanced-features)
8. [Best Practices](#best-practices)
9. [Automation and Integration](#automation-and-integration)
10. [Enterprise Features](#enterprise-features)
11. [Troubleshooting](#troubleshooting)

---

## Product Overview

### What is Claude Code?

Claude Code is **Anthropic's intelligent coding assistant command-line tool**. It is not just a code generator, but a complete AI-driven development framework capable of:

- 🤖 **Autonomous Execution** - Directly edit files, run commands, create commits
- 🧠 **Deep Understanding** - Maintain awareness of entire project structure
- 🔧 **Highly Extensible** - Extend via plugins, skills, MCP servers, etc.
- 🔄 **Unix Philosophy** - Composable, scriptable, pipeline-friendly

### Product Positioning

```
Traditional IDE Assistant Tools → Claude Code → Fully Autonomous AI Engineer
                    (your position)
```

Claude Code is positioned in the middle: it has enough autonomy to complete complex tasks, while still maintaining human supervision and control.

---

## Core Features

### 1. Code Generation and Editing

#### Basic Capabilities
- **Build Features from Description**: Describe requirements in natural language, Claude creates plans, writes code, and ensures it works
- **Direct File Operations**: Edit files without waiting for permissions (some bash commands excepted)
- **Multi-file Coordination**: Make consistent modifications across multiple files

#### Example Scenarios
```bash
# Create complete user authentication system
claude "Implement a user authentication system with JWT tokens and password hashing"

# Refactor existing code
claude "Refactor this Java class to use better design patterns"
```

### 2. Debugging and Problem Fixing

#### Intelligent Debugging Process
1. **Analyze** - Parse error messages and stack traces
2. **Locate** - Find root cause in codebase
3. **Fix** - Implement solution
4. **Verify** - Run tests to confirm fix is effective

#### Debugging Mode
```bash
# Paste error information
claude "This is the error I encountered: [error information]"

# Analyze log file
tail -f app.log | claude -p "If you see exceptions, notify me via Slack"
```

### 3. Codebase Navigation and Understanding

#### Full Codebase Awareness
- Maintain awareness of complete project structure
- Understand dependencies between files
- Quickly locate related code snippets

#### Usage Methods
```bash
# Understand codebase
claude "Analyze this codebase structure and suggest improvements. @./src/"

# Answer architecture questions
claude "How does this authentication flow work?"

# Find specific functionality
claude "Where is the user registration logic?"
```

### 4. Git Workflow Automation

#### Git Integration Capabilities
- 📝 **Auto-generate commit messages** - Based on changes and history
- 🔍 **Search Git history** - Answer "what changes went into v1.2.3?"
- ⚔️ **Handle complex operations** - Revert files, resolve rebase conflicts, compare and cherry-pick patches

#### Practical Examples
```bash
# Automate commit process
claude "review my changes, write a good commit message, then commit"

# Search history
claude "look at git history and tell me why this API was designed this way"

# Resolve conflicts
claude "help me resolve this rebase conflict"
```

### 5. Automate Tedious Tasks

#### Common Automation Scenarios
- 🔧 Fix lint issues
- 🔀 Resolve merge conflicts
- 📋 Write release notes
- 🧪 Generate boilerplate code
- 📊 Update documentation

---

## Installation and Configuration

### Quick Installation

#### Method 1: Use Claude Pro/Max Subscription
```bash
# Automatic installation (recommended)
curl -fsSL https://anthropic.com/installer | sh

# Verify installation
claude --version
```

#### Method 2: Use API
```bash
# Set API key
export ANTHROPIC_API_KEY='your-api-key-here'

# Install
npm install -g @anthropic-ai/claude-code
# or
pip install claude-code --break-system-packages
```

### Subscription Plan Selection

| Plan | Use Case | Token Limit | Price |
|------|----------|-------------|-------|
| **Pro** | Medium to high intensity coding work | Base quota | $20/month |
| **Max5** | Intensive coding work | 5x Pro | $100/month |
| **Max20** | Nearly autonomous heavy development | 20x Pro | $200/month |

> **💡 Tip**: Sessions start when first message is sent and last 5 hours. Using Opus consumes tokens faster.

### Directory Structure

```
~/.claude/                    # User-level configuration
├── settings.json            # User settings
├── mcp.json                # MCP server configuration
├── agents/                 # User-level subagents
├── commands/               # User-level custom commands
└── skills/                 # User-level skills

<project>/.claude/           # Project-level configuration
├── settings.json           # Project settings (shared)
├── settings.local.json     # Local settings (gitignored)
├── agents/                 # Project subagents
├── commands/               # Project custom commands
└── skills/                 # Project skills

<project>/.mcp.json          # Project MCP servers
<project>/CLAUDE.md          # Project memory/instruction document
```

---

## Command-Line Interface (CLI)

### Basic Commands

#### Start Interactive Session
```bash
# Start in current directory
claude

# Start in specific directory
cd /path/to/project && claude

# Start with initial prompt
claude "help me implement a new feature"
```

#### Non-Interactive Mode (Headless Mode)
```bash
# Print mode - execute and exit
claude -p "analyze this code's complexity"

# Different output formats
claude -p "run tests" --output-format json
claude -p "check errors" --output-format stream-json

# Continue most recent session
claude -c -p "continue the previous work"

# Resume specific session
claude --resume <session-id> -p "what's next?"
```

### Core Flags

#### System Prompt Customization
```bash
# Append system prompt (recommended)
claude --append-system-prompt "you are a security expert"

# Completely replace system prompt
claude --system-prompt "custom system prompt..."

# Load system prompt from file
claude --system-prompt-file ./custom-prompt.txt
```

#### Tool Restrictions
```bash
# Restrict available tools
claude --allowedTools "Bash,Read,Grep"

# Restrict to specific MCP tools
claude --allowedTools "mcp__github__create_issue"
```

#### Permission Control
```bash
# Skip all permission checks (dangerous!)
claude --dangerously-skip-permissions

# Plan mode (read-only)
claude --permission-mode plan
```

#### Dynamic Subagent Injection
```bash
# Add subagent via command line
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer. Focus on quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

### Piping and Composition

Claude Code follows the Unix philosophy and can be combined with other tools:

```bash
# Log analysis
tail -f app.log | claude -p "notify me via Slack if you see exceptions"

# Git diff review
git diff | claude -p "review these changes for security issues"

# Batch process files
find . -name "*.js" | xargs claude -p "add JSDoc comments to each file"

# CI integration
claude -p "if there are new text strings, translate to French and submit PR for @lang-fr-team"
```

---

## Interactive Mode Details

### Three Working Modes

#### 1. Auto Mode - Default
- Claude automatically executes tasks without confirmation at each step
- Still requests permissions for some bash commands (like installing packages)
- Press `Esc` to stop anytime

```bash
claude
> help me build a REST API
# Claude starts working automatically...
```

#### 2. Plan Mode
- Use extended thinking ability to create detailed strategies
- Suitable for alignment before complex changes
- Generate technical design documents

```bash
claude --permission-mode plan
> design a microservice architecture
# Claude creates detailed plan without executing
```

#### 3. Manual Confirmation Mode
```bash
# Configure commands requiring confirmation via /permissions
/permissions
> add: npm install -> requires confirmation
```

### Interactive Commands (Slash Commands)

#### Built-in Commands
```bash
/help              # Show all available commands
/agents            # Manage subagents
/hooks             # Configure hooks
/mcp               # Manage MCP servers
/permissions       # View/edit permissions
/config            # Open settings
/plugin            # Manage plugins
/bug               # Report issues
```

#### File References
```bash
# Reference files or directories
> analyze @src/main.js performance issues
> refactor all components under @./components/
```

#### Run Shell Commands
```bash
# Run commands directly in conversation
> please run `npm test` and analyze failed tests
```

### Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Esc` | Stop current operation |
| `Esc + Esc` | Open rewind menu (restore to previous state)|
| `Cmd/Ctrl + V` | Paste (supports screenshots) |
| `Cmd/Ctrl + Shift + 4` (macOS) | Screenshot to clipboard |

---

## Extension Systems

Claude Code has powerful extension capabilities through five extension mechanisms:

### 1. Skills ⭐

#### What are Skills?
Skills are **automatically invoked modular capabilities** that Claude loads based on conversation context.

#### Skill Characteristics
- **Auto-invocation** - Based on description matching, no manual trigger needed
- **Context-aware** - Intelligently loaded based on task requirements
- **Knowledge encapsulation** - Contains domain expertise and workflows
- **Composable** - Multiple skills can collaborate simultaneously

#### Skill Structure
```
skills/
└── my-skill/
    └── SKILL.md              # Skill definition file
```

#### SKILL.md Example
```markdown
---
name: java-expert
description: Java and Spring Boot expert. Auto-loaded when users need Java development, Spring Boot configuration, JPA usage, or Java best practices.
triggers:
  - Java development
  - Spring Boot
  - JPA configuration
tools:
  - Read
  - Bash
---

# Java Development Expert Skill

## Core Capabilities
- Spring Boot 3.x application development
- JPA/Hibernate configuration and optimization
- Dependency injection best practices
- RESTful API design

## Coding Standards
- Use Java 21 features
- Follow Google Java Style Guide
- All public methods need JavaDoc
- Exceptions must log

## Common Tasks
### Create new REST endpoint
1. Create controller in controller package
2. Use @RestController and @RequestMapping
3. Implement request handling method
4. Add exception handling
5. Write unit tests
```

#### Skill Usage Scenarios

**Scenario 1: Personal Work Style**
```markdown
---
name: personal-style
description: BaqiF2's personal work preferences and communication style. Auto-loaded when drafting emails, Slack messages, or internal updates for him.
---

## Communication Style
- Use Chinese for technical discussions
- Like detailed technical implementation details
- Prefer command-line tools over graphical interfaces

## Code Preferences
- Focus on code quality and maintainability
- Detailed comments and documentation
- Use SLF4J for logging
```

**Scenario 2: Tech Stack Expert**
```markdown
---
name: blockchain-expert
description: Blockchain and Web3j development expert. Auto-loaded when handling Ethereum smart contracts, blockchain data, or Web3j APIs.
---

## Tech Stack
- Web3j 4.x
- Ethereum JSON-RPC
- Solidity smart contracts

## Best Practices
- Always verify transaction hashes
- Use appropriate gas limits
- Implement retry mechanism for RPC errors
```

### 2. Custom Commands (Custom Commands)

#### What are Custom Commands?
Custom commands are **manually triggered workflow templates** invoked via `/`.

#### Command Structure
```
commands/
└── my-command.md             # Command definition file
```

#### Simple Command Example
```markdown
---
name: test
description: Run all unit tests and report results
---

Please run the project's unit test suite:

1. Run `npm test` or `mvn test`
2. Analyze test results
3. If there are failures, show failed tests and reasons
4. Provide fix suggestions
```

#### Command with Arguments
```markdown
---
name: fix-github-issue
argument-hint: [issue-number]
description: Analyze and fix GitHub issue
---

Please analyze and fix GitHub issue: $ARGUMENTS

Steps:
1. Use `gh issue view $ARGUMENTS` to get issue details
2. Understand problem description
3. Search for related files in codebase
4. Implement necessary changes
5. Write and run tests to verify fix
6. Ensure code passes lint and type checks
7. Create descriptive commit message
8. Push and create PR
```

#### Use Custom Commands
```bash
# List all commands
/help

# Use project command
/project:test

# Use command with arguments
/project:fix-github-issue 1234

# Use user-level command
/user:deploy-staging
```

#### Advanced Command Features

**Tool Restrictions**
```markdown
---
name: safe-commit
allowed-tools:
  - Bash(git add:*)
  - Bash(git status:*)
  - Bash(git commit:*)
argument-hint: [message]
---

## Context
- Current git status: !`git status`
- Current git diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`

Create git commit: $ARGUMENTS
```

**Include File Content**
```markdown
---
name: review-changes
---

Please review the following changes:

Current changes:
!`git diff HEAD`

Recent commits:
!`git log --oneline -5`
```

### 3. Subagents (Subagents)

#### What are Subagents?
Subagents are **specialized Claude instances** with independent context windows and role positioning.

#### Subagent Architecture
```
You ↔ Main Claude (Coordinator)
     ├── Code Reviewer (Quality Expert)
     ├── Test Engineer (Testing Expert)
     └── Technical Writer (Documentation Expert)
```

#### Create Subagent
```bash
# Use interactive command to create
/agents
> create a code review subagent

# Or via command line
claude --agents '{
  "reviewer": {
    "description": "For in-depth code review",
    "model": "sonnet",
    "color": "orange",
    "prompt": "You are an expert code reviewer. Focus on security, performance, and maintainability."
  }
}'
```

#### Subagent Configuration File
```markdown
---
name: reviewer
description: For in-depth code review
model: sonnet
color: orange
---

You are an expert code reviewer. Focus on:

## Review Focus
- Security vulnerabilities
- Performance bottlenecks
- Code maintainability
- Follow best practices

## Review Process
1. Thoroughly read code changes
2. Identify potential issues
3. Provide specific improvement suggestions
4. Evaluate test coverage
```

#### Use Subagents
```bash
# Explicit invocation
> @reviewer please review this PR

# Automatic routing (based on description matching)
> please review my code changes
# Claude automatically routes task to reviewer
```

#### Subagent Advantages
- ✅ **Isolated Context** - Won't pollute main conversation's context window
- ✅ **Specialization** - Each agent focuses on specific domain
- ✅ **Parallel Processing** - Can handle multiple tasks simultaneously
- ✅ **Tool Restrictions** - Can limit specific agent's tool access

### 4. Hooks (Hooks)

#### What are Hooks?
Hooks are **event-driven automation mechanisms** that automatically trigger after specific tool usage.

#### Hook Types
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix $FILE"
          }
        ]
      }
    ]
  }
}
```

#### Common Hook Scenarios

**Auto Lint**
```json
{
  "PostToolUse": [{
    "matcher": "Write",
    "hooks": [{
      "type": "command",
      "command": "eslint --fix $FILE"
    }]
  }]
}
```

**Auto Format**
```json
{
  "PostToolUse": [{
    "matcher": "Write.*\\.java$",
    "hooks": [{
      "type": "command",
      "command": "google-java-format -i $FILE"
    }]
  }]
}
```

**Auto Test**
```json
{
  "PostToolUse": [{
    "matcher": "Write.*test\\.ts$",
    "hooks": [{
      "type": "command",
      "command": "npm test $FILE"
    }]
  }]
}
```

#### Configure Hooks
```bash
# Interactive configuration
/hooks

# Or edit configuration file
# .claude/settings.json or settings.local.json
```

### 5. Plugins (Plugins)

#### What are Plugins?
Plugins are **packaged extension collections** that can include commands, agents, skills, hooks, and MCP servers.

#### Plugin Structure
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest
├── commands/                # Custom commands
│   └── my-command.md
├── agents/                  # Subagents
│   └── my-agent.md
├── skills/                  # Skills
│   └── my-skill/
│       └── SKILL.md
├── hooks/
│   └── hooks.json          # Hook configuration
└── .mcp.json               # MCP server configuration
```

#### plugin.json Example
```json
{
  "name": "java-toolkit",
  "version": "1.0.0",
  "description": "Java development toolkit",
  "author": "BaqiF2",
  "repository": "https://github.com/user/java-toolkit",
  "dependencies": {
    "java": ">=21",
    "maven": ">=3.8"
  }
}
```

#### Install Plugin
```bash
# Install from marketplace
claude plugin install java-toolkit

# Install from local
claude --plugin-dir /path/to/my-plugin

# Install from Git repository
claude plugin install github:user/repo
```

#### Create Plugin
```bash
# Create plugin directory structure
mkdir -p my-plugin/.claude-plugin
mkdir -p my-plugin/{commands,agents,skills,hooks}

# Create plugin manifest
cat > my-plugin/.claude-plugin/plugin.json << 'EOF'
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin"
}
EOF
```

### 6. MCP Server Integration

#### What is MCP?
Model Context Protocol (MCP) is a **standardized AI tool integration protocol**, like USB-C for AI.

#### MCP vs Other Extensions

| Feature | Skills | Commands | MCP |
|---------|--------|----------|-----|
| Trigger | Auto | Manual | Tool call |
| Purpose | Knowledge/workflow | Workflow templates | External system connections |
| Example | Coding standards | Test process | GitHub API |

#### MCP Configuration Methods

**1. Project-level Configuration (.mcp.json)**
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  },
  "database": {
    "command": "python",
    "args": ["-m", "mcp_server_postgres"],
    "env": {
      "DATABASE_URL": "${DATABASE_URL}"
    }
  }
}
```

**2. User-level Configuration (~/.claude/mcp.json)**
```json
{
  "slack": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-slack"],
    "env": {
      "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
      "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
    }
  }
}
```

**3. Command Line Addition**
```bash
# Add stdio transport MCP
claude mcp add github \
  --env GITHUB_TOKEN=your-token \
  -- npx -y @modelcontextprotocol/server-github

# Add SSE transport MCP
claude mcp add --transport sse myservice https://api.example.com/mcp

# Add HTTP transport MCP
claude mcp add --transport http myapi https://api.example.com/mcp
```

#### Common MCP Servers

**Development Tools**
```bash
# GitHub
claude mcp add github --env GITHUB_TOKEN=$TOKEN -- npx -y @modelcontextprotocol/server-github

# GitLab
claude mcp add gitlab --env GITLAB_TOKEN=$TOKEN -- npx -y @modelcontextprotocol/server-gitlab

# Jira
claude mcp add jira --env JIRA_TOKEN=$TOKEN -- npx -y @modelcontextprotocol/server-jira
```

**Databases**
```bash
# PostgreSQL
claude mcp add postgres --env DATABASE_URL=$URL -- npx -y @modelcontextprotocol/server-postgres

# MongoDB
claude mcp add mongodb --env MONGODB_URI=$URI -- npx -y @modelcontextprotocol/server-mongodb
```

**Productivity Tools**
```bash
# Slack
claude mcp add slack --env SLACK_BOT_TOKEN=$TOKEN -- npx -y @modelcontextprotocol/server-slack

# Google Drive
claude mcp add gdrive --env GOOGLE_CREDENTIALS=$CREDS -- npx -y @modelcontextprotocol/server-gdrive

# Notion
claude mcp add notion --env NOTION_TOKEN=$TOKEN -- npx -y @modelcontextprotocol/server-notion
```

#### MCP Tool Naming
MCP tools use special prefixes in Claude Code:
```
mcp__<server-name>__<tool-name>
mcp__plugin_<plugin-name>_<server-name>__<tool-name>
```

Example:
```markdown
---
allowed-tools:
  - mcp__github__create_issue
  - mcp__github__search_code
  - mcp__plugin_asana_asana__asana_create_task
---
```

#### Debug MCP
```bash
# Enable MCP debug mode
claude --mcp-debug

# View MCP server status
/mcp
```

---

## Advanced Features

### 1. CLAUDE.md - Project Memory

#### What is CLAUDE.md?
CLAUDE.md is a **persistent context document** for the project, like a project constitution.

#### CLAUDE.md Content Suggestions

```markdown
# Project Context

## Project Information
- Name: Enterprise CRM System
- Tech Stack: Spring Boot 3.3 + Java 21 + PostgreSQL
- Owner: BaqiF2

## Coding Standards
- Use Java 21 features (record classes, pattern matching)
- Follow Google Java Style Guide
- All public APIs need JavaDoc
- Use SLF4J for logging

## Architecture
- Frontend: React + TypeScript
- Backend: Spring Boot REST API
- Database: PostgreSQL with Prisma
- Cache: Redis

## File Organization
- Controllers: `src/main/java/com/example/controller/`
- Services: `src/main/java/com/example/service/`
- Repositories: `src/main/java/com/example/repository/`
- Tests: `src/test/java/` (mirror main code structure)

## Workflow
1. All features must write tests first
2. Code changes need to pass CI/CD pipeline
3. PR needs at least one reviewer
4. Use semantic versioning

## Common Tasks
### Add new REST endpoint
1. Create new controller in controller package
2. Implement service layer logic
3. Add JPA repository (if needed)
4. Write unit tests and integration tests
5. Update API documentation

## Prohibited
- ❌ Don't use `System.out.println` - use logging framework
- ❌ Don't write business logic directly in controllers
- ❌ Don't commit sensitive information to Git
```

### 2. Image and Chart Support

#### Supported Usage Scenarios
- 📊 **Design Mockups** - Upload UI design images, let Claude implement
- 📈 **Chart Analysis** - Analyze visualized data
- 🐛 **Screenshot Debugging** - Show UI errors
- 📐 **Architecture Diagrams** - Upload system architecture diagrams for discussion

#### Usage Methods

**Method 1: Paste (macOS)**
```bash
# 1. Screenshot to clipboard
Cmd + Ctrl + Shift + 4

# 2. Paste in Claude
Ctrl + V  # Note: not Cmd + V
```

**Method 2: Drag and Drop**
```bash
# Directly drag image to Claude prompt input area
```

**Method 3: File Path**
```bash
> implement this UI based on @./mockup.png
```

#### Design Implementation Workflow
```bash
# 1. Upload design image
> This is the UI design I want [paste screenshot]

# 2. Claude implements code
> please implement this design using React and Tailwind CSS

# 3. Iterative optimization
> colors should be softer, add more rounded corners

# 4. Screenshot comparison
> looks great! please commit the code
```

### 3. Rewind System (Rewind)

#### What is Rewind?
Claude Code automatically tracks all file edits, allowing quick restoration to previous states.

#### Use Rewind
```bash
# Open rewind menu
Esc + Esc

# Menu shows:
# - Recent file changes
# - Timestamps
# - Change summary
```

#### Rewind Scenarios
- ❌ Claude's changes went wrong
- 🔄 Want to try different approaches
- 🎯 Return to known good state
- 📊 Compare different implementation solutions

### 4. Session Management

#### Session Features
- ⏰ **5-hour validity** - From first message
- 💾 **Auto-save** - Complete message history and tool state
- 🔄 **Resumable** - Continue previous sessions anytime

#### Session Commands
```bash
# List all sessions
claude sessions

# Resume specific session
claude --resume <session-id>

# Continue most recent session (non-interactive)
claude -c -p "continue the previous work"

# Delete old sessions
claude sessions clean --older-than 7d
```

#### Multi-Session Strategy
```bash
# Create independent sessions for different tasks
claude  # Session 1: Feature development
claude  # Session 2: Bug fixing
claude  # Session 3: Code review
```

### 5. Browser Integration (Chrome Extension)

#### Chrome Extension Capabilities
- 🌐 **Browser Automation** - Control browser for testing
- 📸 **Webpage Screenshots** - Automatically capture page screenshots
- 🔍 **Element Inspection** - Analyze DOM structure
- ✅ **E2E Testing** - End-to-end automated testing

#### Usage Scenarios
```bash
# UI implementation and verification
> visit http://localhost:3000, take screenshot, then tell me differences from design

# Webpage data extraction
> visit this competitor website, analyze their pricing strategy

# Automated testing
> test login flow: visit homepage, fill form, submit, verify redirect
```

---

## Best Practices

### 1. Prompt Engineering Best Practices

#### Be Specific and Clear
```bash
# ❌ Bad
"optimize this code"

# ✅ Good
"refactor this Java class to use Strategy pattern instead of if-else chain, and add unit tests"
```

#### Provide Context
```bash
# ✅ Include relevant files
"refactor @src/UserService.java to comply with coding standards in @CLAUDE.md"

# ✅ Reference error messages
"fix this error: [complete stack trace]"

# ✅ Describe expected behavior
"after user clicks submit button, should see success message then redirect to dashboard"
```

#### Break Down Complex Tasks
```bash
# Step 1: Research
"analyze current authentication system, identify security vulnerabilities"

# Step 2: Plan
"create implementation plan for adding 2FA"

# Step 3: Implement
"implement 2FA functionality according to plan"

# Step 4: Verify
"write integration tests to verify 2FA works properly"

# Step 5: Document
"update documentation on how to use 2FA"
```

### 2. Test-Driven Development (TDD) Workflow

#### TDD Cycle
```bash
# 1. Write failing test
"write tests for user registration feature (implementation not needed yet)"

# 2. Implement minimum code
"implement code to make tests pass"

# 3. Refactor
"refactor implementation code to improve readability"

# 4. Verify
"run all tests to ensure no existing functionality broken"
```

#### Automated TDD
```markdown
---
name: tdd-cycle
---

# TDD Development Cycle

For feature $ARGUMENTS:

1. **Red**: Write failing tests
   - Run: `npm test` confirm failure

2. **Green**: Write minimal implementation
   - Make tests pass
   - Run tests again to confirm

3. **Refactor**: Improve code
   - Improve readability
   - Eliminate duplication
   - Keep tests passing

4. **Verify**: Final check
   - Run full test suite
   - Check code coverage
   - Run linter
```

### 3. Git Best Practices

#### Atomic Commit Workflow
```bash
# 1. Make small, independent changes
"add user email verification, don't include other changes"

# 2. Review changes
"check git diff, ensure only related changes"

# 3. Create descriptive commit
"write a good commit message and commit"

# 4. Optional: create PR
"create PR with title 'add email verification', body includes change description"
```

#### Branch Strategy
```bash
# Feature branch
"create new branch feature/email-verification and switch"

# When done
"merge to main and delete feature branch"

# Conflict resolution
"pull latest main, resolve any merge conflicts"
```

### 4. Code Review Workflow

#### Use Subagent for Review
```bash
# 1. Complete development
"implement user authentication feature"

# 2. Self-review
"review my changes, look for obvious issues"

# 3. Subagent deep review
"@reviewer please deeply review these changes, focus on security and performance"

# 4. Apply feedback
"apply review suggestions and update code"

# 5. Final check
"@reviewer quick check of updated code"
```

#### Review Checklist
```markdown
# Code Review Checklist

## Functionality
- [ ] Code implements required functionality
- [ ] Edge cases are handled
- [ ] Error handling is appropriate

## Code Quality
- [ ] Code is readable and appropriately commented
- [ ] Follows project coding standards
- [ ] No obvious code smells

## Testing
- [ ] Adequate test coverage
- [ ] Tests are meaningful and pass
- [ ] Include edge case tests

## Security
- [ ] No obvious security vulnerabilities
- [ ] Sensitive data is protected
- [ ] Input is validated

## Performance
- [ ] No obvious performance issues
- [ ] Reasonable resource usage
- [ ] Database queries optimized
```

### 5. Project Onboarding

#### Anthropic's Onboarding Practice
```bash
# New engineer onboarding process
claude

> I just joined the team, please help me understand this codebase

> 1. What is the high-level architecture?
> 2. What are the main components?
> 3. How does data flow?
> 4. How to set up development environment?
> 5. Where should the first PR start?
```

#### Create Onboarding Skill
```markdown
---
name: onboarding
description: Help new team members understand the project. Loaded when asking about project overview, architecture, or getting started guides.
---

# Project Onboarding Guide

## Architecture Overview
[High-level architecture description of project]

## Key Concepts
[Core concepts and glossary]

## Development Environment Setup
1. Clone repository
2. Install dependencies
3. Configure environment variables
4. Run local server

## First Task Suggestions
- Fix issues marked "good first issue"
- Add unit tests to improve coverage
- Improve documentation

## Key Contacts
- Architecture: @architect
- Frontend: @frontend-lead
- Backend: @backend-lead
```

### 6. Debugging Strategies

#### Systematic Debugging
```bash
# 1. Reproduce issue
"I encountered this error: [error information]. Environment is [description]"

# 2. Gather information
"check last 100 lines of log file @logs/app.log"

# 3. Form hypothesis
"based on error and logs, what do you think the problem might be?"

# 4. Test hypothesis
"add debug logs to verify hypothesis"

# 5. Implement fix
"implement fix and verify issue resolved"

# 6. Prevent recurrence
"add tests to ensure this bug doesn't appear again"
```

#### Log Analysis
```bash
# Real-time monitoring
tail -f app.log | claude -p "monitor logs for error patterns, alert me when anomalies found"

# Historical analysis
cat app.log | claude -p "analyze this log file, find root cause of service interruption"
```

---

## Automation and Integration

### 1. CI/CD Integration

#### GitHub Actions Integration

**Automatic Code Review**
```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Review with Claude
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm install -g @anthropic-ai/claude-code

          # Get PR diff
          gh pr diff ${{ github.event.pull_request.number }} > changes.diff

          # Claude review
          claude -p --output-format json "review this PR for security and performance issues" \
            < changes.diff > review.json

          # Post comment
          gh pr comment ${{ github.event.pull_request.number }} \
            --body-file review.json
```

**Auto-fix Issues**
```yaml
# .github/workflows/claude-fix-issue.yml
name: Auto-fix Issues

on:
  issues:
    types: [labeled]

jobs:
  fix:
    if: github.event.label.name == 'auto-fix'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Fix Issue
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Get issue details
          ISSUE_BODY=$(gh issue view ${{ github.event.issue.number }} --json body -q .body)

          # Claude fix
          claude -p --dangerously-skip-permissions \
            "analyze and fix issue #${{ github.event.issue.number }}: $ISSUE_BODY"

          # Create PR
          gh pr create \
            --title "Fix: #${{ github.event.issue.number }}" \
            --body "Auto-fix issue #${{ github.event.issue.number }}"
```

**Auto-generate Tests**
```yaml
# .github/workflows/claude-tests.yml
name: Generate Tests

on:
  push:
    paths:
      - 'src/**/*.ts'
      - '!src/**/*.test.ts'

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Generate Missing Tests
        run: |
          # Find files without tests
          for file in $(find src -name "*.ts" ! -name "*.test.ts"); do
            test_file="${file%.ts}.test.ts"
            if [ ! -f "$test_file" ]; then
              claude -p "generate comprehensive unit tests for $file"
            fi
          done

          # Commit new tests
          git add .
          git commit -m "chore: add missing tests"
          git push
```

### 2. Pre-commit Hooks

#### Auto Lint Fix
```bash
# .git/hooks/pre-commit
#!/bin/bash

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Let Claude fix lint issues
echo "$STAGED_FILES" | claude -p "fix lint errors in these files, don't change functionality"

# Re-stage fixed files
git add $STAGED_FILES
```

#### Commit Message Generation
```bash
# .git/hooks/prepare-commit-msg
#!/bin/bash

COMMIT_MSG_FILE=$1

# If commit message is empty, let Claude generate
if [ ! -s "$COMMIT_MSG_FILE" ]; then
  git diff --cached | claude -p --output-format stream-json \
    "generate commit message following conventional commits" \
    > "$COMMIT_MSG_FILE"
fi
```

### 3. Scheduled Tasks

#### Dependency Updates
```bash
# crontab: Check dependency updates every Monday
0 9 * * 1 cd /project && claude -p "check for outdated dependencies and create update PR"
```

#### Performance Monitoring
```bash
# Analyze performance logs daily
0 2 * * * cd /project && cat performance.log | claude -p "analyze performance trends, report degradation"
```

#### Security Audit
```bash
# Monthly security audit
0 0 1 * * cd /project && claude -p "perform security audit, identify potential vulnerabilities"
```

### 4. Batch Operations

#### Batch File Processing
```bash
# Add PropTypes to all components
find src/components -name "*.jsx" | while read file; do
  claude -p "add PropTypes validation to $file"
done

# Batch refactor
find . -name "*.java" | claude -p --dangerously-skip-permissions \
  "upgrade all these files from Java 8 to Java 21 syntax"
```

#### Batch Test Generation
```bash
# Generate missing tests
for file in src/**/*.ts; do
  if [ ! -f "${file%.ts}.test.ts" ]; then
    claude -p "generate test file ${file%.ts}.test.ts for $file"
  fi
done
```

---

## Enterprise Features

### 1. API Access

#### Configure API
```bash
# Set API key
export ANTHROPIC_API_KEY='sk-ant-...'

# Custom API endpoint (enterprise deployment)
export ANTHROPIC_API_URL='https://api.enterprise.com'

# Verify configuration
claude -p "test" --output-format json
```

#### Pay-as-you-go vs Subscription

| Usage Pattern | Recommended Solution | Considerations |
|---------------|---------------------|----------------|
| Occasional use | Pay-as-you-go API | Cost-effective |
| Frequent use | Pro/Max subscription | Token refresh window |
| Team deployment | Enterprise API | Unified management |

### 2. Docker Sandbox

#### Configure Custom API
```json
{
  "dockerSandbox": {
    "apiEndpoint": "https://custom-api.company.com",
    "apiKey": "${CUSTOM_API_KEY}"
  }
}
```

### 3. Team Collaboration

#### Shared Configuration
```bash
# Project-level configuration (committed to Git)
.claude/
├── settings.json          # Team-shared settings
├── agents/               # Team subagents
├── commands/             # Team commands
└── skills/               # Team skills

# Local configuration (not committed)
.claude/
└── settings.local.json   # Personal override settings
```

#### Configuration Priority
```
settings.local.json > .claude/settings.json > ~/.claude/settings.json
```

### 4. Audit and Compliance

#### Complete Audit Log
```bash
# GitHub Actions automatically logs all Claude operations
- name: Run with Audit
  run: |
    claude -p "${{ inputs.task }}" \
      --output-format stream-json \
      | tee -a audit.log

    # Upload audit log
    aws s3 cp audit.log s3://audit-bucket/$(date +%Y%m%d)/
```

#### Session Review
```bash
# Regularly review Claude sessions
claude sessions | claude -p "analyze common error patterns, suggest improvements to CLAUDE.md"
```

---

## Troubleshooting

### Common Issues

#### 1. Installation Issues

**Problem**: `command not found: claude`
```bash
# Solution 1: Check PATH
echo $PATH | grep claude

# Solution 2: Reinstall
curl -fsSL https://anthropic.com/installer | sh
source ~/.bashrc

# Solution 3: Manually add to PATH
export PATH="$HOME/.claude/bin:$PATH"
```

**Problem**: Python package installation fails
```bash
# Always use --break-system-packages in Claude Code's bash
pip install pandas --break-system-packages
```

#### 2. Permission Issues

**Problem**: Claude constantly requests permissions
```bash
# Solution 1: Configure permissions
/permissions
> add whitelist: npm install, git commit

# Solution 2: Danger mode (use carefully)
claude --dangerously-skip-permissions

# Solution 3: Plan mode (read-only)
claude --permission-mode plan
```

#### 3. MCP Connection Issues

**Problem**: MCP server cannot connect
```bash
# 1. Enable debug
claude --mcp-debug

# 2. Check MCP configuration
/mcp

# 3. Verify environment variables
echo $GITHUB_TOKEN

# 4. Test MCP server standalone
npx -y @modelcontextprotocol/server-github
```

#### 4. Performance Issues

**Problem**: Claude responds slowly
```bash
# 1. Check network
ping api.anthropic.com

# 2. Use faster model
claude --model haiku  # Faster but slightly less capable

# 3. Reduce context
# Don't include unnecessary large files

# 4. Use subagents
# Isolate different task contexts
```

**Problem**: Token consumption too fast
```bash
# 1. Use subagents
# Prevent context window bloat

# 2. Create new sessions
# Use independent sessions for different tasks

# 3. Optimize CLAUDE.md
# Only include necessary information

# 4. Use skills instead of repetitive prompts
# Encapsulate common instructions as skills
```

#### 5. Skills and Plugins Issues

**Problem**: Skills not loaded
```bash
# 1. Check skill locations
ls -la .claude/skills/
ls -la ~/.claude/skills/

# 2. Verify SKILL.md format
# Ensure correct YAML frontmatter

# 3. Check description matching
# Description should clearly indicate when to use skill

# 4. Restart Claude Code
# Skills are loaded at startup
```

**Problem**: Plugin installation fails
```bash
# 1. Check plugin manifest
cat plugin/.claude-plugin/plugin.json

# 2. Verify dependencies
# Ensure all dependencies installed

# 3. Test with --plugin-dir
claude --plugin-dir ./my-plugin

# 4. Check logs
claude --verbose
```

### Debugging Tips

#### Use Verbose Mode
```bash
# Enable verbose output
claude --verbose

# View complete tool calls
export CLAUDE_DEBUG=1
claude
```

#### Check Configuration
```bash
# View effective configuration
/config

# Check MCP servers
/mcp

# Check permissions
/permissions

# List available agents
/agents
```

#### Log Analysis
```bash
# Claude Code log location
~/.claude/logs/

# View recent logs
tail -f ~/.claude/logs/claude-code.log

# Search for errors
grep -i error ~/.claude/logs/claude-code.log
```

---

## Resource Links

### Official Documentation
- 📚 [Claude Code Documentation](https://code.claude.com/docs)
- 📚 [Claude API Documentation](https://docs.anthropic.com)
- 💬 [Discord Community](https://discord.gg/claude-developers)
- 🐙 [GitHub Repository](https://github.com/anthropics/claude-code)

### Marketplace and Resources
- 🛍️ [Plugin Marketplace](https://claude-plugins.dev)
- 🎯 [Skills Library](https://mcpservers.org/claude-skills)
- 🔧 [MCP Server Directory](https://github.com/modelcontextprotocol/servers)
- ✨ [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)

### Learning Resources
- 📝 [Best Practices Guide](https://www.anthropic.com/engineering/claude-code-best-practices)
- 📖 [Complete Tutorial](https://www.siddharthbharath.com/claude-code-the-complete-guide/)
- 🎥 [Video Tutorial Collection](https://www.youtube.com/c/anthropic)

---

## Appendix

### A. Quick Reference Card

#### Basic Commands
```bash
claude                    # Start interactive session
claude -p "query"        # Non-interactive query
claude -c                # Continue most recent session
claude --help            # Help information
```

#### Interactive Commands
```bash
/help         # Help
/agents       # Subagent management
/mcp          # MCP management
/permissions  # Permission management
/config       # Settings
/plugin       # Plugin management
```

#### File Operations
```bash
@file.txt           # Reference file
@./dir/             # Reference directory
!`command`          # Embed command output
$ARGUMENTS          # Command arguments
```

### B. Configuration Templates

#### settings.json Template
```json
{
  "model": "sonnet",
  "maxTokens": 8000,
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix $FILE"
          }
        ]
      }
    ]
  },
  "defaultTools": [
    "Read",
    "Write",
    "Bash",
    "Grep"
  ]
}
```

#### .mcp.json Template
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  },
  "database": {
    "command": "python",
    "args": ["-m", "mcp_server_postgres"],
    "env": {
      "DATABASE_URL": "${DATABASE_URL}"
    }
  }
}
```

### C. Glossary

- **Skill**: Auto-loaded domain knowledge or workflow guide
- **Command**: Manually triggered workflow template
- **Subagent**: Specialized Claude instance with independent context
- **Hook**: Automatically triggered action after tool use
- **Plugin**: Packaged extension collection
- **MCP**: Model Context Protocol, external tool integration protocol
- **Headless Mode**: Non-interactive mode, for scripts and automation
- **Session**: Conversation instance with 5-hour validity

---

## Conclusion

Claude Code is not just an AI programming assistant, it represents a new paradigm for software development. By mastering the features and best practices in this document, you can:

✅ **10x Productivity Improvement** - Automate repetitive tasks, focus on creative work
✅ **Improve Code Quality** - Consistent standards, comprehensive testing, deep reviews
✅ **Accelerate Learning** - Quickly understand new codebases, effective team onboarding
✅ **Reduce Cognitive Load** - Let AI handle tedious details, you focus on core logic

Remember: Claude Code's power comes from **human-AI collaboration**. It's not meant to replace developers, but to enhance your capabilities and make you a better engineer.

Happy coding! 🚀

---

*Document Version: 1.0*
*Last Updated: 2025-01-01*
*Author: Compiled based on Anthropic official documentation and community best practices*
