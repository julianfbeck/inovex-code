# Coding Agent

A simple coding agent built with Bun and the Anthropic SDK, implementing the 5 core primitives of a coding agent:

1. **List Files Tool** - Browse directories and file structures
2. **Bash Tool** - Execute shell commands
3. **Edit File Tool** - Create and modify files
4. **Code Search Tool** - Search through codebases using ripgrep

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set up your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

Or set it directly:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

## Usage

Start an interactive chat session:
```bash
bun run dev
```

The agent will start in interactive mode where you can chat with it to:
- List files and explore directories
- Create and edit files
- Execute shell commands
- Search through code

## Features

- **File Operations**: Create, read, and edit files
- **Directory Browsing**: List contents of directories
- **Command Execution**: Run shell commands safely
- **Code Search**: Find patterns using ripgrep
- **Interactive Chat**: Conversational interface for complex tasks

## Architecture

The agent follows the simple loop pattern:
1. User provides input
2. Agent analyzes and calls appropriate tools
3. Tools execute and return results
4. Agent processes results and responds

Built with modern Bun APIs for optimal performance.
