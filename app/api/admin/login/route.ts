import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getAdminSecret(): string {
  const secret = process.env.ADMIN_TOKEN_SECRET
  if (!secret) throw new Error('ADMIN_TOKEN_SECRET 환경변수가 설정되지 않았습니다.')
  return secret
}

export function createSignedToken(): string {
  const secret = getAdminSecret()
  const payload = `admin:${Date.now()}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${signature}`
}

export function verifySignedToken(token: string): boolean {
  try {
    const secret = getAdminSecret()
    const lastDot = token.lastIndexOf('.')
    if (lastDot === -1) return false
    const payload = token.slice(0, lastDot)
    const signature = token.slice(lastDot + 1)
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false

    const timestamp = parseInt(payload.split(':')[1], 10)
    const maxAge = 24 * 60 * 60 * 1000
    return Date.now() - timestamp < maxAge
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const validUsername = process.env.ADMIN_USERNAME
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: '관리자 계정이 설정되지 않았습니다.' }, { status: 500 })
  }

  if (username === validUsername && password === validPassword) {
    const token = createSignedToken()

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  }

  return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
}
