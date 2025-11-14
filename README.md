# Coding Agent

A simple coding agent built with Bun and the Anthropic SDK, implementing the core primitives of a coding agent. This project was created during the inovex meetup "Talk 1: Inside Coding Agents: Architektur, Tooling und Umsetzung" by Julian on November 13, 2024 in Karlsruhe.

## Core Tools

This agent implements the essential tools for autonomous coding:

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

## About the Meetup

This coding agent was developed during a live demo at the inovex meetup in Karlsruhe. The talk focused on:

- **AI Agent Architecture**: How AI agents internally function and interact with their environment
- **Tool Integration**: Structured tool calls and protocols like MCP (Model Context Protocol)
- **Coding Agents**: Agents capable of writing, executing, and systematically accessing external resources
- **Technical Implementation**: Building and deploying a functional coding agent from scratch

The session demonstrated the core concepts through hands-on implementation, showing how modern coding agents leverage structured interfaces to perform complex software engineering tasks autonomously.
