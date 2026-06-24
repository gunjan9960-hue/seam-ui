import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const get = k => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim();
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));

const { data: doc } = await sb.from('documents').select('id').ilike('title','%H2 2026%').single();
console.log('doc id:', doc.id);

const { data: chunks } = await sb.from('chunks').select('id,text,chunk_index').eq('document_id', doc.id);
console.log('chunk text:', chunks?.[0]?.text?.slice(0, 400));

const { data: withEmb } = await sb.from('chunks').select('id').eq('document_id', doc.id).not('embedding','is', null);
const { data: noEmb } = await sb.from('chunks').select('id').eq('document_id', doc.id).is('embedding', null);
console.log('with embedding:', withEmb?.length, '| without:', noEmb?.length);

// Also test match_chunks directly
const workspaceId = '446a635e-fa0d-469b-a51b-f885ade2e24d';
const { data: matchResult, error: matchErr } = await sb.rpc('match_chunks', {
  match_workspace_id: workspaceId,
  query_embedding: new Array(512).fill(0.01),
  match_threshold: 0.0,
  match_count: 5,
});
console.log('match_chunks (zero vec, threshold 0):', matchResult?.length, matchErr?.message);
