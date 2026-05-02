import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seeding de activos...");

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV !== "production") {
    console.log("   Limpiando activos previos...");
    await prisma.asset.deleteMany({});
  }

  // CEDEARs - Acciones internacionales en pesos
  const cedears = [
    { symbol: "AAPL.BA", name: "Apple Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "AAPL.BA" },
    { symbol: "MSFT.BA", name: "Microsoft Corporation", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "MSFT.BA" },
    { symbol: "NVDA.BA", name: "NVIDIA Corporation", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "NVDA.BA" },
    { symbol: "GOOGL.BA", name: "Alphabet Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "GOOGL.BA" },
    { symbol: "AMZN.BA", name: "Amazon.com Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "AMZN.BA" },
    { symbol: "META.BA", name: "Meta Platforms Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "META.BA" },
    { symbol: "TSLA.BA", name: "Tesla Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "TSLA.BA" },
    { symbol: "NFLX.BA", name: "Netflix Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "NFLX.BA" },
    { symbol: "AMD.BA", name: "Advanced Micro Devices", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "AMD.BA" },
  ];

  // Acciones BCBA locales
  const stocks = [
    { symbol: "GGAL", name: "Grupo Galicia S.A.", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "GGAL" },
    { symbol: "VIST", name: "Visa Inc.", type: "CEDEAR", market: "BCBA", currency: "ARS", yahooSymbol: "VIST" },
    { symbol: "YPF", name: "YPF Sociedad Anonima", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "YPF" },
    { symbol: "BMA", name: "Banco Macro S.A.", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "BMA" },
    { symbol: "MELI", name: "Mercado Libre Inc.", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "MELI" },
    { symbol: "SUPV", name: "Supervision S.A.", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "SUPV" },
    { symbol: "TRAN", name: "Grupo Transporte del Pacifico", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "TRAN" },
    { symbol: "ALUA", name: "Aluar Aluminio Argentino", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "ALUA" },
    { symbol: "CEPU", name: "Central Puerto S.A.", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "CEPU" },
    { symbol: "AUSO", name: "Auso Ltd.", type: "STOCK", market: "BCBA", currency: "ARS", yahooSymbol: "AUSO" },
  ];

  // Bonos argentinos
  const bonds = [
    { symbol: "GD30D", name: "Bono Global 2030 USD", type: "BOND", market: "BCBA", currency: "USD", yahooSymbol: "GD30D.BA" },
    { symbol: "AY24D", name: "Bono Austral 2024 USD", type: "BOND", market: "BCBA", currency: "USD", yahooSymbol: "AY24D.BA" },
    { symbol: "TX2X", name: "Bonos Tesoro 2025 ARS", type: "BOND", market: "BCBA", currency: "ARS", yahooSymbol: "TX2X.BA" },
    { symbol: "PR05D", name: "Plazo Fijo Dolarizado 2025", type: "BOND", market: "BCBA", currency: "USD", yahooSymbol: "PR05D.BA" },
  ];

  const allAssets = [...cedears, ...stocks, ...bonds];

  console.log(`   Creando ${allAssets.length} activos...`);

  for (const asset of allAssets) {
    try {
      await prisma.asset.create({
        data: {
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type as any,
          market: asset.market as any,
          currency: asset.currency as any,
          yahooSymbol: asset.yahooSymbol,
        },
      });
      console.log(`   ✓ ${asset.symbol} (${asset.name})`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`   ⚠ ${asset.symbol} ya existe`);
      } else {
        console.error(`   ✗ Error en ${asset.symbol}:`, error.message);
      }
    }
  }

  console.log("✅ Seeding completado!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
