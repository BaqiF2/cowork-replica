# Cowork - AI-Powered Work Assistant

<p align="center">
  <img src="image.jpg" alt="Cowork Logo" width="200"/>
</p>

<p align="center">
  <strong>An intelligent desktop assistant that works like a human colleague</strong>
</p>

<p align="center">
  <a href="./README_ZH.md">中文文档</a> |
  <a href="#features">Features</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="#architecture">Architecture</a>
</p>

---

## Overview

**Cowork** is an AI-powered desktop application built with Tauri + Node.js + SolidJS that acts as your intelligent work assistant. Unlike traditional AI chatbots, Cowork can autonomously manage tasks, process local files, and interact with your computer environment - just like a capable human colleague.

## Features

### 1. Autonomous Task Management
- **Goal Decomposition**: Breaks down vague objectives (e.g., "prepare for next week's meeting") into actionable steps
- **Background Execution**: Works asynchronously while you focus on other things
- **Real-time Progress Dashboard**: Track what's being done, completed, and planned
- **Task Queue**: Handles multiple tasks with priority-based scheduling

### 2. Deep File Processing
- **Cross-format Understanding**: Reads PDFs, Excel, Word, and even screenshots
- **Smart Organization**: Categorizes files by content, not just filenames
- **Multi-document Analysis**: Analyzes multiple files simultaneously (e.g., 10 resumes)
- **Content Creation**: Generates `.xlsx`, `.docx` files directly to your local directory

### 3. Environment & Application Control
- **Web Automation**: Searches, fills forms, and scrapes data from websites
- **Cross-application Data Transfer**: Moves data between emails, spreadsheets, and more
- **System-level Search**: Finds files and emails you know exist but can't locate

### 4. Collaboration & Trust
- **Checkpoint Confirmations**: Asks before irreversible actions (delete, send, pay)
- **Intent Clarification**: Asks follow-up questions when instructions are ambiguous
- **Work Summary Reports**: Provides clear summaries of all actions taken

### 5. Learning & Customization
- **SOP Memory**: Learns and remembers your standard operating procedures
- **Preference Settings**: Remembers naming formats, email tones, and file organization habits

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SolidJS + TypeScript |
| Desktop Runtime | Tauri 2.x (Rust) |
| Backend | Node.js + Claude Agent SDK |
| IPC | Tauri Commands + Event System |
| Styling | CSS Custom Properties (Obsidian Black Theme) |

## Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **Rust** >= 1.77.2
- **pnpm** or **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cowork-replica.git
cd cowork-replica

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Development

```bash
# Start TypeScript compilation in watch mode
npm run dev

# In another terminal, start Tauri development server
npm run tauri:dev
```

### Production Build

```bash
# Build for production
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Project Structure

```
cowork-replica/
├── src/                    # Node.js backend source
│   ├── core/              # Core business logic
│   ├── sdk/               # Claude Agent SDK integration
│   ├── tools/             # Tool implementations
│   ├── permissions/       # Permission management
│   └── ui/                # UI abstraction layer
├── src-ui/                # SolidJS frontend source
│   ├── components/        # UI components
│   │   ├── common/       # Button, Input, Modal
│   │   └── Layout.ts     # Layout framework
│   ├── services/          # IPC service
│   ├── styles/            # Theme system
│   └── infrastructure/    # Integration module
├── src-tauri/             # Rust/Tauri source
│   ├── src/
│   │   ├── main.rs       # Entry point
│   │   ├── ipc.rs        # IPC bridge
│   │   └── process.rs    # Process management
│   └── tauri.conf.json   # Tauri configuration
└── tests/                 # Test files
    ├── e2e/              # End-to-end tests
    └── integration/      # Integration tests
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SolidJS Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Components │  │   Theme     │  │    IPC Service      │ │
│  │  (UI Kit)   │  │   System    │  │    (Tauri API)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ Tauri Events / Commands
┌──────────────────────────┴──────────────────────────────────┐
│                      Rust IPC Bridge                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Message   │  │   Process   │  │     Event           │ │
│  │   Router    │  │   Manager   │  │     Emitter         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ stdin/stdout JSON
┌──────────────────────────┴──────────────────────────────────┐
│                    Node.js Backend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Claude    │  │    Tool     │  │    Permission       │ │
│  │   Agent SDK │  │   Registry  │  │    Manager          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional
NODE_ENV=development
LOG_LEVEL=debug
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start TypeScript compilation in watch mode |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run tauri:dev` | Start Tauri development server |
| `npm run tauri:build` | Build production Tauri application |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude Agent SDK
- [Tauri](https://tauri.app/) for the desktop runtime framework
- [SolidJS](https://www.solidjs.com/) for the reactive UI framework
