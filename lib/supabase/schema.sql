-- Enable pgvector extension
create extension if not exists vector;

-- =============================================
-- WORKSPACES
-- =============================================
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  created_at  timestamptz default now()
);

alter table workspaces enable row level security;

create policy "Users can read their own workspace"
  on workspaces for select
  using (id = (select workspace_id from users where id = auth.uid()));

-- =============================================
-- USERS (extends Supabase auth.users)
-- =============================================
create table if not exists users (
  id            uuid primary key references auth.users(id) on delete cascade,
  workspace_id  uuid references workspaces(id) on delete cascade,
  full_name     text,
  product_name  text,
  company       text,
  stage         text,  -- 'pre-launch' | 'early' | 'growth' | 'scale'
  avatar_url    text,
  created_at    timestamptz default now()
);

alter table users enable row level security;

create policy "Users can read own profile"
  on users for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on users for update
  using (id = auth.uid());

-- =============================================
-- SOURCES (OAuth tokens per user per provider)
-- =============================================
create table if not exists sources (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,
  user_id         uuid references users(id) on delete cascade,
  provider        text not null,  -- 'notion' | 'jira' | 'google' | 'slack'
  status          text default 'pending',  -- 'pending' | 'connected' | 'error' | 'syncing'
  access_token    text,
  refresh_token   text,
  token_expires_at timestamptz,
  scope           text,
  metadata        jsonb default '{}',  -- provider-specific (e.g., Jira cloud_id, Slack team_id)
  last_synced_at  timestamptz,
  error_message   text,
  created_at      timestamptz default now(),
  unique(workspace_id, provider)
);

alter table sources enable row level security;

create policy "Users can read own workspace sources"
  on sources for select
  using (workspace_id = (select workspace_id from users where id = auth.uid()));

create policy "Users can insert own workspace sources"
  on sources for insert
  with check (workspace_id = (select workspace_id from users where id = auth.uid()));

create policy "Users can update own workspace sources"
  on sources for update
  using (workspace_id = (select workspace_id from users where id = auth.uid()));

-- =============================================
-- DOCUMENTS (indexed pages from each source)
-- =============================================
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  source_id     uuid references sources(id) on delete cascade,
  provider      text not null,
  external_id   text not null,  -- Notion page_id, Jira issue_id, etc.
  title         text,
  url           text,
  author        text,
  doc_type      text,  -- 'page' | 'issue' | 'message' | 'doc'
  content_hash  text,  -- for change detection
  last_modified timestamptz,
  indexed_at    timestamptz default now(),
  unique(workspace_id, provider, external_id)
);

alter table documents enable row level security;

create policy "Users can read own workspace documents"
  on documents for select
  using (workspace_id = (select workspace_id from users where id = auth.uid()));

-- =============================================
-- CHUNKS (with pgvector embeddings)
-- =============================================
create table if not exists chunks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  document_id   uuid references documents(id) on delete cascade,
  content       text not null,
  embedding     vector(512),  -- Voyage AI voyage-3-lite dimensions (fixed at 512, not configurable)
  chunk_index   int not null,
  token_count   int,
  created_at    timestamptz default now()
);

alter table chunks enable row level security;

create policy "Users can read own workspace chunks"
  on chunks for select
  using (workspace_id = (select workspace_id from users where id = auth.uid()));

-- Index for fast cosine similarity search
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- =============================================
-- QUERIES (search history)
-- =============================================
create table if not exists queries (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  user_id       uuid references users(id) on delete cascade,
  query_text    text not null,
  intent        text,
  result_count  int,
  latency_ms    int,
  created_at    timestamptz default now()
);

alter table queries enable row level security;

create policy "Users can read own workspace queries"
  on queries for select
  using (workspace_id = (select workspace_id from users where id = auth.uid()));

create policy "Users can insert queries"
  on queries for insert
  with check (workspace_id = (select workspace_id from users where id = auth.uid()));

-- =============================================
-- HELPER FUNCTION: vector similarity search
-- scoped to workspace_id for RLS-bypassing internal use
-- =============================================
create or replace function match_chunks(
  query_embedding vector(512),
  match_workspace_id uuid,
  match_count int default 20,
  match_threshold float default 0.3
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.content,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where c.workspace_id = match_workspace_id
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
