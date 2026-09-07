// GET /api/auth/tesla/register — 一次性注册 Tesla partner account
// 访问前确保：环境变量已在 Vercel 设好，且 /.well-known 公钥已上线可访问
import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.TESLA_CLIENT_ID!
const CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET!
const DOMAIN = 'hisame-z-home.vercel.app'
const TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'
const API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com'

export async function GET() {
  try {
    // 1. client_credentials → partner token
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'openid vehicle_device_data offline_access',
        audience: API_BASE,
      }),
    })

    if (!tokenRes.ok) {
      const txt = await tokenRes.text()
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px"><h2 style="color:#c00">获取 partner token 失败</h2><pre>${txt}</pre></body></html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 500 }
      )
    }

    const { access_token: partnerToken } = await tokenRes.json() as { access_token: string }

    // 2. 注册域名（Tesla 去拉 .well-known 公钥自动验证）
    const regRes = await fetch(`${API_BASE}/api/1/partner_accounts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${partnerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: DOMAIN }),
    })

    const regJson = await regRes.json()

    if (!regRes.ok) {
      return new NextResponse(
        `<html><body style="font-family:sans-serif;padding:40px"><h2 style="color:#c00">注册失败 (${regRes.status})</h2><pre>${JSON.stringify(regJson, null, 2)}</pre><p>常见原因：公钥文件还没上线、域名拼错、Client Secret 不对。</p></body></html>`,
        { headers: { 'Content-Type': 'text/html' }, status: 500 }
      )
    }

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px"><h2 style="color:#1a7a1a">注册成功</h2><pre>${JSON.stringify(regJson, null, 2)}</pre><p>下一步：<a href="/api/auth/tesla">/api/auth/tesla</a> 完成用户授权。</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (e) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px"><h2 style="color:#c00">出错了</h2><pre>${String(e)}</pre></body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    )
  }
}
