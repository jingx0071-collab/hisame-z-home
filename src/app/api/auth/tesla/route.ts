// GET /api/auth/tesla — 跳转到 Tesla OAuth 授权页（一次性操作，浏览器直接访问）
import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/tesla'

export async function GET() {
  const state = Math.random().toString(36).slice(2, 18)
  const url = buildAuthUrl(state)
  return NextResponse.redirect(url)
}
