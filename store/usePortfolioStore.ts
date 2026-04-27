// store/usePortfolioStore.ts
// Zustand SOLO maneja el estado de UI en el cliente.
// Los datos financieros reales vienen del servidor (portfolio.service.ts).
// Este store actúa como caché local de la última respuesta del servidor.

import { create } from 'zustand';
import type { Portfolio, Order } from '@/lib/types/portfolio';
import { getPortfolio } from '@/lib/services/portfolio.service';

interface PortfolioUIState {
  // Caché del lado del cliente
  portfolio: Portfolio | null;
  recentOrders: Order[];
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchPortfolio: (userId: string) => Promise<void>;
  setPortfolio: (portfolio: Portfolio) => void;
  addOrder: (order: Order) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePortfolioStore = create<PortfolioUIState>((set) => ({
  portfolio: null,
  recentOrders: [],
  isLoading: false,
  error: null,

  fetchPortfolio: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const portfolio = await getPortfolio(userId);
      set({ portfolio, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setPortfolio: (portfolio) => set({ portfolio }),
  addOrder: (order) =>
    set((state) => ({ recentOrders: [order, ...state.recentOrders] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
