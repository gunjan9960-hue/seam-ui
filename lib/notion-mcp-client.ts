import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { RetrievedChunk } from "./rag/retrieval";

const NOTION_MCP_URL = process.env.NOTION_MCP_SERVER_URL ?? "https://mcp.notion.com/mcp";
const MAX_RESULTS = 8;

class NotionTokenProvider implements OAuthClientProvider {
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
      client_id: process.env.NOTION_CLIENT_ID ?? "",
      client_secret: process.env.NOTION_CLIENT_SECRET,
      redirect_uris: [this._callbackUrl],
    };
  }

  tokens(): OAuthTokens {
    return { access_token: this._token, token_type: "Bearer" };
  }

  saveTokens(_tokens: OAuthTokens): void {}

  redirectToAuthorization(_url: URL): never {
    throw new Error(
      "Notion MCP session expired — reconnect Notion from the Integrations page",
    );
  }

  saveCodeVerifier(_verifier: string): void {}
  codeVerifier(): string { return ""; }
}

interface NotionPage {
  id?: string;
  title?: string;
  url?: string;
  last_edited_time?: string;
  object?: string;
  plain_text?: string;
  [key: string]: unknown;
}

function extractTitle(page: NotionPage): string {
  if (page.title) return page.title;
  const props = page.properties as Record<string, { title?: { plain_text: string }[] }> | undefined;
  if (props) {
    for (const val of Object.values(props)) {
      const t = val?.title?.[0]?.plain_text;
      if (t) return t;
    }
  }
  return "Untitled";
}

function toRetrievedChunks(pages: NotionPage[]): RetrievedChunk[] {
  return pages
    .filter((p) => p.id)
    .slice(0, MAX_RESULTS)
    .map((p, i) => {
      const title = extractTitle(p);
      const text = p.plain_text ?? title;
      const id = `notion-mcp-${p.id ?? i}`;
      return {
        chunk: {
          docId: id,
          chunkIndex: 0,
          text,
          doc: {
            id,
            source: "notion",
            title,
            content: text,
            author: "",
            date: p.last_edited_time ?? new Date().toISOString(),
            url: p.url ?? `https://notion.so/${(p.id ?? "").replace(/-/g, "")}`,
            type: p.object === "database" ? "doc" : "doc",
          },
        },
        score: 0.75 - i * 0.02,
      };
    });
}

export async function searchNotionViaMCP(
  query: string,
  accessToken: string,
): Promise<RetrievedChunk[]> {
  const authProvider = new NotionTokenProvider(accessToken);

  const transport = new StreamableHTTPClientTransport(new URL(NOTION_MCP_URL), {
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
      tools.find((t) => t.name === "notion_search") ??
      tools.find((t) => t.name.includes("search")) ??
      tools[0];

    if (!searchTool) {
      console.warn("[notion-mcp] no search tool found. Available:", tools.map((t) => t.name));
      return [];
    }

    const result = await client.callTool({
      name: searchTool.name,
      arguments: { query, page_size: MAX_RESULTS },
    });

    const content = result.content as Array<{ type: string; text?: string }>;
    const raw = content.find((c) => c.type === "text")?.text ?? "[]";

    let pages: NotionPage[] = [];
    try {
      const parsed = JSON.parse(raw);
      pages = Array.isArray(parsed)
        ? parsed
        : (parsed.results ?? parsed.pages ?? []);
    } catch {
      return [];
    }

    return toRetrievedChunks(pages);
  } catch (err) {
    console.error("[notion-mcp] search failed:", err instanceof Error ? err.message : err);
    return [];
  } finally {
    await client.close().catch(() => {});
  }
}
