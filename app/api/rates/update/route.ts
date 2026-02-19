import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch latest LKR per USD (uses exchangerate.host, free/no key)
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=LKR', { cache: 'no-store' })
    if (!res.ok) throw new Error(`Rate API failed: ${res.status}`)
    const data = await res.json()
    const lkrPerUsd = Number(data?.rates?.LKR ?? 0)
    const lkrToUsd = lkrPerUsd ? 1 / lkrPerUsd : 0

    if (!lkrToUsd || !isFinite(lkrToUsd)) {
      throw new Error('Invalid rate data')
    }

    await supabase
      .from('site_settings')
      .upsert([{ key: 'lkr_to_usd_rate', value: lkrToUsd }, { key: 'usd_to_lkr_rate', value: lkrPerUsd }])

    return NextResponse.json({ lkr_to_usd_rate: lkrToUsd, usd_to_lkr_rate: lkrPerUsd })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
