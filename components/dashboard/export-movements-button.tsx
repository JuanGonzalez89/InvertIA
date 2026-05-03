'use client'

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatARS } from "@/lib/utils"
import type { Order } from "@/lib/types/portfolio"

function generateCSV(orders: Order[]) {
  const headers = ['Tipo', 'Ticker', 'Cantidad', 'Precio Unitario', 'Monto Total', 'Estado', 'Fecha']
  const rows = orders.map(order => [
    order.type === 'BUY' ? 'Compra' : 'Venta',
    order.ticker,
    order.quantity.toString(),
    formatARS(order.pricePerUnit),
    formatARS(order.totalAmount),
    order.status === 'COMPLETED' ? 'Completado' : order.status === 'PENDING' ? 'Pendiente' : 'Cancelado',
    order.createdAt instanceof Date 
      ? order.createdAt.toLocaleDateString('es-AR')
      : new Date(order.createdAt).toLocaleDateString('es-AR')
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
}

export function ExportMovementsButton({ orders }: { orders: Order[] }) {
  const handleExport = () => {
    const csv = generateCSV(orders)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `movimientos-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      size="sm"
      onClick={handleExport}
      className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
