import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { OAUTH_CONFIGS, refreshAccessToken, type ProviderId } from "@/lib/oauth";
import { ingestDocuments } from "@/lib/sync/ingest";
import { fetchNotionDocs } from "@/lib/sync/fetchers/notion";
import { fetchJiraDocs, getJiraSite } from "@/lib/sync/fetchers/jira";
import { fetchSlackDocs } from "@/lib/sync/fetchers/slack";
import { fetchGoogleDocs } from "@/lib/sync/fetchers/google";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await req.json();
  if (!OAUTH_CONFIGS[provider as ProviderId]) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  const serviceClient = createServiceClient();

  // Get workspace + source
  const { data: userData } = await serviceClient.from("users").select("workspace_id").eq("id", user.id).single();
  if (!userData?.workspace_id) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const { data: source } = await serviceClient
    .from("sources")
    .select("id,metadata,last_synced_at")
    .eq("workspace_id", userData.workspace_id)
    .eq("provider", provider)
    .single();

  if (!source) return NextResponse.json({ error: "Source not connected" }, { status: 400 });

  // Mark as syncing
  await serviceClient.from("sources").update({ status: "syncing" }).eq("id", source.id);

  try {
    let accessToken: string = source.metadata?.access_token ?? "";
    const storedRefreshToken: string | undefined = source.metadata?.refresh_token;

    if (!accessToken) throw new Error("Source not authorized — reconnect in Integrations");

    // Proactively refresh if we have a refresh token (Google, Jira)
    if (storedRefreshToken) {
      try {
        const refreshed = await refreshAccessToken(provider as ProviderId, storedRefreshToken);
        accessToken = refreshed.access_token;
        await serviceClient.from("sources").update({
          metadata: {
            ...source.metadata,
            access_token: refreshed.access_token,
            ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
          },
        }).eq("id", source.id);
      } catch {
        // Continue with existing token — will fail at fetch if truly expired
      }
    }

    // Fetch docs from provider
    let docs: import("@/lib/sync/ingest").IngestDoc[];
    if (provider === "notion") {
      docs = await fetchNotionDocs(accessToken);
    } else if (provider === "jira") {
      let cloudId: string = source.metadata?.cloud_id ?? "";
      let siteUrl: string = source.metadata?.jira_site_url ?? "";
      if (!cloudId) {
        const site = await getJiraSite(accessToken);
        if (site) {
          cloudId = site.id;
          siteUrl = site.url;
          await serviceClient.from("sources").update({ metadata: { ...source.metadata, cloud_id: cloudId, jira_site_url: siteUrl } }).eq("id", source.id);
        }
      }
      docs = await fetchJiraDocs(accessToken, cloudId, siteUrl, source.last_synced_at ?? undefined);
    } else if (provider === "slack") {
      docs = await fetchSlackDocs(accessToken);
    } else if (provider === "google-docs") {
      docs = await fetchGoogleDocs(accessToken);
    } else {
      docs = [];
    }

    // Ingest: chunk → embed → pgvector
    await ingestDocuments(userData.workspace_id, source.id, provider, docs);

    // Mark connected + update sync time + store doc count
    await serviceClient.from("sources").update({
      status: "connected",
      last_synced_at: new Date().toISOString(),
      error_message: null,
      metadata: { ...source.metadata, docs_indexed: docs.length },
    }).eq("id", source.id);

    return NextResponse.json({ ok: true, docsIndexed: docs.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error(`[sync] ${provider} failed:`, msg);
    await serviceClient.from("sources").update({ status: "error", error_message: msg }).eq("id", source.id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
