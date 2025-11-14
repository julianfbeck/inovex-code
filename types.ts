export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

export interface ListFilesInput {
  path?: string;
}

export interface BashInput {
  command: string;
}

export interface EditFileInput {
  path: string;
  old_str: string;
  new_str: string;
}

export interface CodeSearchInput {
  pattern: string;
  path?: string;
  file_type?: string;
}

export interface WebSearchInput {
  url: string;
}