// GET /api/tesla-pubkey — 输出 Tesla 需要拉的 P-256 公钥
// 通过 next.config.ts 的 rewrites，把 /.well-known/appspecific/com.tesla.3p.public-key.pem 映射到这里
import { NextResponse } from 'next/server'

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE2VbTW62QPYmRRa2zcZErwegD7x98
E7G2lLK/N7aBjORi20Ii8k43uqZ2gf4g5O5D97pJeY1GYbUdr7VwxrjdyA==
-----END PUBLIC KEY-----
`

export async function GET() {
  return new NextResponse(PUBLIC_KEY, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-pem-file',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
