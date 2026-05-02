import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { name, phone, country } = body

  try {
    const updated = await db.user.update({
      where: { externalAuthId: userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        country: country || undefined,
      },
    })

    return NextResponse.json({ ok: true, user: updated })
  } catch (err: any) {
    console.error('Error updating user', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
