import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
})

export function formatARS(value: number) {
  const formatted = arsFormatter.format(Math.abs(value))
  return value < 0 ? `-${formatted}` : formatted
}

export function formatPercent(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0
  return `${safeValue.toFixed(2)}%`
}
