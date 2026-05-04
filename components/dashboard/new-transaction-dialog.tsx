'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { executeOrder } from '@/lib/services/portfolio.service';

const formSchema = z.object({
  ticker: z.string().min(1, "El ticker es obligatorio"),
  assetType: z.enum(['CEDEAR', 'ACCION', 'BONO', 'ETF', 'OTRO']),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  userId: z.string(),
});

export function NewTransactionDialog({ 
  userId, 
  defaultTicker = '', 
  trigger 
}: { 
  userId: string, 
  defaultTicker?: string,
  trigger?: React.ReactNode
}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticker: defaultTicker,
      assetType: 'CEDEAR',
      type: 'BUY',
      userId: userId,
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const promise = executeOrder(
        values.userId,
        values.ticker,
        values.quantity,
        values.price,
        values.type,
        values.assetType
      );

      toast.promise(promise, {
        loading: 'Registrando transacción...',
        success: 'Transacción registrada correctamente',
        error: (err) => err.message || 'Error al registrar la transacción',
      });

      const res = await promise;
      if (res.success) {
        form.reset({
          ticker: defaultTicker,
          quantity: 0,
          price: 0,
          type: 'BUY',
          userId: userId,
        });
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Transacción
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nueva transacción</DialogTitle>
          <DialogDescription>
            Añade una compra o venta a tu historial de movimientos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker (ej: AAPL, AL30)</FormLabel>
                    <FormControl>
                      <Input placeholder="AAPL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CEDEAR">CEDEAR</SelectItem>
                        <SelectItem value="ACCION">Acción</SelectItem>
                        <SelectItem value="BONO">Bono</SelectItem>
                        <SelectItem value="ETF">ETF</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BUY">Compra</SelectItem>
                        <SelectItem value="SELL">Venta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por unidad (ARS)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Guardar Transacción</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
