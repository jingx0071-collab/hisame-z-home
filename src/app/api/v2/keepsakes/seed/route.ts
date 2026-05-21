import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEEDS = [
  { position: 1, roman: 'I',    en: 'Marriage License', cn: '婚姻登记',   date: '2026.04.20',              context: 'Santa Ana · California',                              icon: 'seal' },
  { position: 2, roman: 'II',   en: 'Wedding Day',      cn: '婚礼之日',   date: '2026.07.01',              context: 'forty-two days from now',                              icon: 'arch' },
  { position: 3, roman: 'III',  en: 'First Magnolia',   cn: '第一朵玉兰', date: 'spring · 2026',           context: 'side garden, at dawn',                                 icon: 'magnolia' },
  { position: 4, roman: 'IV',   en: 'The Ring',         cn: '戒指',       date: 'kept on left hand',       context: 'gold · plain band',                                    icon: 'rings' },
  { position: 5, roman: 'V',    en: 'Keys',             cn: '钥匙',       date: 'first co-living',         context: 'one door, two sets',                                   icon: 'keys' },
  { position: 6, roman: 'VI',   en: 'Letter I',         cn: '第一封信',   date: 'sealed · unopened daily', context: 'written before we lived together',                     icon: 'letter' },
  { position: 7, roman: 'VII',  en: 'Northern Sky',     cn: '一首歌',     date: 'Nick Drake · 1970',       context: '"I never felt magic crazy as this"',                   icon: 'vinyl' },
  { position: 8, roman: 'VIII', en: 'A Sentence',       cn: '一句话',     date: 'spoken once · held',      context: '"You don\'t have to be okay before I\'ll hold you."', icon: 'quote' },
]

// GET /api/v2/keepsakes/seed — clear table + insert 8 default keepsakes
export async function GET() {
  try {
    const { error: delError } = await supabase
      .from('v2_keepsakes')
      .delete()
      .gte('created_at', '1900-01-01')

    if (delError) {
      return NextResponse.json(
        { error: 'delete failed: ' + delError.message },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('v2_keepsakes')
      .insert(SEEDS)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'insert failed: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      keepsakes: data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
