import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import { getCurrentUser } from "@/lib/auth/get-current-user"

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "No pudimos cargar el usuario" }, { status: 404 })
  }

  const secret = speakeasy.generateSecret({
    length: 20,
    name: `InvertIA (${user.email})`,
    issuer: "InvertIA",
  })

  const otpauthUrl =
    secret.otpauth_url ??
    `otpauth://totp/${encodeURIComponent(`InvertIA (${user.email})`)}?secret=${secret.base32}&issuer=InvertIA`

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
  })

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      twoFactorEnabled: true,
    },
  })

  return NextResponse.json({
    ok: true,
    secret: secret.base32,
    otpauthUrl,
    qrCodeDataUrl,
  })
}
