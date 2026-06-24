import type { IngestDoc } from "../ingest";

const MIME_EXPORT: Record<string, string> = {
  "application/vnd.google-apps.document":     "text/plain",
  "application/vnd.google-apps.spreadsheet":  "text/csv",
  "application/vnd.google-apps.presentation": "text/plain",
};

const DOC_URL: Record<string, (id: string) => string> = {
  "application/vnd.google-apps.document":     (id) => `https://docs.google.com/document/d/${id}`,
  "application/vnd.google-apps.spreadsheet":  (id) => `https://docs.google.com/spreadsheets/d/${id}`,
  "application/vnd.google-apps.presentation": (id) => `https://docs.google.com/presentation/d/${id}`,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": (id) => `https://drive.google.com/file/d/${id}`,
};

// PPTX files uploaded to Drive can be exported as plain text via the Slides export API
// after Drive converts them. We treat them the same as native Slides.
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function buildDriveQuery(): string {
  const googleTypes = Object.keys(MIME_EXPORT);
  const parts = [...googleTypes, PPTX_MIME].map((m) => `mimeType='${m}'`);
  return parts.join(" or ");
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  owners?: { displayName: string }[];
}

async function exportContent(
  file: DriveFile,
  accessToken: string,
): Promise<string | null> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // PPTX files uploaded to Drive: try exporting as plain text via the Slides export
  // (Drive auto-converts uploaded Office files)
  const exportMime = file.mimeType === PPTX_MIME
    ? "text/plain"
    : MIME_EXPORT[file.mimeType];

  if (!exportMime) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportMime)}`,
    { headers },
  );

  if (!res.ok) return null;
  const text = await res.text();
  return text.trim().length >= 50 ? text.slice(0, 50000) : null;
}

export async function fetchGoogleDocs(accessToken: string): Promise<IngestDoc[]> {
  const docs: IngestDoc[] = [];

  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(buildDriveQuery())}&pageSize=100&fields=files(id,name,mimeType,modifiedTime,owners)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok) {
    console.error("[google] Drive list failed:", listRes.status);
    return docs;
  }

  const listData: { files?: DriveFile[] } = await listRes.json();

  for (const file of listData.files ?? []) {
    try {
      const content = await exportContent(file, accessToken);
      if (!content) continue;

      const urlFn = DOC_URL[file.mimeType] ?? ((id: string) => `https://drive.google.com/file/d/${id}`);

      docs.push({
        externalId: file.id,
        title: file.name,
        url: urlFn(file.id),
        author: file.owners?.[0]?.displayName ?? "",
        docType: "doc",
        content: `${file.name}\n\n${content}`,
        lastModified: file.modifiedTime,
        provider: "google-docs",
      });
    } catch {
      continue;
    }
  }

  return docs;
}
