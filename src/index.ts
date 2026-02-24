/** PatchworkMCP — Drop-in feedback tool for TypeScript MCP servers. */

export {
  TOOL_NAME,
  TOOL_DESCRIPTION,
  TOOL_INPUT_SCHEMA,
  registerFeedbackTool,
  sendFeedback,
} from "./feedback-tool.js";

export type { FeedbackToolOptions } from "./feedback-tool.js";
