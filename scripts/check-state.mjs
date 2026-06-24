import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();

const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"));

const email = "gunjan9960@gmail.com";
const { data: { users } } = await supabase.auth.admin.listUsers();
const authUser = users.find((u) => u.email === email);
console.log("auth user:", authUser?.id ?? "NOT FOUND");

if (authUser) {
  const { data: profile } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle();
  console.log("profile row:", profile);
  if (profile?.workspace_id) {
    const { data: sources } = await supabase.from("sources").select("*").eq("workspace_id", profile.workspace_id);
    console.log("sources:", sources);
    const { count: docCount } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("workspace_id", profile.workspace_id);
    console.log("documents count:", docCount);
    const { count: chunkCount } = await supabase.from("chunks").select("*", { count: "exact", head: true }).eq("workspace_id", profile.workspace_id);
    console.log("chunks count:", chunkCount);
  }
}
