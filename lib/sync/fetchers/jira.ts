import type { IngestDoc } from "../ingest";

export async function fetchJiraDocs(accessToken: string, cloudId: string, siteUrl: string, sinceDate?: string): Promise<IngestDoc[]> {
  const docs: IngestDoc[] = [];
  const base = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;
  let startAt = 0;
  const maxResults = 50;

  // Incremental: only fetch issues updated after last sync
  const dateFilter = sinceDate
    ? `updated >= "${sinceDate.slice(0, 10)} 00:00" AND `
    : "";

  while (true) {
    const jql = encodeURIComponent(`${dateFilter}order by updated DESC`);
    const res = await fetch(
      `${base}/search?jql=${jql}&startAt=${startAt}&maxResults=${maxResults}&fields=summary,description,comment,assignee,status,updated`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
    );
    const data: {
      issues?: {
        id: string;
        key: string;
        self: string;
        fields: {
          summary?: string;
          description?: { content?: { content?: { text?: string }[] }[] };
          updated?: string;
          assignee?: { displayName?: string };
          status?: { name?: string };
          comment?: { comments?: { body?: { content?: { content?: { text?: string }[] }[] } }[] };
        };
      }[];
      total?: number;
    } = await res.json();

    for (const issue of data.issues ?? []) {
      const f = issue.fields;
      const descText = f.description?.content
        ?.flatMap((b) => b.content?.map((c) => c.text ?? "") ?? [])
        .join(" ") ?? "";
      const comments = f.comment?.comments
        ?.map((c) => c.body?.content?.flatMap((b) => b.content?.map((t) => t.text ?? "") ?? []).join(" ") ?? "")
        .join("\n") ?? "";

      const content = [f.summary, descText, comments].filter(Boolean).join("\n\n");
      if (!content.trim()) continue;

      docs.push({
        externalId: issue.id,
        title: `${issue.key}: ${f.summary ?? ""}`,
        url: siteUrl ? `${siteUrl}/browse/${issue.key}` : "",
        author: f.assignee?.displayName ?? "",
        docType: "issue",
        content,
        lastModified: f.updated ?? new Date().toISOString(),
        provider: "jira",
      });
    }

    startAt += maxResults;
    if (startAt >= (data.total ?? 0)) break;
  }

  return docs;
}

export async function getJiraSite(accessToken: string): Promise<{ id: string; url: string } | null> {
  const res = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  const sites: { id: string; url: string }[] = await res.json();
  return sites?.[0] ?? null;
}
