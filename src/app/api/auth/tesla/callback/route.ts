// GET /api/auth/tesla/callback — Tesla 授权回调，code → token 存 Supabase
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, listVehicles, getValidToken, saveTokenRow } from '@/lib/tesla'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return new NextResponse(`Tesla auth failed: ${error || 'no code'}`, { status: 400 })
  }

  const ok = await exchangeCode(code)
  if (!ok) {
    return new NextResponse('Token exchange failed — check server logs', { status: 500 })
  }

  // 顺手拿第一辆车的 vehicle_id 存起来
  const token = await getValidToken()
  if (token) {
    const vehicles = await listVehicles(token)
    if (vehicles && vehicles.length > 0) {
      await saveTokenRow({ vehicle_id: vehicles[0].id_s })
    }
  }

  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px">
      <h2>Tesla 授权成功</h2>
      <p>token 已存进 Supabase，关掉这个页面就行了。</p>
      <p style="color:#888;font-size:13px">Vercel cron 会每分钟轮询车辆状态。</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
