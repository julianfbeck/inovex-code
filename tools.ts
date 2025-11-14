import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type {
  ToolDefinition,
  ToolResult,
  ListFilesInput,
  BashInput,
  EditFileInput,
  CodeSearchInput,
  WebSearchInput
} from "./types";

export class AgentTools {
  // List Files Tool
  static listFilesDefinition: ToolDefinition = {
    name: "list_files",
    description: "List files and directories at a given path. If no path is provided, lists files in the current directory.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The directory path to list files from"
        }
      }
    }
  };

  static async listFiles(input: ListFilesInput): Promise<ToolResult> {
    try {
      console.log(`  \x1b[90mpath: ${input.path || "."}\x1b[0m`);
      const targetPath = resolve(input.path || ".");
      const items = await readdir(targetPath);

      const results = await Promise.all(
        items.map(async (item) => {
          const fullPath = join(targetPath, item);
          try {
            const stats = await stat(fullPath);
            return {
              name: item,
              type: stats.isDirectory() ? "directory" : "file",
              size: stats.isFile() ? stats.size : undefined
            };
          } catch {
            return { name: item, type: "unknown" };
          }
        })
      );

      const output = results
        .map(item => {
          if (item.type === "directory") {
            return `${item.name}/`;
          } else if (item.type === "file" && item.size !== undefined) {
            return `${item.name} (${item.size} bytes)`;
          } else {
            return item.name;
          }
        })
        .join("\n");

      return {
        success: true,
        result: `Files in ${targetPath}:\n${output}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list files: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Shell Tool (using Bun's shell API)
  static bashDefinition: ToolDefinition = {
    name: "bash",
    description: "Execute a shell command using Bun's cross-platform shell API. Use this to run shell commands safely.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to execute"
        }
      },
      required: ["command"]
    }
  };

  static async bash(input: BashInput): Promise<ToolResult> {
    try {
      console.log(`  \x1b[90m$ ${input.command}\x1b[0m`);
      
      // Use Bun.spawn to capture output without displaying it
      const proc = Bun.spawn(["sh", "-c", input.command], {
        stdout: "pipe",
        stderr: "pipe"
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (exitCode === 0) {
        return {
          success: true,
          result: stdout || "(no output)"
        };
      } else {
        return {
          success: false,
          error: `Command failed with exit code ${exitCode}: ${stderr || stdout}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Edit File Tool
  static editFileDefinition: ToolDefinition = {
    name: "edit_file",
    description: "Edit a file by replacing old_str with new_str. If old_str is empty, creates a new file with new_str content.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path to edit"
        },
        old_str: {
          type: "string",
          description: "The string to replace (empty for new file)"
        },
        new_str: {
          type: "string",
          description: "The string to replace with"
        }
      },
      required: ["path", "old_str", "new_str"]
    }
  };

  static async editFile(input: EditFileInput): Promise<ToolResult> {
    try {
      const oldStrPreview = input.old_str === "" ? "[new file]" : input.old_str.slice(0, 50) + (input.old_str.length > 50 ? "..." : "");
      const newStrPreview = input.new_str.slice(0, 50) + (input.new_str.length > 50 ? "..." : "");
      console.log(`  \x1b[90mpath: ${input.path}, old: ${oldStrPreview}, new: ${newStrPreview}\x1b[0m`);
      const filePath = resolve(input.path);

      if (input.old_str === "") {
        // Create new file
        await Bun.write(filePath, input.new_str);
        return {
          success: true,
          result: `Created new file: ${filePath} (${input.new_str.length} bytes)`
        };
      } else {
        // Edit existing file
        const file = Bun.file(filePath);

        if (!(await file.exists())) {
          return {
            success: false,
            error: `File does not exist: ${filePath}`
          };
        }

        const content = await file.text();

        if (!content.includes(input.old_str)) {
          return {
            success: false,
            error: `String not found in file: "${input.old_str}"`
          };
        }

        const newContent = content.replace(input.old_str, input.new_str);
        await Bun.write(filePath, newContent);

        return {
          success: true,
          result: `Successfully edited file: ${filePath}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to edit file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Code Search Tool
  static codeSearchDefinition: ToolDefinition = {
    name: "code_search",
    description: "Search for code patterns using ripgrep. Use this to find code patterns, function definitions, variable usage, or any text in the codebase.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "The search pattern (regex supported)"
        },
        path: {
          type: "string",
          description: "The directory to search in (default: current directory)"
        },
        file_type: {
          type: "string",
          description: "File type to filter by (e.g., 'js', 'ts', 'py')"
        }
      },
      required: ["pattern"]
    }
  };

  static async codeSearch(input: CodeSearchInput): Promise<ToolResult> {
    try {
      console.log(`  \x1b[90mpattern: "${input.pattern}", path: ${input.path || "."}, type: ${input.file_type || "all"}\x1b[0m`);
      const args = ["rg"];

      // Add pattern
      args.push(input.pattern);

      // Add file type filter if specified
      if (input.file_type) {
        args.push("--type", input.file_type);
      }

      // Add path
      args.push(input.path || ".");

      // Add additional flags for better output
      args.push("--line-number", "--column", "--color=never");

      const proc = Bun.spawn(args, {
        stdout: "pipe",
        stderr: "pipe"
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();

      const exitCode = await proc.exited;

      if (exitCode === 0) {
        const lines = stdout.trim().split("\n");
        return {
          success: true,
          result: `Found ${lines.length} matches for pattern: ${input.pattern}\n\n${stdout}`
        };
      } else if (exitCode === 1) {
        // No matches found (this is normal for ripgrep)
        return {
          success: true,
          result: `No matches found for pattern: ${input.pattern}`
        };
      } else {
        return {
          success: false,
          error: `Search failed: ${stderr || "Unknown error"}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to search code: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Web Search Tool
  static webSearchDefinition: ToolDefinition = {
    name: "web_search",
    description: "Fetch the content of a website using curl. Returns the HTML content of the specified URL.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the website to fetch"
        }
      },
      required: ["url"]
    }
  };

  static async webSearch(input: WebSearchInput): Promise<ToolResult> {
    try {
      console.log(`  \x1b[90mfetching: ${input.url}\x1b[0m`);
      
      const proc = Bun.spawn([
        "curl",
        "-s",  // Silent mode
        "-L",  // Follow redirects
        "-A", "Mozilla/5.0 (compatible; WebSearchBot/1.0)",  // User agent
        input.url
      ], {
        stdout: "pipe",
        stderr: "pipe"
      });

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      if (exitCode === 0) {
        const contentLength = stdout.length;
        const preview = stdout.slice(0, 500);
        return {
          success: true,
          result: `Successfully fetched ${input.url} (${contentLength} bytes)\n\nContent:\n${stdout}`
        };
      } else {
        return {
          success: false,
          error: `Failed to fetch URL: ${stderr || "Unknown error"}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch website: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  // Get all tool definitions
  static getAllTools(): ToolDefinition[] {
    return [
      this.listFilesDefinition,
      this.bashDefinition,
      this.editFileDefinition,
      this.codeSearchDefinition,
      this.webSearchDefinition
    ];
  }

  // Execute tool by name
  static async executeTool(toolName: string, input: any): Promise<ToolResult> {
    switch (toolName) {
      case "list_files":
        return this.listFiles(input);
      case "bash":
        return this.bash(input);
      case "edit_file":
        return this.editFile(input);
      case "code_search":
        return this.codeSearch(input);
      case "web_search":
        return this.webSearch(input);
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  }
}
