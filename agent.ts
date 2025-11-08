import Anthropic from "@anthropic-ai/sdk";
import { AgentTools } from "./tools";
import type { ToolDefinition } from "./types";

export class CodingAgent {
  private anthropic: Anthropic;
  private tools: ToolDefinition[];

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.tools = AgentTools.getAllTools();
  }

  private buildSystemPrompt(): string {
    const toolDescriptions = this.tools
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    return `You are a helpful coding assistant with access to the following tools:

${toolDescriptions}

You can use these tools to help users with coding tasks like:
- Reading and editing files
- Executing shell commands
- Searching through codebases
- Listing directory contents

When a user asks for help, think about which tools would be most helpful and use them to accomplish the task.

Important guidelines:
- Always use tools when they would be helpful
- Provide clear explanations of what you're doing
- Be careful with destructive operations
- Ask for confirmation before making significant changes

Current working directory: ${process.cwd()}
Operating system: ${process.platform}`;
  }

  async chat(userMessage: string): Promise<string> {
    try {
      const messages: Anthropic.Messages.MessageParam[] = [
        {
          role: "user",
          content: userMessage
        }
      ];

      let response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        system: this.buildSystemPrompt(),
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        })),
        messages
      });

      let fullResponse = "";

      // Handle the response and tool calls
      while (true) {
        for (const block of response.content) {
          if (block.type === "text") {
            fullResponse += block.text;
          } else if (block.type === "tool_use") {
            console.log(`\x1b[36m🔧 Tool:\x1b[0m \x1b[33m${block.name}\x1b[0m(\x1b[32m${JSON.stringify(block.input)}\x1b[0m)`);
            const toolResult = await AgentTools.executeTool(
              block.name,
              block.input
            );

            if (toolResult.success) {
              console.log(`\x1b[32m✅ Success:\x1b[0m ${toolResult.result?.slice(0, 100)}${toolResult.result && toolResult.result.length > 100 ? '...' : ''}`);
            } else {
              console.log(`\x1b[31m❌ Error:\x1b[0m ${toolResult.error}`);
            }

            // Add tool use to messages
            messages.push({
              role: "assistant",
              content: response.content
            });

            // Add tool result to messages
            messages.push({
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: toolResult.success
                    ? toolResult.result || "Tool executed successfully"
                    : `Error: ${toolResult.error}`
                }
              ]
            });

            // Get follow-up response from Claude
            response = await this.anthropic.messages.create({
              model: "claude-sonnet-4-5-20250929",
              max_tokens: 4000,
              system: this.buildSystemPrompt(),
              tools: this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.input_schema
              })),
              messages
            });

            break;
          }
        }

        // Check if there are more tool calls
        const hasToolCalls = response.content.some(block => block.type === "tool_use");
        if (!hasToolCalls) {
          // Add final response text
          for (const block of response.content) {
            if (block.type === "text") {
              fullResponse += block.text;
            }
          }
          break;
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Error in chat:", error);
      return `Sorry, I encountered an error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async runInteractive(): Promise<void> {
    console.log("🤖 Coding Agent started! Type 'exit' to quit.\n");

    while (true) {
      process.stdout.write("You: ");

      // Read user input
      const userInput = await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim());
        });
      });

      if (userInput.toLowerCase() === 'exit') {
        console.log("👋 Goodbye!");
        break;
      }

      if (!userInput) {
        continue;
      }

      console.log("\nAgent: 🤔 Let me help you with that...\n");

      try {
        const response = await this.chat(userInput);
        console.log(response);
      } catch (error) {
        console.error("Error:", error);
      }

      console.log("\n" + "-".repeat(50) + "\n");
    }
  }
}