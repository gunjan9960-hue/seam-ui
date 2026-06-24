import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { RetrievedChunk } from "./rag/retrieval";

const SLACK_MCP_URL = process.env.SLACK_MCP_SERVER_URL ?? "https://mcp.slack.com/mcp";
const MAX_RESULTS = 8;

// Provides our existing Slack user token to the MCP SDK's OAuth layer.
// The SDK checks tokens() first — if a token exists it skips the interactive OAuth flow.
class SlackTokenProvider implements OAuthClientProvider {
  private _token: string;

  constructor(accessToken: string) {
    this._token = accessToken;
  }

  get redirectUrl(): string {
    return `${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/api/oauth/callback`;
  }

  private get _callbackUrl(): string {
    return `${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/api/oauth/callback`;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Seam",
      redirect_uris: [this._callbackUrl],
    };
  }

  clientInformation(): OAuthClientInformationFull {
    return {
      client_id: process.env.SLACK_CLIENT_ID ?? "",
      client_secret: process.env.SLACK_CLIENT_SECRET,
      redirect_uris: [this._callbackUrl],
    };
  }

  tokens(): OAuthTokens {
    return { access_token: this._token, token_type: "Bearer" };
  }

  saveTokens(_tokens: OAuthTokens): void {
    // Token lifecycle managed in Supabase — no-op here
  }

  redirectToAuthorization(_url: URL): never {
    throw new Error(
      "Slack MCP session expired — reconnect Slack from the Integrations page",
    );
  }

  saveCodeVerifier(_verifier: string): void {}
  codeVerifier(): string { return ""; }
}

interface SlackMCPMessage {
  ts?: string;
  text?: string;
  channel?: string;
  channel_name?: string;
  permalink?: string;
  username?: string;
}

function toRetrievedChunks(messages: SlackMCPMessage[]): RetrievedChunk[] {
  return messages
    .filter((m) => m.text && m.text.length > 30)
    .map((m, i) => ({
      chunk: {
        docId: `slack-mcp-${m.ts ?? i}`,
        chunkIndex: 0,
        text: m.text!,
        doc: {
          id: `slack-mcp-${m.ts ?? i}`,
          source: "slack",
          title: `#${m.channel_name ?? m.channel ?? "slack"} thread`,
          content: m.text!,
          author: m.username ?? "",
          date: m.ts
            ? new Date(parseFloat(m.ts) * 1000).toISOString()
            : new Date().toISOString(),
          url: m.permalink ?? "https://slack.com",
          type: "message",
        },
      },
      score: 0.75 - i * 0.02,
    }));
}

export async function searchSlackViaMCP(
  query: string,
  accessToken: string,
): Promise<RetrievedChunk[]> {
  const authProvider = new SlackTokenProvider(accessToken);

  const transport = new StreamableHTTPClientTransport(new URL(SLACK_MCP_URL), {
    authProvider,
  });

  const client = new Client(
    { name: "seam", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    const searchTool =
      tools.find((t) => t.name.includes("search") && t.name.includes("message")) ??
      tools.find((t) => t.name.includes("search")) ??
      tools[0];

    if (!searchTool) {
      console.warn("[slack-mcp] no search tool found. Available:", tools.map((t) => t.name));
      return [];
    }

    const result = await client.callTool({
      name: searchTool.name,
      arguments: { query, count: MAX_RESULTS },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const raw = content.find((c) => c.type === "text")?.text ?? "[]";

    let messages: SlackMCPMessage[] = [];
    try {
      const parsed = JSON.parse(raw);
      messages = Array.isArray(parsed)
        ? parsed
        : (parsed.messages ?? parsed.matches ?? []);
    } catch {
      return [];
    }

    return toRetrievedChunks(messages);
  } catch (err) {
    console.error("[slack-mcp] search failed:", err instanceof Error ? err.message : err);
    return [];
  } finally {
    await client.close().catch(() => {});
  }
}
