import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: 'Invalid payload, expected { rows: [...] }' }, { status: 400 })
  }

  const rows = body.rows
  let processed = 0

  try {
    for (const r of rows) {
      const ticker = (r.ticker || '').toString().toUpperCase().trim()
      const qty = Number(r.quantity) || 0
      const price = Number(r.price) || 0
      const type = (r.type || 'BUY').toString().toUpperCase() === 'SELL' ? 'SELL' : 'BUY'

      if (!ticker || qty === 0) continue

      // Find or create asset
      let asset = await db.asset.findUnique({ where: { symbol: ticker } })
      if (!asset) {
        asset = await db.asset.create({
          data: {
            symbol: ticker,
            name: ticker,
            type: 'STOCK',
            market: 'BCBA',
            currency: 'ARS',
          },
        })
      }

      // Upsert position (simple logic)
      const existing = await db.position.findFirst({ where: { userId, assetId: asset.id } })
      if (existing) {
        const newQty = existing.quantity + (type === 'BUY' ? qty : -qty)
        const newAvg = newQty > 0 ? ((existing.avgPrice * existing.quantity) + (price * qty)) / (existing.quantity + qty) : 0
        await db.position.update({ where: { id: existing.id }, data: { quantity: newQty, avgPrice: newAvg } })
      } else {
        await db.position.create({ data: { userId, assetId: asset.id, quantity: qty, avgPrice: price, currency: 'ARS' } })
      }

      // Create transaction
      await db.transaction.create({
        data: {
          userId,
          assetId: asset.id,
          type: type as any,
          quantity: qty,
          price: price || undefined,
          total: (price || 0) * qty,
          currency: 'ARS',
          date: new Date(),
          source: 'CSV',
        },
      })

      processed++
    }

    return NextResponse.json({ ok: true, processed })
  } catch (err: any) {
    console.error('Import error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
