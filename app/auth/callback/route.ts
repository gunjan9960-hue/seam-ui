import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error.message}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Check if this user already has a workspace (returning user)
  const { data: existingUser } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (existingUser?.workspace_id) {
    return NextResponse.redirect(`${origin}/app`);
  }

  // New user — auto-create workspace from Google profile, then go to integrations wizard
  try {
    const serviceClient = createServiceClient();
    const displayName: string = user.user_metadata?.full_name ?? user.email ?? "User";
    const slug = `workspace-${Date.now()}`;

    const { data: workspace } = await serviceClient
      .from("workspaces")
      .insert({ name: displayName, slug })
      .select()
      .single();

    if (workspace) {
      await serviceClient.from("users").upsert({
        id: user.id,
        workspace_id: workspace.id,
        full_name: displayName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      });
    }
  } catch {
    // workspace creation failed — integrations page will handle gracefully
  }

  return NextResponse.redirect(`${origin}/app/integrations?new=1`);
}
