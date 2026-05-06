// lib/services/actions.service.ts
'use server';

import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Elimina una posición (activo) específica de la cartera del usuario.
 */
export async function deletePosition(positionId: string) {
  try {
    await db.position.delete({
      where: { id: positionId }
    });
    revalidatePath('/cartera');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting position:', error);
    return { success: false, error: 'No se pudo eliminar el activo' };
  }
}

/**
 * Ajusta una posición específica de la cartera del usuario.
 */
export async function updatePosition(
  userId: string,
  positionId: string,
  quantity: number,
  avgPrice: number,
  assetType?: 'CEDEAR' | 'ACCION' | 'BONO' | 'ETF',
) {
  try {
    const currentPosition = await db.position.findFirst({
      where: { id: positionId, userId },
      include: { asset: true },
    });

    if (!currentPosition) {
      return { success: false, error: 'No se encontró la posición' };
    }

    if (quantity <= 0) {
      await db.position.delete({
        where: { id: positionId },
      });
    } else {
      await db.position.update({
        where: { id: positionId },
        data: {
          quantity,
          avgPrice,
        },
      });
    }

    if (assetType && currentPosition.asset) {
      const dbTypeMap: Record<string, any> = {
        CEDEAR: 'CEDEAR',
        ACCION: 'STOCK',
        BONO: 'BOND',
        ETF: 'ETF',
      }

      await db.asset.update({
        where: { id: currentPosition.asset.id },
        data: {
          type: dbTypeMap[assetType] ?? currentPosition.asset.type,
        },
      })
    }

    revalidatePath('/cartera');
    revalidatePath('/');
    revalidatePath('/movimientos');

    return { success: true };
  } catch (error) {
    console.error('Error updating position:', error);
    return { success: false, error: 'No se pudo actualizar el activo' };
  }
}

/**
 * Elimina un movimiento (transacción) específico.
 */
export async function deleteMovement(transactionId: string) {
  try {
    await db.transaction.delete({
      where: { id: transactionId }
    });
    revalidatePath('/movimientos');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting movement:', error);
    return { success: false, error: 'No se pudo eliminar el movimiento' };
  }
}

/**
 * Vacía completamente la cartera del usuario (posiciones y transacciones).
 * Opcionalmente también podría resetear balances de efectivo, pero por ahora solo activos.
 */
export async function clearPortfolio(userId: string) {
  try {
    await db.$transaction([
      db.position.deleteMany({ where: { userId } }),
      db.transaction.deleteMany({ where: { userId } })
    ]);
    revalidatePath('/cartera');
    revalidatePath('/movimientos');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error clearing portfolio:', error);
    return { success: false, error: 'No se pudo vaciar la cartera' };
  }
}
