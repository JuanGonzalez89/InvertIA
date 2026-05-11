// lib/services/portfolio.service.ts
// Capa de servicios: hoy devuelve mock data.
// En Fase 4, estas funciones llamarán al MCP/DB real.
// El resto de la app nunca sabe de dónde vienen los datos.

'use server';

import { db } from '@/lib/prisma';
import type { Portfolio, Order, AgentContext } from '@/lib/types/portfolio';
import { QUOTE_FIELDS, toBCBASymbol, yahooFinance } from '@/lib/yahoo';
import { resolveAssetStorageSymbol, resolvePreferredQuoteMarket } from '@/lib/instrument';

type FreshMarketQuoteSnapshot = {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  changePercent: number;
  marketTime?: number;
};

async function getUsdArsRate(): Promise<number> {
  try {
    const quote = await yahooFinance.quote('USDARS=X', { fields: QUOTE_FIELDS });
    const rate = quote?.regularMarketPrice;
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 ? rate : 1;
  } catch (error) {
    console.error('[PortfolioService] getUsdArsRate failed:', error);
    return 1;
  }
}

function mapDbAssetTypeToUi(type: string): 'ACCION' | 'CEDEAR' | 'BONO' | 'ETF' {
  switch (type?.toUpperCase()) {
    case 'CEDEAR':
      return 'CEDEAR';
    case 'BOND':
      return 'BONO';
    case 'ETF':
      return 'ETF';
    case 'STOCK':
    default:
      return 'ACCION';
  }
}

async function getFreshMarketQuote(symbol: string): Promise<FreshMarketQuoteSnapshot | null> {
  const candidate = toBCBASymbol(symbol);

  try {
    const quote = await yahooFinance.quote(candidate, { fields: QUOTE_FIELDS });

    if (!quote || typeof quote.regularMarketPrice !== 'number') {
      console.warn(`[PortfolioService] No se encontró precio para: ${candidate}`);
      return null;
    }

    return {
      ticker: candidate,
      name: quote.shortName ?? candidate,
      price: quote.regularMarketPrice,
      currency: candidate.endsWith('.BA') ? 'ARS' : quote.currency ?? 'ARS',
      changePercent: quote.regularMarketChangePercent ?? 0,
      marketTime: quote.regularMarketTime ? new Date(quote.regularMarketTime).getTime() : undefined,
    };
  } catch (error) {
    console.error('[PortfolioService] getFreshMarketQuote failed:', candidate, error);
    return null;
  }
}

// No demo mock data here — production should read from DB. Keep implementation minimal.

// --- Funciones de servicio públicas ---

