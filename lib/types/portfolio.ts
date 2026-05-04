// lib/types/portfolio.ts
// Este archivo es el "contrato" de toda la app.
// Si el modelo de datos cambia, se cambia acá y TypeScript
// te avisa en todos los lugares donde rompió.

export type AssetType = 'CEDEAR' | 'BONO' | 'ACCION' | 'ETF';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  quantity: number;
  avgBuyPrice: number;    // Precio promedio de compra
  currentPrice: number;   // Precio actual (lo llenará el MCP en Fase 4)
  currency: 'ARS' | 'USD'; // Moneda del activo (CEDEARs y BCBA locales = ARS, Bonos USD = USD)
  dailyChangePercent: number;
  totalGainPercent: number;
  sparkline?: number[];
}

export interface Portfolio {
  userId: string;
  assets: Asset[];
  liquidityARS: number;   // Pesos disponibles
  totalInvested: number;  // Calculado
  totalCurrentValue: number; // Calculado
  totalGainLoss: number;  // Calculado
  gainLossPercent: number; // Calculado
  lastMarketUpdate?: string; // ISO String o descripción del estado
  warnings?: string[]; // Advertencias sobre los datos (ej: rendimientos absurdos)
}

export interface Order {
  id: string;
  type: 'BUY' | 'SELL';
  ticker: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  createdAt: Date;
}

// Este tipo es lo que el Agente de IA va a recibir como "contexto"
// para saber el estado del usuario antes de responder.
export interface AgentContext {
  portfolio: Portfolio;
  recentOrders: Order[];
}
