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
