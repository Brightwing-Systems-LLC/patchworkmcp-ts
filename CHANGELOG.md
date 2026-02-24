# Changelog

## 0.1.0 (2026-02-24)

- Initial release
- MCP SDK integration via `registerFeedbackTool()`
- Manual registration via `TOOL_NAME`, `TOOL_INPUT_SCHEMA`, `sendFeedback()`
- Retry logic with exponential backoff
- Structured logging for failed submissions
- Zero runtime dependencies (uses native fetch)
