# Feedback Tool Instructions — Why They Matter and How to Write Them

## The Problem

You've added the PatchworkMCP feedback tool to your MCP server. But agents aren't calling it. You're getting zero feedback and have no idea what your server is missing.

**The reason: you didn't tell the agent to use it.**

Registering the tool makes it _available_. But MCP servers can expose dozens of tools, and agents don't proactively explore tools they haven't been told about. The tool description helps if the agent happens to read it, but most agents only consult tool descriptions when they're already looking for something specific. Without a direct instruction, the feedback tool is invisible in practice.

## The Fix

Set the `instructions` field on your MCP server. This is the text that agents read when they connect to your server. It's your one chance to tell the agent: _"When you hit a wall, call the feedback tool."_

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFeedbackTool } from "./feedback-tool.js";

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

That's it. Without the `instructions` field, the feedback tool is dead weight. With it, agents will reliably report gaps and you get actionable signal about what to build next.

## Writing Effective Instructions

### What to include

1. **An explicit directive to use the feedback tool.** Don't hint. Tell the agent directly: _"You MUST call the feedback tool when..."_
2. **Specific trigger scenarios.** List the situations where feedback is expected:
   - A tool the agent expected doesn't exist
   - A tool returned incomplete or unhelpful results
   - The agent had to work around a limitation
   - A new tool or parameter would have made the task easier
   - The agent could only partially satisfy the user's request
3. **Timing: before the final response.** Tell the agent to call feedback _before_ responding to the user. If it responds first, it typically won't circle back.
4. **Domain-specific context.** Adapt the scenarios to your server. If your server handles database queries, mention things like "if a query type isn't supported" or "if the schema information is insufficient." If it handles file operations, mention "if a file format isn't handled" or "if permissions prevent the operation."

### Example: Generic server

```
IMPORTANT: If you encounter ANY limitation — a missing tool, incomplete data,
wrong format, or any gap that prevents you from fully completing the user's
request — you MUST call the "feedback" tool BEFORE responding to the user.
Be specific about what you needed and what would have helped.
```

### Example: Database server

```
You have access to tools for querying and managing databases. If you encounter
any of the following, call the "feedback" tool BEFORE responding to the user:

- A query type or operation that isn't supported by the available tools
- Schema or metadata that is missing or incomplete
- A result format that doesn't match what the user needs
- A performance limitation (e.g., query too slow, result set too large)
- Any situation where you had to approximate or work around a limitation

Your feedback directly drives what we build next. Be specific about what you
needed, what you tried, and what would have helped.
```

### Example: Code analysis server

```
You have access to tools for analyzing and navigating codebases. If you hit
a limitation while helping the user, call the "feedback" tool BEFORE giving
your final response. Examples of limitations:

- A language or framework that isn't supported
- Missing cross-reference or dependency information
- Inability to search by a specific pattern or scope
- Results that are incomplete or missing important context

Be specific. Describe what you were trying to do, what tool you expected to
find, and what would have made the task easier.
```

## Common Mistakes

### 1. Not setting instructions at all

```typescript
// BAD — no instructions, agent will never call feedback
const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});
registerFeedbackTool(server);
```

This is the most common mistake. The tool is registered but the agent is never told to use it. You will get zero feedback.

### 2. Vague instructions

```typescript
// BAD — too vague, agent won't know when to act
const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
  instructions: "Feel free to provide feedback if something doesn't work.",
});
```

"Feel free to" is weak. Agents treat optional suggestions as low priority. Use "you MUST" or "always call" to make it clear this is expected behavior.

### 3. Instructions that don't mention the feedback tool by name

```typescript
// BAD — doesn't name the tool
const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
  instructions: "Report any issues you encounter.",
});
```

The agent doesn't know _how_ to report issues unless you name the tool. Always reference `the "feedback" tool` explicitly.

### 4. Instructions that say "after responding"

```typescript
// BAD — agent will respond and forget
const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
  instructions: `
    After responding to the user, if you encountered any limitations,
    call the feedback tool.
  `,
});
```

Agents rarely go back after they've already responded. Always say "BEFORE responding to the user."

## How to Verify It's Working

1. **Connect with an MCP client** (Claude Desktop, Cursor, Claude Code, etc.)
2. **Ask the agent to do something your server can't fully handle.** For example, if your server has a search tool, ask for a search feature it doesn't support yet.
3. **Check the PatchworkMCP dashboard** at [patchworkmcp.com](https://patchworkmcp.com) to see if the feedback was recorded.
4. **If no feedback appears**, check that:
   - The `instructions` field is set on your server
   - The instructions explicitly mention the `"feedback"` tool
   - The instructions tell the agent to call it BEFORE responding
   - Your `PATCHWORKMCP_API_KEY` and `PATCHWORKMCP_SERVER_SLUG` are set correctly

## Summary

| Step | What to do |
|---|---|
| 1. Register the tool | `registerFeedbackTool(server)` |
| 2. Set instructions | Add the `instructions` field to your `McpServer` config |
| 3. Be explicit | Say "you MUST call the feedback tool" — don't hint |
| 4. List trigger scenarios | Missing tools, incomplete results, workarounds, format issues |
| 5. Say "BEFORE responding" | Agents won't circle back after they've already answered |
| 6. Adapt to your domain | Mention your server's specific tools and common gaps |
| 7. Verify | Test with a real MCP client and check the dashboard |

Without step 2, none of the rest matters. **The instructions field is the single most important thing you configure.**
