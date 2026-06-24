import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OAUTH_CONFIGS, buildAuthUrl, type ProviderId } from "@/lib/oauth";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!userData?.workspace_id) {
    return NextResponse.json({ error: "Complete onboarding before connecting a source" }, { status: 400 });
  }

  const { provider } = await req.json();
  if (!OAUTH_CONFIGS[provider as ProviderId]) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ provider, userId: user.id })).toString("base64url");
  const url = buildAuthUrl(provider as ProviderId, state);

  return NextResponse.json({ url });
}
