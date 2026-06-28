import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeCode, type ProviderId } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${base}/app/integrations?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${base}/app/integrations?error=missing_params`);
  }

  let provider: ProviderId;
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    provider = decoded.provider;
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${base}/app/integrations?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCode(provider, code);

    const serviceClient = createServiceClient();

    const { data: userData } = await serviceClient
      .from("users")
      .select("workspace_id")
      .eq("id", userId)
      .single();

    if (!userData?.workspace_id) {
      return NextResponse.redirect(`${base}/app/integrations?error=no_workspace`);
    }

    // Preserve existing metadata fields (e.g. docs_indexed) when reconnecting
    const { data: existing } = await serviceClient
      .from("sources")
      .select("metadata")
      .eq("workspace_id", userData.workspace_id)
      .eq("provider", provider)
      .single();

    await serviceClient.from("sources").upsert(
      {
        workspace_id: userData.workspace_id,
        user_id: userId,
        provider,
        status: "connected",
        metadata: {
          ...(existing?.metadata ?? {}),
          access_token: tokens.access_token,
          ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
        },
      },
      { onConflict: "workspace_id,provider" }
    );

    return NextResponse.redirect(`${base}/app/integrations?connected=${provider}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth failed";
    console.error("[oauth/callback]", msg);
    return NextResponse.redirect(`${base}/app/integrations?error=${encodeURIComponent(msg)}`);
  }
}
