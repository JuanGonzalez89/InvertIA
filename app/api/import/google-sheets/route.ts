import { NextResponse } from 'next/server'

function extractSheetId(url: string) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match?.[1] ?? null
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const sheetUrl = body?.sheetUrl?.toString().trim()

  if (!sheetUrl) {
    return NextResponse.json({ error: 'sheetUrl requerido' }, { status: 400 })
  }

  const sheetId = extractSheetId(sheetUrl)
  if (!sheetId) {
    return NextResponse.json({ error: 'No pude extraer el ID de Google Sheets' }, { status: 400 })
  }

  const gidMatch = sheetUrl.match(/[?&]gid=(\d+)/)
  const gid = gidMatch?.[1] ?? '0'
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`

  try {
    const response = await fetch(csvUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'No pude leer la planilla pública' }, { status: 400 })
    }

    const csvText = await response.text()
    return NextResponse.json({ ok: true, csvText })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}
