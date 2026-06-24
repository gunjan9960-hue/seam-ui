import type { IngestDoc } from "../ingest";

async function notionFetch(path: string, token: string, body?: object) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

type NotionBlock = { type: string; has_children?: boolean; id: string; [key: string]: unknown };

// Recursively extracts text from blocks up to maxDepth levels
async function extractBlocksDeep(blocks: NotionBlock[], token: string, depth = 0): Promise<string> {
  const MAX_DEPTH = 3;
  const lines: string[] = [];

  for (const b of blocks) {
    const typeData = b[b.type] as { rich_text?: { plain_text: string }[] } | undefined;
    const richText = typeData?.rich_text ?? [];
    const lineText = richText.map((t) => t.plain_text).join("");
    if (lineText) lines.push(lineText);

    if (b.has_children && depth < MAX_DEPTH) {
      const childResult: { results: NotionBlock[] } = await notionFetch(`/blocks/${b.id}/children?page_size=100`, token);
      const childText = await extractBlocksDeep(childResult.results ?? [], token, depth + 1);
      if (childText) lines.push(childText);
    }
  }

  return lines.filter(Boolean).join("\n");
}

async function fetchPageContent(pageId: string, token: string): Promise<string> {
  const blocksResult: { results: NotionBlock[] } = await notionFetch(`/blocks/${pageId}/children?page_size=100`, token);
  return extractBlocksDeep(blocksResult.results ?? [], token);
}

function getPageTitle(page: { properties?: Record<string, { title?: { plain_text: string }[] }> }): string {
  const props = page.properties ?? {};
  for (const key of ["title", "Title", "Name", "name"]) {
    const t = props[key]?.title;
    if (t?.length) return t.map((r) => r.plain_text).join("");
  }
  return "Untitled";
}

export async function fetchNotionDocs(accessToken: string): Promise<IngestDoc[]> {
  const docs: IngestDoc[] = [];
  const seenIds = new Set<string>();

  // ── 1. Search for pages ───────────────────────────────────────────────────
  let cursor: string | undefined;
  do {
    const result: {
      results: { id: string; object: string; properties?: Record<string, { title?: { plain_text: string }[] }>; url?: string; last_edited_time?: string }[];
      has_more?: boolean;
      next_cursor?: string;
    } = await notionFetch("/search", accessToken, {
      filter: { value: "page", property: "object" },
      page_size: 50,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const page of result.results ?? []) {
      if (page.object !== "page" || seenIds.has(page.id)) continue;
      seenIds.add(page.id);

      const title = getPageTitle(page);
      const content = await fetchPageContent(page.id, accessToken);
      if (!content.trim()) continue;

      docs.push({
        externalId: page.id,
        title,
        url: page.url ?? `https://notion.so/${page.id.replace(/-/g, "")}`,
        author: "",
        docType: "page",
        content: `${title}\n\n${content}`,
        lastModified: page.last_edited_time ?? new Date().toISOString(),
        provider: "notion",
      });
    }

    cursor = result.has_more ? result.next_cursor : undefined;
  } while (cursor);

  // ── 2. Fetch database rows ────────────────────────────────────────────────
  let dbCursor: string | undefined;
  do {
    const dbResult: {
      results: { id: string; object: string }[];
      has_more?: boolean;
      next_cursor?: string;
    } = await notionFetch("/search", accessToken, {
      filter: { value: "database", property: "object" },
      page_size: 50,
      ...(dbCursor ? { start_cursor: dbCursor } : {}),
    });

    for (const db of dbResult.results ?? []) {
      if (db.object !== "database") continue;

      // Query all pages (rows) in this database
      let rowCursor: string | undefined;
      do {
        const rows: {
          results: { id: string; properties?: Record<string, { title?: { plain_text: string }[] }>; url?: string; last_edited_time?: string }[];
          has_more?: boolean;
          next_cursor?: string;
        } = await notionFetch(`/databases/${db.id}/query`, accessToken, {
          page_size: 50,
          ...(rowCursor ? { start_cursor: rowCursor } : {}),
        });

        for (const row of rows.results ?? []) {
          if (seenIds.has(row.id)) continue;
          seenIds.add(row.id);

          const title = getPageTitle(row);
          const content = await fetchPageContent(row.id, accessToken);
          if (!content.trim()) continue;

          docs.push({
            externalId: row.id,
            title,
            url: row.url ?? `https://notion.so/${row.id.replace(/-/g, "")}`,
            author: "",
            docType: "database_row",
            content: `${title}\n\n${content}`,
            lastModified: row.last_edited_time ?? new Date().toISOString(),
            provider: "notion",
          });
        }

        rowCursor = rows.has_more ? rows.next_cursor : undefined;
      } while (rowCursor);
    }

    dbCursor = dbResult.has_more ? dbResult.next_cursor : undefined;
  } while (dbCursor);

  return docs;
}
