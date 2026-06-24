import { NextRequest } from "next/server";
import { detectIntent, buildCitations, allResultsStale, type SearchFilters } from "@/lib/rag/retrieval";
import { retrieveFromPgvector } from "@/lib/rag/retrievePgvector";
import { generateAnswer } from "@/lib/rag/generate";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { searchSlackViaMCP } from "@/lib/slack-mcp-client";
import { searchNotionViaMCP } from "@/lib/notion-mcp-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getProviderToken(userId: string, provider: string): Promise<string | null> {
  try {
    const service = createServiceClient();
    const { data: userData } = await service.from("users").select("workspace_id").eq("id", userId).single();
    if (!userData?.workspace_id) return null;
    const { data: source } = await service
      .from("sources")
      .select("metadata")
      .eq("workspace_id", userData.workspace_id)
      .eq("provider", provider)
      .eq("status", "connected")
      .single();
    return (source?.metadata?.access_token as string) ?? null;
  } catch {
    return null;
  }
}

function isSlackHeavy(retrieved: { chunk: { doc: { source: string } } }[]): boolean {
  if (retrieved.length === 0) return false;
  const slackCount = retrieved.filter((r) => r.chunk.doc.source === "slack").length;
  return slackCount / retrieved.length > 0.5;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const body = await req.json() as {
      query: string;
      history?: { question: string; answer: string }[];
      filters?: SearchFilters;
    };

    const { query, history = [], filters } = body;

    if (!query?.trim()) {
      return new Response("Missing query", { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured on this deployment." }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const intent = detectIntent(query);

    // Fetch MCP tokens in parallel, then run all retrievals in parallel
    const [slackToken, notionToken] = await Promise.all([
      process.env.SLACK_MCP_SERVER_URL ? getProviderToken(user.id, "slack") : Promise.resolve(null),
      process.env.NOTION_MCP_SERVER_URL ? getProviderToken(user.id, "notion") : Promise.resolve(null),
    ]);

    const [realRetrieved, slackMcpResults, notionMcpResults] = await Promise.all([
      retrieveFromPgvector(query, 5),
      slackToken ? searchSlackViaMCP(query, slackToken) : Promise.resolve([]),
      notionToken ? searchNotionViaMCP(query, notionToken) : Promise.resolve([]),
    ]);

    // Merge: pgvector first (scored by embedding similarity), then MCP results
    const retrieved = [...(realRetrieved ?? []), ...slackMcpResults, ...notionMcpResults];

    const citations = buildCitations(retrieved);
    const isStale   = retrieved.length > 0 && allResultsStale(retrieved);
    const slackHeavyFlag = isSlackHeavy(retrieved);

    if (retrieved.length === 0) {
      const encoder = new TextEncoder();
      const sourceNames = filters?.sources?.join(", ") ?? "Notion, Jira, Slack";
      const noResults = `I searched ${sourceNames} and could not find this in your connected sources. Try rephrasing or check that your sources are synced.\n\n__SOURCES__${JSON.stringify({ intent, sources: [], suggestions: [], isDemo: false })}`;
      return new Response(encoder.encode(noResults), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const stream  = await generateAnswer(query, history, retrieved, intent, isStale, slackHeavyFlag);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const meta = JSON.stringify({
            intent,
            sources: citations,
            isStale,
            suggestions: [],
            isDemo: false,
          });
          controller.enqueue(encoder.encode(`\n\n__SOURCES__${meta}`));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Generation error";
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Seam-Intent": intent,
        "X-Seam-Sources": String(citations.length),
        "X-Seam-Stale": String(isStale),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