export async function getPortfolio(userId: string): Promise<Portfolio> {
  try {
    // Obtenemos los balances de efectivo del usuario en todas las monedas
    const cashBalances = await db.cashBalance.findMany({
      where: { userId }
    });
    const safeCashBalances = Array.isArray(cashBalances) ? cashBalances : [];

    // Separamos liquidez por moneda (por ahora retornamos ARS como principal)
    const liquidityARS = safeCashBalances.find((b: any) => b.currency === 'ARS')?.amount || 0;
    const liquidityUSD = safeCashBalances.find((b: any) => b.currency === 'USD')?.amount || 0;

    // Obtenemos sus posiciones actuales junto con la data del activo
    const positions = await db.position.findMany({
      where: { userId },
      include: { asset: true }
    });
    const safePositions = Array.isArray(positions) ? positions : [];
    const usdArsRate = await getUsdArsRate();

    // Obtener precios para todas las posiciones
    const quoteEntries: Array<[string, FreshMarketQuoteSnapshot | null]> = await Promise.all(
      safePositions.map(async (pos: any) => {
        const quote = await getFreshMarketQuote(pos.asset.yahooSymbol || pos.asset.symbol);
        return [pos.id, quote];
      })
    );

    const quoteMap = new Map<string, FreshMarketQuoteSnapshot | null>(quoteEntries);
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const warnings: string[] = [];

    const mappedAssets = safePositions.map((pos: any) => {
      const invested = pos.quantity * pos.avgPrice;
      const quote = quoteMap.get(pos.id);
      const currentPrice = quote?.price ?? pos.avgPrice;
      const positionCurrency = pos.currency === 'USD' ? 'USD' : 'ARS';
      const marketCurrency = quote?.currency === 'USD'
        ? 'USD'
        : quote?.currency === 'ARS'
          ? 'ARS'
          : positionCurrency;

      const investedValueArs = positionCurrency === 'USD' ? invested * usdArsRate : invested;
      const currentValueRaw = pos.quantity * currentPrice;
      const currentValueArs = marketCurrency === 'USD' ? currentValueRaw * usdArsRate : currentValueRaw;
      const currentPriceArs = marketCurrency === 'USD' ? currentPrice * usdArsRate : currentPrice;
      const gainLossValueArs = currentValueArs - investedValueArs;

      totalInvested += investedValueArs;
      totalCurrentValue += currentValueArs;

      const totalGainPercent = investedValueArs > 0
        ? ((currentValueArs / investedValueArs) - 1) * 100
        : 0;

      if (!quote) {
        warnings.push(`Sin cotización viva de Yahoo para ${pos.asset.symbol}; se muestra el último precio cargado.`);
      }

      return {
        id: pos.id as string,
        ticker: pos.asset.symbol as string,
        name: pos.asset.name as string,
        type: mapDbAssetTypeToUi(pos.asset.type),
        quantity: pos.quantity as number,
        avgBuyPrice: pos.avgPrice as number,
        currentPrice: currentPrice as number,
        currency: marketCurrency as 'ARS' | 'USD',
        dailyChangePercent: (quote?.changePercent ?? 0) as number,
        totalGainPercent: totalGainPercent as number,
        investedValueArs,
        currentPriceArs,
        currentValueArs,
        gainLossValueArs,
      };
    });

    const totalGainLoss = totalCurrentValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    if (gainLossPercent > 500) {
      warnings.push("Rendimiento total inusualmente alto (>500%). Revisá tus precios de compra.");
    }

    // Detectar activos individuales con ganancias absurdas (>1000%)
    mappedAssets.forEach((a: any) => {
      if (a.totalGainPercent > 1000) {
        warnings.push(`El activo ${a.ticker} muestra una ganancia de +${a.totalGainPercent.toFixed(0)}%. Posible error en precio promedio.`);
      }
    });

    const maxMarketTime = quoteEntries.length > 0
      ? Math.max(...quoteEntries.map(([_, q]) => q?.marketTime ?? 0))
      : 0;

    const lastMarketUpdate = maxMarketTime > 0
      ? new Date(maxMarketTime).toISOString()
      : new Date().toISOString();

    return {
      userId,
      liquidityARS,
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      gainLossPercent,
      assets: mappedAssets,
      lastMarketUpdate,
      usdArsRate,
      warnings
    };
  } catch (error) {
    console.error('[PortfolioService] getPortfolio failed:', error);
    throw error;
  }
}

export async function getRecentOrders(
  userId: string,
  limit: number = 5
): Promise<Order[]> {
  try {
    const transactions = await db.transaction.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { date: 'desc' },
      take: limit
    });

    return transactions.map((t: any) => ({
      id: t.id,
      type: t.type as 'BUY' | 'SELL',
      ticker: t.asset?.symbol || 'N/A',
      quantity: t.quantity || 0,
      pricePerUnit: t.price || 0,
      totalAmount: t.total,
      status: 'COMPLETED',
      createdAt: t.date,
    }));
  } catch (error) {
    console.error('[PortfolioService] getRecentOrders failed:', error);
    throw error;
  }
}

export async function getAgentContext(userId: string): Promise<AgentContext> {
  const [portfolio, recentOrders] = await Promise.all([
    getPortfolio(userId),
    getRecentOrders(userId),
  ]);
  return { portfolio, recentOrders };
}

