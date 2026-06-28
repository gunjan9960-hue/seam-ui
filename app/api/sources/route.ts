import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sources: [] }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!userData?.workspace_id) return NextResponse.json({ sources: [] });

  const serviceClient = createServiceClient();
  const { data: sources } = await serviceClient
    .from("sources")
    .select("provider,status,last_synced_at,metadata")
    .eq("workspace_id", userData.workspace_id);

  const safeSources = (sources ?? []).map(({ metadata, ...rest }) => {
    const { access_token: _a, refresh_token: _r, token_expires_at: _e, ...safeMetadata } =
      (metadata ?? {}) as Record<string, unknown>;
    return { ...rest, metadata: safeMetadata };
  });

  return NextResponse.json({ sources: safeSources });
}

export async function DELETE(req: NextRequest) {
  const provider = new URL(req.url).searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!userData?.workspace_id) return NextResponse.json({ error: "No workspace" }, { status: 400 });

  const serviceClient = createServiceClient();
  await serviceClient
    .from("sources")
    .update({ status: "disconnected", metadata: {}, error_message: null })
    .eq("workspace_id", userData.workspace_id)
    .eq("provider", provider);

  return NextResponse.json({ ok: true });
}
