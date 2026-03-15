import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const validUsername = process.env.ADMIN_USERNAME || 'daolabus'
  const validPassword = process.env.ADMIN_PASSWORD || 'dao12345'

  if (username === validUsername && password === validPassword) {
    const token = crypto.randomBytes(32).toString('hex')

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  }

  return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
}
