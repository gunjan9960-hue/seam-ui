import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, productName, company, stage } = await req.json();

  const VALID_STAGES = ["early", "growth", "scale"] as const;
  type Stage = typeof VALID_STAGES[number];
  const validatedStage: Stage | null = VALID_STAGES.includes(stage) ? stage : null;

  const serviceClient = createServiceClient();

  // Already onboarded? Don't create a second workspace.
  const { data: existing } = await serviceClient
    .from("users")
    .select("workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.workspace_id) {
    return NextResponse.json({ workspaceId: existing.workspace_id });
  }

  const slug = `${(company || name || "workspace").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

  const { data: workspace, error: wsError } = await serviceClient
    .from("workspaces")
    .insert({ name: company || name, slug })
    .select()
    .single();

  if (wsError || !workspace) {
    return NextResponse.json({ error: wsError?.message ?? "Failed to create workspace" }, { status: 500 });
  }

  const { error: userError } = await serviceClient.from("users").upsert({
    id: user.id,
    workspace_id: workspace.id,
    full_name: name,
    product_name: productName,
    company,
    stage: validatedStage,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ workspaceId: workspace.id });
}
