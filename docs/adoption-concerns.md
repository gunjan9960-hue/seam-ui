# Adoption Concerns — Real-World Blockers for Series A–C PM Teams

Captured from a PM evaluation lens. Categorized into: UI fixes, FAQ answers, and open gaps requiring product/legal/infra work.

---

## Category 1 — Addressable via UI Changes

These can be resolved with no backend work, just surface the right signals.

| Concern | UI Fix |
|---------|--------|
| How do I know the AI isn't hallucinating a decision that was never made? | Show "last synced at" timestamp on every source card; add a confidence indicator or "no match found" state instead of a guess |
| If a document was updated, will the answer reflect the latest version? | Show sync recency badge per source (e.g. "Notion · synced 2h ago") — already partially in place via stale data risk A4 |
| Can I trust citations enough to share with a stakeholder? | Add a "Copy answer with citations" button; make source cards link directly to the original doc |
| Will my team actually use this or forget about it in a week? | Onboarding checklist with first-query prompt; empty state that shows example queries relevant to PM workflows |
| What happens when OAuth tokens expire? | Show a banner/alert in Settings when a source is disconnected or token is stale; prompt re-auth inline |
| Does it work on mobile? | Responsive audit + mobile-first polish on search page (currently functional but not optimized) |

---

## Category 2 — Addressable via FAQs

These are trust/policy questions that don't need features — just clear, honest public statements.

| Concern | FAQ Answer |
|---------|------------|
| Is my company's internal data safe? | Data is stored in your own Supabase instance. Seam never reads your raw documents — only embeddings (numerical vectors) are stored. Raw text is used only during sync and not retained. |
| Do you train your AI on my company's data? | No. Claude (Anthropic) is called via API with your retrieved context per query. Anthropic's API does not train on inputs. Seam stores no query history by default. |
| Who can see what — can a junior PM access confidential docs? | Access is tied to the Google OAuth login. Each user's sources are scoped to their own connected accounts. Row-level security (RLS) in Supabase ensures data isolation per user. Multi-user workspace RBAC is on the roadmap. |
| Is it SOC 2 / GDPR compliant? | Seam is an early-stage product. Supabase (the data layer) is SOC 2 Type II certified. Full SOC 2 for Seam itself is planned post-Series A. GDPR: data is stored in the region you configure your Supabase project in. |
| I already have Confluence search and Slack search — why add another tool? | Native search is keyword-only and siloed per tool. Seam searches across all sources simultaneously and returns a single synthesized answer with citations — not a list of links. |
| What's the measurable time saved per week? | Internal target: eliminate the 25-min avg context-switch cost per PM query (source: McKinsey PM productivity research). Early users report ~3–5 queries/day replaced per PM. |
| What if Seam shuts down — can I export my data? | Yes. Your source documents live in your own connected tools (Notion, Jira, etc.). The chunks/embeddings in Supabase can be exported via a standard Postgres dump. You own your data. |
| ₹800/user/month — how do I justify this to my manager? | One recovered decision (a re-researched spec, a missed stakeholder commitment) costs more than a month of Seam. ROI framing: if a PM earns ₹15L/year, 25 min/day saved = ~₹1.25L/year in recovered time per PM. |

---

## Category 3 — Remaining (Require Product / Infra / Legal Work)

These cannot be resolved by UI tweaks or FAQ copy alone. They are real product gaps.

| Concern | Gap | Effort |
|---------|-----|--------|
| We use Confluence, not Notion | Confluence OAuth + sync fetcher not yet built | Medium — same pattern as Notion, ~1 sprint |
| Our Jira is self-hosted — does OAuth support that? | Current OAuth assumes Jira Cloud. Self-hosted (Data Center) uses a different OAuth 2.0 flow + base URL config | Medium-High — needs per-org base URL + different token endpoint |
| How long does initial sync take across thousands of docs? | No progress indicator or estimated time shown; large syncs silently run in background | Medium — need async job tracking + UI progress state |
| Is there an SLA / uptime guarantee? | No SLA exists. Vercel hobby/pro uptime is ~99.9% but not contractual for Seam | Post-Series A — needs legal terms + uptime monitoring (e.g. Betteruptime) |
| Is there a team plan or per-seat pricing for a 10-person PM org? | Only individual plan exists. No workspace/org concept, no team billing | High — requires workspace model, RBAC, and Stripe team billing |
| How do I get support if something breaks? | No support channel exists beyond email | Low — add Intercom or a public status page + support email in footer |
| Where is data stored — GDPR region? | Supabase region is set at project creation. No user-facing region selection | Low — document the default region; add region choice at onboarding for EU users |
