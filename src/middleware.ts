/**
 * PatchworkMCP middleware for TypeScript/JavaScript MCP servers.
 *
 * Provides heartbeat monitoring and feedback collection. Call `startMiddleware()`
 * after your server starts. It handles:
 *   - Periodic heartbeat pings to PatchworkMCP
 *   - Automatic feedback collection from agents
 *
 * Environment variables:
 *   PATCHWORKMCP_API_URL     - Base URL (default: https://app.patchworkmcp.com)
 *   PATCHWORKMCP_API_KEY     - Your team API key (required)
 *   PATCHWORKMCP_SERVER_SLUG - Your server slug (required)
 */

const API_URL = (
  process.env.PATCHWORKMCP_API_URL || "https://app.patchworkmcp.com"
).replace(/\/$/, "");
const API_KEY = process.env.PATCHWORKMCP_API_KEY || "";
const SERVER_SLUG = process.env.PATCHWORKMCP_SERVER_SLUG || "";
const HEARTBEAT_INTERVAL = 60_000; // ms
const MAX_RETRIES = 3;

interface FeedbackPayload {
  server_slug: string;
  what_i_needed: string;
  what_i_tried: string;
  gap_type?: string;
  suggestion?: string;
  user_goal?: string;
  resolution?: string;
  tools_available?: string[];
  agent_model?: string;
  session_id?: string;
  client_type?: string;
}

interface HeartbeatPayload {
  server_slug: string;
  tool_count: number;
  tool_names: string[];
}

export interface MiddlewareOptions {
  apiUrl?: string;
  apiKey?: string;
  serverSlug?: string;
  toolNames?: string[];
}

export class PatchworkMiddleware {
  private apiUrl: string;
  private apiKey: string;
  private serverSlug: string;
  private toolNames: string[];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: MiddlewareOptions = {}) {
    this.apiUrl = options.apiUrl || API_URL;
    this.apiKey = options.apiKey || API_KEY;
    this.serverSlug = options.serverSlug || SERVER_SLUG;
    this.toolNames = options.toolNames || [];
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  start(): void {
    if (!this.apiKey || !this.serverSlug) {
      console.warn(
        "PatchworkMCP middleware not started: missing API_KEY or SERVER_SLUG"
      );
      return;
    }
    this.sendHeartbeat().catch(() => {});
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL);
    console.log(`PatchworkMCP middleware started for ${this.serverSlug}`);
  }

  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async sendHeartbeat(): Promise<void> {
    const payload: HeartbeatPayload = {
      server_slug: this.serverSlug,
      tool_count: this.toolNames.length,
      tool_names: this.toolNames,
    };
    const resp = await fetch(`${this.apiUrl}/api/v1/heartbeat/`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      throw new Error(`Heartbeat failed: ${resp.status}`);
    }
  }

  async sendFeedback(
    feedback: Omit<FeedbackPayload, "server_slug">
  ): Promise<Record<string, unknown> | null> {
    const payload: FeedbackPayload = {
      ...feedback,
      server_slug: this.serverSlug,
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const resp = await fetch(`${this.apiUrl}/api/v1/feedback/`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(payload),
        });
        if (resp.ok) {
          return (await resp.json()) as Record<string, unknown>;
        }
      } catch (error) {
        if (attempt === MAX_RETRIES - 1) {
          console.error(
            `UNSENT_FEEDBACK: ${JSON.stringify(payload)} — ${error}`
          );
          return null;
        }
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      }
    }
    return null;
  }
}

export function startMiddleware(
  options: MiddlewareOptions = {}
): PatchworkMiddleware {
  const mw = new PatchworkMiddleware(options);
  mw.start();
  return mw;
}
