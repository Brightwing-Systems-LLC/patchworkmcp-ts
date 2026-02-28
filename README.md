# PatchworkMCP - TypeScript

Drop-in feedback tool for TypeScript MCP servers. Agents call this tool when they hit a limitation, and the feedback is sent to PatchworkMCP for review and action.

## Setup

1. Go to [patchworkmcp.com](https://patchworkmcp.com) and create an account
2. Create a team and generate an API key
3. Configure your server (you'll need the server slug and API key)

## Install

No extra dependencies — uses the built-in `fetch` API (Node 18+).

Copy `feedback-tool.ts` into your project.

## Configure

Set these environment variables (or pass them via options):

| Variable | Description | Required |
|---|---|---|
| `PATCHWORKMCP_API_KEY` | Your API key from patchworkmcp.com | Yes |
| `PATCHWORKMCP_SERVER_SLUG` | Your server's slug from patchworkmcp.com | Yes |
| `PATCHWORKMCP_URL` | API endpoint (default: `https://patchworkmcp.com`) | No |

## Usage

### @modelcontextprotocol/sdk

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFeedbackTool } from "./feedback-tool.js";

const INSTRUCTIONS = `
If you encounter a limitation — a missing tool, incomplete data, wrong format,
or any gap that prevents you from fully completing the user's request — call
the feedback tool BEFORE responding to the user. Be specific about what you
needed and what would have helped.
`;

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
  instructions: INSTRUCTIONS,
});
registerFeedbackTool(server);
```

### Manual registration

```typescript
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_INPUT_SCHEMA, sendFeedback } from "./feedback-tool.js";

// Register the tool with your framework, then in the handler:
const message = await sendFeedback(args);
```

### Server Instructions (Critical)

**You must include instructions in your MCP server that tell agents to use the feedback tool.** Without explicit instructions, agents will see the tool but almost never call it. The tool description alone is not enough — agents need to be told directly, in the server's `instructions` field, when and why to use the feedback tool.

The `instructions` field on `McpServer` is the single most important configuration for getting useful feedback. If you skip this step, the feedback tool will sit unused and you will receive no signal about what your server is missing.

See [FEEDBACK-TOOL-INSTRUCTIONS.md](./FEEDBACK-TOOL-INSTRUCTIONS.md) for full guidance, example instruction text, and common mistakes.

#### Quick checklist

1. **Set the `instructions` field** on your `McpServer` (or equivalent) with text that explicitly tells the agent to call the feedback tool when it hits a limitation.
2. **Be specific** about the scenarios that should trigger feedback — missing tools, incomplete results, wrong formats, workarounds.
3. **Tell the agent to call feedback BEFORE responding** to the user, so the feedback isn't lost.
4. **Adapt the instructions** to your server's domain so the agent understands what counts as a gap in your context.

#### Minimal example

```typescript
const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
  instructions: `
    IMPORTANT: If you encounter ANY limitation — a missing tool, incomplete data,
    wrong format, or any gap that prevents you from fully completing the user's
    request — you MUST call the "feedback" tool BEFORE responding to the user.
    Be specific about what you needed and what would have helped.
  `,
});
registerFeedbackTool(server);
```

## How It Works

- Retries up to 2 times with exponential backoff (500ms, 1000ms)
- Retries on 429 (rate limit) and 5xx (server error) status codes
- On failure, logs the full payload with `PATCHWORKMCP_UNSENT_FEEDBACK` prefix for later replay
- Never throws — always returns a user-facing message

## License

MIT
