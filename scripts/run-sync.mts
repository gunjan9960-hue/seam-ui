import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('/Users/gunjanmah/Desktop/Project/seam-ui/.env.local', 'utf8');
const get = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim() ?? '';

process.env.NEXT_PUBLIC_SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
process.env.SUPABASE_SERVICE_ROLE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
process.env.VOYAGE_API_KEY = get('VOYAGE_API_KEY');

const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));

const { data: source } = await sb.from('sources').select('*').eq('provider','notion').single();
if (!source) { console.error('No notion source'); process.exit(1); }
console.log('Source:', source.id, '| workspace:', source.workspace_id);

await sb.from('sources').update({ status: 'syncing' }).eq('id', source.id);

const { fetchNotionDocs } = await import('/Users/gunjanmah/Desktop/Project/seam-ui/lib/sync/fetchers/notion.ts');
const docs = await fetchNotionDocs(source.metadata?.access_token);
console.log('Fetched', docs.length, 'docs');

const { ingestDocuments } = await import('/Users/gunjanmah/Desktop/Project/seam-ui/lib/sync/ingest.ts');
await ingestDocuments(source.workspace_id, source.id, 'notion', docs);

await sb.from('sources').update({
  status: 'connected',
  last_synced_at: new Date().toISOString(),
  metadata: { ...source.metadata, docs_indexed: docs.length },
}).eq('id', source.id);

console.log('Done. Indexed', docs.length, 'docs.');
