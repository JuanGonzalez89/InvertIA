export type PortfolioAssetType = 'CEDEAR' | 'ACCION' | 'BONO' | 'ETF' | 'OTRO'

const LOCAL_EQUITY_TICKERS = new Set([
  'GGAL',
  'VIST',
  'YPF',
  'PAMP',
  'BMA',
  'SUPV',
  'TGSU2',
  'TGNO4',
  'EDN',
  'ALUA',
  'CEPU',
  'LOMA',
  'CRES',
  'COME',
  'METR',
])

export function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase()
}

export function resolveAssetStorageSymbol(ticker: string, assetType?: PortfolioAssetType) {
  const cleaned = normalizeTicker(ticker)

  if (cleaned.includes('.')) {
    return cleaned
  }

  if (assetType === 'CEDEAR') {
    return `${cleaned}.BA`
  }

  return cleaned
}

export function resolvePreferredQuoteMarket(ticker: string, assetType?: PortfolioAssetType) {
  const cleaned = normalizeTicker(ticker)

  if (cleaned.includes('.BA')) {
    return 'local' as const
  }

  if (assetType === 'CEDEAR' || assetType === 'BONO' || assetType === 'ETF') {
    return 'local' as const
  }

  if (assetType === 'ACCION') {
    if (LOCAL_EQUITY_TICKERS.has(cleaned)) {
      return 'local' as const
    }

    return 'global' as const
  }

  return 'local' as const
}