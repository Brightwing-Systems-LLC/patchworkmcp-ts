/** PatchworkMCP — Drop-in feedback tool and middleware for TypeScript MCP servers. */

export {
  TOOL_NAME,
  TOOL_DESCRIPTION,
  TOOL_INPUT_SCHEMA,
  registerFeedbackTool,
  sendFeedback,
} from "./feedback-tool.js";

export type { FeedbackToolOptions } from "./feedback-tool.js";

export {
  PatchworkMiddleware,
  startMiddleware,
} from "./middleware.js";

export type { MiddlewareOptions } from "./middleware.js";
