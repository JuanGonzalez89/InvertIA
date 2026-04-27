// lib/services/portfolio.service.ts
// Capa de servicios: hoy devuelve mock data.
// En Fase 4, estas funciones llamarán al MCP/DB real.
// El resto de la app nunca sabe de dónde vienen los datos.

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
  // TODO Fase 4: return await mcpClient.getPortfolio(userId);
  console.log(`[PortfolioService] getPortfolio called for userId: ${userId}`);
  return MOCK_PORTFOLIO;
}

export async function getRecentOrders(
  userId: string,
  limit: number = 5
): Promise<Order[]> {
  // TODO Fase 4: return await mcpClient.getRecentOrders(userId, limit);
  return MOCK_ORDERS.slice(0, limit);
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
