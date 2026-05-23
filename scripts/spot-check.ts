import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { count } = await sb.from('memories').select('*', { count: 'exact', head: true })
  console.log('memories 总行数: ' + count)
  const { data } = await sb.from('memories').select('content, tags').order('created_at', { ascending: false }).limit(3)
  for (const [i, r] of (data || []).entries()) console.log((i+1) + '. [' + (r.tags||[]).join(', ') + '] ' + (r.content||'').slice(0, 80))
}
main()
