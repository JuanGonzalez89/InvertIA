// lib/services/portfolio.service.ts
// Capa de servicios: hoy devuelve mock data.
// En Fase 4, estas funciones llamarán al MCP/DB real.
// El resto de la app nunca sabe de dónde vienen los datos.

'use server';

import { db } from '@/lib/prisma';
import type { Portfolio, Order, AgentContext } from '@/lib/types/portfolio';
import { QUOTE_FIELDS, toBCBASymbol, yahooFinance } from '@/lib/yahoo';

type FreshMarketQuoteSnapshot = {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  changePercent: number;
};

async function getFreshMarketQuote(symbol: string): Promise<FreshMarketQuoteSnapshot | null> {
  const candidate = toBCBASymbol(symbol);

  try {
    const quote = await yahooFinance.quote(candidate, { fields: QUOTE_FIELDS });

    if (!quote.regularMarketPrice) {
      return null;
    }

    return {
      ticker: candidate,
      name: quote.shortName ?? candidate,
      price: quote.regularMarketPrice,
      currency: candidate.endsWith('.BA') ? 'ARS' : quote.currency ?? 'ARS',
      changePercent: quote.regularMarketChangePercent ?? 0,
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

    // Separamos liquidez por moneda (por ahora retornamos ARS como principal)
    const liquidityARS = cashBalances.find((b: any) => b.currency === 'ARS')?.amount || 0;
    const liquidityUSD = cashBalances.find((b: any) => b.currency === 'USD')?.amount || 0;

    // Obtenemos sus posiciones actuales junto con la data del activo
    const positions = await db.position.findMany({
      where: { userId },
      include: { asset: true }
    });

    // Obtener precios para todas las posiciones
    const quoteEntries: Array<[string, FreshMarketQuoteSnapshot | null]> = await Promise.all(
      positions.map(async (pos: any) => {
        const quote = await getFreshMarketQuote(pos.asset.yahooSymbol || pos.asset.symbol);
        return [pos.id, quote];
      })
    );

    const quoteMap = new Map<string, FreshMarketQuoteSnapshot | null>(quoteEntries);
    let totalInvested = 0;
    let totalCurrentValue = 0;

    const mappedAssets = positions.map((pos: any) => {
      // Solo usamos cotización externa cuando viene en ARS; si no, preservamos el precio importado.
      const invested = pos.quantity * pos.avgPrice;
      const quote = quoteMap.get(pos.id);
      const externalPriceIsARS = quote?.currency === 'ARS';
      const currentPrice = externalPriceIsARS ? quote?.price ?? pos.avgPrice : pos.avgPrice;
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
          quote && externalPriceIsARS && pos.avgPrice > 0
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
  try {
    // 1. Obtener o crear el activo en la DB
    let asset = await db.asset.findUnique({
      where: { symbol: ticker.toUpperCase() }
    });

    if (!asset) {
      // Intentamos crear un activo genérico si no existe
      asset = await db.asset.create({
        data: {
          symbol: ticker.toUpperCase(),
          name: ticker.toUpperCase(),
          type: 'STOCK',
          market: 'BCBA',
          currency: 'ARS',
          yahooSymbol: ticker.toUpperCase() + '.BA'
        }
      });
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
        currency: 'ARS',
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
            currency: 'ARS'
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
