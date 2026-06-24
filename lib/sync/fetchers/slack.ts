import type { IngestDoc } from "../ingest";

const MAX_CHANNELS = 50;
const MESSAGES_PER_CHANNEL = 200;
const MIN_THREAD_CHARS = 50;

async function slackGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://slack.com/api/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type SlackMessage = {
  ts: string;
  text?: string;
  thread_ts?: string;
  reply_count?: number;
  files?: { name?: string; title?: string }[];
};

function messageText(msg: SlackMessage): string {
  const parts: string[] = [];
  if (msg.text?.trim()) parts.push(msg.text.trim());
  for (const f of msg.files ?? []) {
    const name = f.title || f.name;
    if (name) parts.push(`[file: ${name}]`);
  }
  return parts.join(" ");
}

export async function fetchSlackDocs(accessToken: string): Promise<IngestDoc[]> {
  const docs: IngestDoc[] = [];
  const channels: { id: string; name: string; is_private?: boolean }[] = [];

  // Paginate channels — public + private
  let cursor: string | undefined;
  do {
    const params = new URLSearchParams({
      types: "public_channel,private_channel",
      limit: "200",
      exclude_archived: "true",
      ...(cursor ? { cursor } : {}),
    });
    const res = await slackGet<{
      channels?: { id: string; name: string; is_private?: boolean }[];
      response_metadata?: { next_cursor?: string };
      ok?: boolean;
    }>(`conversations.list?${params}`, accessToken);

    if (!res.ok) break;
    channels.push(...(res.channels ?? []));
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor && channels.length < MAX_CHANNELS);

  const topChannels = channels.slice(0, MAX_CHANNELS);

  for (const channel of topChannels) {
    // Fetch channel history
    let msgCursor: string | undefined;
    const allMessages: SlackMessage[] = [];

    do {
      const params = new URLSearchParams({
        channel: channel.id,
        limit: String(MESSAGES_PER_CHANNEL),
        ...(msgCursor ? { cursor: msgCursor } : {}),
      });
      const historyRes = await slackGet<{
        messages?: SlackMessage[];
        response_metadata?: { next_cursor?: string };
        ok?: boolean;
      }>(`conversations.history?${params}`, accessToken);

      if (!historyRes.ok) break;
      allMessages.push(...(historyRes.messages ?? []));
      msgCursor = historyRes.response_metadata?.next_cursor || undefined;
    } while (msgCursor && allMessages.length < MESSAGES_PER_CHANNEL * 2);

    await sleep(300);

    // For each message that has replies, fetch the full thread
    const threadMap = new Map<string, string[]>();

    for (const msg of allMessages) {
      const text = messageText(msg);
      if (!text) continue;

      // If this is a threaded reply included in history, skip — we'll get it via replies API
      if (msg.thread_ts && msg.thread_ts !== msg.ts) continue;

      const key = msg.ts;
      if (!threadMap.has(key)) threadMap.set(key, []);
      threadMap.get(key)!.push(text);

      // Fetch thread replies if any exist
      if ((msg.reply_count ?? 0) > 0) {
        const repliesRes = await slackGet<{
          messages?: SlackMessage[];
          ok?: boolean;
        }>(`conversations.replies?channel=${channel.id}&ts=${msg.ts}&limit=100`, accessToken);

        if (repliesRes.ok) {
          // Skip first message (it's the parent, already added)
          for (const reply of (repliesRes.messages ?? []).slice(1)) {
            const replyText = messageText(reply);
            if (replyText) threadMap.get(key)!.push(replyText);
          }
        }
        await sleep(300);
      }
    }

    for (const [ts, messages] of threadMap) {
      const content = messages.join("\n");
      if (content.length < MIN_THREAD_CHARS) continue;
      docs.push({
        externalId: `${channel.id}-${ts}`,
        title: `#${channel.name} thread`,
        url: `https://slack.com/app_redirect?channel=${channel.id}`,
        author: "",
        docType: "message",
        content,
        lastModified: new Date(parseFloat(ts) * 1000).toISOString(),
        provider: "slack",
      });
    }
  }

  // Pinned messages — highest signal, index separately
  for (const channel of topChannels) {
    const pinsRes = await slackGet<{
      items?: { type: string; message?: SlackMessage }[];
      ok?: boolean;
    }>(`pins.list?channel=${channel.id}`, accessToken);

    if (!pinsRes.ok) continue;

    for (const item of pinsRes.items ?? []) {
      if (item.type !== "message" || !item.message) continue;
      const text = messageText(item.message);
      if (!text || text.length < MIN_THREAD_CHARS) continue;

      docs.push({
        externalId: `pin-${channel.id}-${item.message.ts}`,
        title: `📌 Pinned in #${channel.name}`,
        url: `https://slack.com/app_redirect?channel=${channel.id}`,
        author: "",
        docType: "message",
        content: `[Pinned message in #${channel.name}]\n${text}`,
        lastModified: new Date(parseFloat(item.message.ts) * 1000).toISOString(),
        provider: "slack",
      });
    }

    await sleep(300);
  }

  return docs;
}
