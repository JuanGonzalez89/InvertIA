// lib/services/portfolio.service.ts
// Capa de servicios: hoy devuelve mock data.
// En Fase 4, estas funciones llamarán al MCP/DB real.
// El resto de la app nunca sabe de dónde vienen los datos.

'use server';

import { db } from '@/lib/prisma';
import type { Portfolio, Order, AgentContext } from '@/lib/types/portfolio';
import { getMarketQuote } from './market.service';

// No demo mock data here — production should read from DB. Keep implementation minimal.

// --- Funciones de servicio públicas ---

export async function getPortfolio(userId: string): Promise<Portfolio> {
  try {
    // Obtenemos los balances de efectivo del usuario en todas las monedas
    const cashBalances = await db.cashBalance.findMany({
      where: { userId }
    });

    // Separamos liquidez por moneda (por ahora retornamos ARS como principal)
    const liquidityARS = cashBalances.find((b: any) => b.currency === 'ARS')?.amount || 0;
    const liquidityUSD = cashBalances.find((b: any) => b.currency === 'USD')?.amount || 0;

    // Obtenemos sus posiciones actuales junto con la data del activo
    const positions = await db.position.findMany({
      where: { userId },
      include: { asset: true }
    });

    // Obtener precios para todas las posiciones
    const quoteEntries = await Promise.all(
      positions.map(async (pos: any) => {
        const quote = await getMarketQuote(pos.asset.yahooSymbol || pos.asset.symbol);
        return [pos.id, quote] as const;
      })
    );

    const quoteMap = new Map(quoteEntries);
    let totalInvested = 0;
    let totalCurrentValue = 0;

    const mappedAssets = positions.map((pos: any) => {
      // Calcular valores: aquí asumimos que avgPrice está en la misma moneda que la posición
      const invested = pos.quantity * pos.avgPrice;
      const quote = quoteMap.get(pos.id);
      const currentPrice = quote?.price ?? pos.avgPrice;
      const currentValue = pos.quantity * currentPrice;

      totalInvested += invested;
      totalCurrentValue += currentValue;

      return {
        id: pos.id,
        ticker: pos.asset.symbol,
        name: pos.asset.name,
        type: pos.asset.type as any,
        quantity: pos.quantity,
        avgBuyPrice: pos.avgPrice,
        currentPrice,
        currency: pos.asset.currency,
        dailyChangePercent:
          quote && pos.avgPrice > 0
            ? ((currentPrice / pos.avgPrice) - 1) * 100
            : 0,
      };
    });

    const totalGainLoss = totalCurrentValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      userId,
      liquidityARS,
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      gainLossPercent,
      assets: mappedAssets
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
  type: 'BUY' | 'SELL'
): Promise<{ success: boolean; updatedPortfolio: Portfolio; order: Order }> {
  // TODO Fase 4: Llamar a la DB/MCP y persistir el cambio.
  const portfolio = await getPortfolio(userId);
  const totalAmount = quantity * pricePerUnit;

  if (type === 'BUY' && portfolio.liquidityARS < totalAmount) {
    throw new Error('Liquidez insuficiente para ejecutar la orden de compra.');
  }

  // Simulamos la actualización en memoria (en Fase 4 esto persiste en DB)
  const updatedPortfolio: Portfolio = {
    ...portfolio,
    liquidityARS: type === 'BUY'
      ? portfolio.liquidityARS - totalAmount
      : portfolio.liquidityARS + totalAmount,
  };

  const newOrder: Order = {
    id: `order_${Date.now()}`,
    type,
    ticker,
    quantity,
    pricePerUnit,
    totalAmount,
    status: 'COMPLETED',
    createdAt: new Date(),
  };

  console.log(`[PortfolioService] executeOrder: ${type} ${quantity} ${ticker}`);
  return { success: true, updatedPortfolio, order: newOrder };
}
