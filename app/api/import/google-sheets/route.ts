import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { sheetUrl } = await req.json();
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match?.[1];

    if (!sheetId) {
      return NextResponse.json({ error: "Link de Google Sheets inválido" }, { status: 400 });
    }

    // Intentamos descargar la versión CSV de la planilla pública
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      return NextResponse.json({ 
        error: "No pudimos acceder a la planilla. Asegurate de que sea pública (Cualquier persona con el enlace puede leer)." 
      }, { status: 400 });
    }

    const csvText = await response.text();

    return NextResponse.json({ csvText });

  } catch (error) {
    console.error("[GoogleSheetsAPI] Error:", error);
    return NextResponse.json({ error: "Error interno al conectar con Google" }, { status: 500 });
  }
}
