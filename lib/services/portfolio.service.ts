// lib/services/portfolio.service.ts
// Capa de servicios: hoy devuelve mock data.
// En Fase 4, estas funciones llamarán al MCP/DB real.
// El resto de la app nunca sabe de dónde vienen los datos.

'use server';

import { db } from '@/lib/prisma';
import type { Portfolio, Order, AgentContext } from '@/lib/types/portfolio';

// --- Mock Data privada (no se exporta, solo la usan las funciones) ---
const MOCK_PORTFOLIO: Portfolio = {
  userId: 'user_juan_ignacio',
  liquidityARS: 420000,
  totalInvested: 2450000,
  totalCurrentValue: 2780000,
  totalGainLoss: 330000,
  gainLossPercent: 13.46,
  assets: [
    {
      id: 'asset_1',
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      type: 'CEDEAR',
      quantity: 12,
      avgBuyPrice: 32000,
      currentPrice: 38500,
      dailyChangePercent: 4.8,
    },
    {
      id: 'asset_2',
      ticker: 'VIST',
      name: 'Vista Energy',
      type: 'CEDEAR',
      quantity: 50,
      avgBuyPrice: 8200,
      currentPrice: 9200,
      dailyChangePercent: 8.1,
    },
    {
      id: 'asset_3',
      ticker: 'URA',
      name: 'Global X Uranium ETF',
      type: 'ETF',
      quantity: 30,
      avgBuyPrice: 11000,
      currentPrice: 10800,
      dailyChangePercent: -1.2,
    },
    {
      id: 'asset_4',
      ticker: 'TX26',
      name: 'Bono CER TX26',
      type: 'BONO',
      quantity: 1000,
      avgBuyPrice: 950,
      currentPrice: 970,
      dailyChangePercent: 0.3,
    },
  ],
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'order_1',
    type: 'BUY',
    ticker: 'NVDA',
    quantity: 2,
    pricePerUnit: 38500,
    totalAmount: 77000,
    status: 'COMPLETED',
    createdAt: new Date('2026-04-24T14:30:00'),
  },
  {
    id: 'order_2',
    type: 'BUY',
    ticker: 'TX26',
    quantity: 500,
    pricePerUnit: 950,
    totalAmount: 475000,
    status: 'COMPLETED',
    createdAt: new Date('2026-04-20T10:00:00'),
  },
];

// --- Funciones de servicio públicas ---

export async function getPortfolio(userId: string): Promise<Portfolio> {
  // Obtenemos los balances de efectivo del usuario
  const cashBalances = await db.cashBalance.findMany({
    where: { userId }
  });

  // Asumimos ARS por defecto
  const liquidityARS = cashBalances.find((b: any) => b.currency === 'ARS')?.amount || 0;

  // Obtenemos sus posiciones actuales junto con la data del activo
  const positions = await db.position.findMany({
    where: { userId },
    include: { asset: true }
  });

  let totalInvested = 0;
  let totalCurrentValue = 0;

  const mappedAssets = positions.map((pos: any) => {
    const invested = pos.quantity * pos.avgPrice;
    
    // Para simplificar la demo en la Fase 3, asumimos que el precio actual
    // es un pseudo valor basado en el tipo de activo (mock factor), o su avgPrice
    // En la Fase 4 el MCP inyectará los precios reales de mercado
    const currentPrice = pos.avgPrice * (1 + (Math.random() * 0.1 - 0.03)); // +/- algo aleatorio de demo
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
      currentPrice: currentPrice,
      dailyChangePercent: ((currentPrice / pos.avgPrice) - 1) * 100
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
}

export async function getRecentOrders(
  userId: string,
  limit: number = 5
): Promise<Order[]> {
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