export async function executeOrder(
  userId: string,
  ticker: string,
  quantity: number,
  pricePerUnit: number,
  type: 'BUY' | 'SELL',
  assetType?: 'CEDEAR' | 'ACCION' | 'BONO' | 'ETF' | 'OTRO'
): Promise<{ success: boolean; updatedPortfolio: Portfolio; order: Order }> {
  try {
    // 1. Obtener o crear el activo en la DB
    const cleanTicker = ticker.toUpperCase().trim();
    const dbTypeMap: Record<string, any> = {
      CEDEAR: 'CEDEAR',
      ACCION: 'STOCK',
      BONO: 'BOND',
      ETF: 'ETF',
      OTRO: 'STOCK',
    };
    const storedSymbol = resolveAssetStorageSymbol(cleanTicker, assetType);
    const quoteMarket = resolvePreferredQuoteMarket(cleanTicker, assetType);
    let asset = await db.asset.findUnique({
      where: { symbol: storedSymbol }
    });

    const yahooSymbol = quoteMarket === 'local' ? toBCBASymbol(cleanTicker) : cleanTicker;

    if (!asset) {
      console.log(`[PortfolioService] Creando nuevo activo: ${cleanTicker}`);
      const dbType = dbTypeMap[assetType || 'OTRO'] || 'STOCK';

      asset = await db.asset.create({
        data: {
          symbol: storedSymbol,
          name: cleanTicker,
          type: dbType,
          market: 'BCBA', // Por defecto mercado argentino
          currency: quoteMarket === 'local' ? 'ARS' : 'USD',
          yahooSymbol: yahooSymbol
        }
      });
    } else {
      const desiredType = dbTypeMap[assetType || 'OTRO'] || asset.type;
      const nextYahooSymbol = asset.yahooSymbol ?? yahooSymbol;

      if (asset.type !== desiredType || asset.yahooSymbol !== nextYahooSymbol) {
        asset = await db.asset.update({
          where: { id: asset.id },
          data: {
            type: desiredType,
            yahooSymbol: nextYahooSymbol,
            currency: quoteMarket === 'local' ? 'ARS' : 'USD',
          },
        });
      }
    }

    // 2. Registrar la transacción
    const totalAmount = quantity * pricePerUnit;
    const transaction = await db.transaction.create({
      data: {
        userId,
        assetId: asset.id,
        type: type === 'BUY' ? 'BUY' : 'SELL',
        quantity,
        price: pricePerUnit,
        total: totalAmount,
        currency: quoteMarket === 'local' ? 'ARS' : 'USD',
        date: new Date(),
        source: 'MANUAL'
      }
    });

    // 3. Actualizar la posición del usuario
    const existingPosition = await db.position.findUnique({
      where: { userId_assetId: { userId, assetId: asset.id } }
    });

    if (type === 'BUY') {
      if (existingPosition) {
        // Promediamos el precio de compra
        const newQuantity = existingPosition.quantity + quantity;
        const newAvgPrice = ((existingPosition.quantity * existingPosition.avgPrice) + (quantity * pricePerUnit)) / newQuantity;

        await db.position.update({
          where: { id: existingPosition.id },
          data: { quantity: newQuantity, avgPrice: newAvgPrice }
        });
      } else {
        await db.position.create({
          data: {
            userId,
            assetId: asset.id,
            quantity,
            avgPrice: pricePerUnit,
            currency: quoteMarket === 'local' ? 'ARS' : 'USD'
          }
        });
      }
    } else {
      // Venta
      if (!existingPosition || existingPosition.quantity < quantity) {
        throw new Error('Cantidad insuficiente para vender');
      }

      const newQuantity = existingPosition.quantity - quantity;
      if (newQuantity === 0) {
        await db.position.delete({ where: { id: existingPosition.id } });
      } else {
        await db.position.update({
          where: { id: existingPosition.id },
          data: { quantity: newQuantity }
        });
      }
    }

    // 4. Actualizar CashBalance (Pesos)
    const cashBalance = await db.cashBalance.findUnique({
      where: { userId_currency: { userId, currency: 'ARS' } }
    });

    if (cashBalance) {
      await db.cashBalance.update({
        where: { id: cashBalance.id },
        data: {
          amount: type === 'BUY'
            ? cashBalance.amount - totalAmount
            : cashBalance.amount + totalAmount
        }
      });
    }

    const updatedPortfolio = await getPortfolio(userId);
    const newOrder: Order = {
      id: transaction.id,
      type: type as 'BUY' | 'SELL',
      ticker,
      quantity,
      pricePerUnit,
      totalAmount,
      status: 'COMPLETED',
      createdAt: transaction.date,
    };

    return { success: true, updatedPortfolio, order: newOrder };
  } catch (error) {
    console.error('[PortfolioService] executeOrder failed:', error);
    throw error;
  }
}
