export const PROVIDERS = ["notion", "slack"] as const;
export type ProviderId = (typeof PROVIDERS)[number];

interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: () => string;
  clientSecret: () => string;
  tokenAuthMethod: "basic" | "body";
  tokenBodyFormat?: "form" | "json"; // Notion requires JSON; everyone else uses form
  extraAuthParams?: Record<string, string>;
  extraTokenParams?: Record<string, string>;
}

function env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const OAUTH_CONFIGS: Record<ProviderId, OAuthConfig> = {
  notion: {
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    scopes: [],
    clientId: () => env("NOTION_CLIENT_ID"),
    clientSecret: () => env("NOTION_CLIENT_SECRET"),
    tokenAuthMethod: "basic",
    tokenBodyFormat: "json",
    extraAuthParams: { owner: "user" },
  },
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: [],
    clientId: () => env("SLACK_CLIENT_ID"),
    clientSecret: () => env("SLACK_CLIENT_SECRET"),
    tokenAuthMethod: "basic",
    extraAuthParams: {
      user_scope: "channels:history,channels:read,channels:write,groups:history,groups:read,pins:read,reactions:read,search:read,search:read.public,search:read.private,search:read.mpim,search:read.im,files:read,users:read,chat:write",
    },
  },
};

export function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  return `${base}/api/oauth/callback`;
}

export function buildAuthUrl(provider: ProviderId, state: string): string {
  const cfg = OAUTH_CONFIGS[provider];
  const params = new URLSearchParams({
    client_id: cfg.clientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    state,
    ...(cfg.scopes.length > 0 ? { scope: cfg.scopes.join(" ") } : {}),
    ...(cfg.extraAuthParams ?? {}),
  });
  return `${cfg.authUrl}?${params.toString()}`;
}

export async function exchangeCode(
  provider: ProviderId,
  code: string
): Promise<{ access_token: string; refresh_token?: string; [key: string]: unknown }> {
  const cfg = OAUTH_CONFIGS[provider];
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    ...(cfg.extraTokenParams ?? {}),
  };

  const useJson = cfg.tokenBodyFormat === "json";
  const headers: Record<string, string> = {
    "Content-Type": useJson ? "application/json" : "application/x-www-form-urlencoded",
  };

  if (cfg.tokenAuthMethod === "basic") {
    const creds = Buffer.from(`${cfg.clientId()}:${cfg.clientSecret()}`).toString("base64");
    headers["Authorization"] = `Basic ${creds}`;
  } else {
    body.client_id = cfg.clientId();
    body.client_secret = cfg.clientSecret();
  }

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers,
    body: useJson ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });

  const data = await res.json();
  console.log(`[oauth] exchangeCode ${provider} status=${res.status}`, JSON.stringify(data).slice(0, 200));

  // Slack OAuth v2 with user_scope puts the user token under authed_user.access_token
  if (provider === "slack" && data.authed_user?.access_token) {
    return { ...data, access_token: data.authed_user.access_token };
  }
  if (!res.ok || !data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function refreshAccessToken(
  provider: ProviderId,
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const cfg = OAUTH_CONFIGS[provider];
  const body: Record<string, string> = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };

  const useJson = cfg.tokenBodyFormat === "json";
  const headers: Record<string, string> = {
    "Content-Type": useJson ? "application/json" : "application/x-www-form-urlencoded",
  };

  if (cfg.tokenAuthMethod === "basic") {
    const creds = Buffer.from(`${cfg.clientId()}:${cfg.clientSecret()}`).toString("base64");
    headers["Authorization"] = `Basic ${creds}`;
  } else {
    body.client_id = cfg.clientId();
    body.client_secret = cfg.clientSecret();
  }

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers,
    body: useJson ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }
  return data;
}
