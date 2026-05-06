"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Asset } from "@/lib/types/portfolio"
import { updatePosition } from "@/lib/services/actions.service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  quantity: z.coerce.number().finite("La cantidad debe ser válida").min(0, "La cantidad no puede ser negativa"),
  avgPrice: z.coerce.number().finite("El precio promedio debe ser válido").min(0, "El precio no puede ser negativo"),
  assetType: z.enum(["CEDEAR", "ACCION", "BONO", "ETF"]),
})

type EditPositionDialogProps = {
  userId: string
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPositionDialog({
  userId,
  asset,
  open,
  onOpenChange,
}: EditPositionDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      quantity: asset?.quantity ?? 0,
      avgPrice: asset?.avgBuyPrice ?? 0,
      assetType: (asset?.type ?? "CEDEAR") as z.infer<typeof formSchema>["assetType"],
    },
  })

  React.useEffect(() => {
    if (open && asset) {
      form.reset({
        quantity: asset.quantity,
        avgPrice: asset.avgBuyPrice,
        assetType: (asset.type ?? "CEDEAR") as z.infer<typeof formSchema>["assetType"],
      })
    }
  }, [asset, form, open])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!asset) return

    const promise = updatePosition(userId, asset.id, values.quantity, values.avgPrice, values.assetType)

    toast.promise(promise, {
      loading: "Actualizando posición...",
      success: "Posición actualizada",
      error: "No se pudo actualizar la posición",
    })

    const result = await promise
    if (result.success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar posición</DialogTitle>
          <DialogDescription>
            Ajustá la tenencia del usuario sin cambiar el instrumento de mercado.
          </DialogDescription>
        </DialogHeader>

        {asset ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Activo
                </div>
                <div className="mt-1 font-semibold text-foreground">{asset.ticker}</div>
                <div className="text-xs text-muted-foreground">{asset.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avgPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio promedio</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegí una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CEDEAR">CEDEAR</SelectItem>
                        <SelectItem value="ACCION">Acción</SelectItem>
                        <SelectItem value="BONO">Bono</SelectItem>
                        <SelectItem value="ETF">ETF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}