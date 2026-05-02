import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getCurrentUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario InvertIA";
  const email = user.emailAddresses[0]?.emailAddress || `${user.id}@clerk.local`;

  try {
    // Camino principal: ya existe vinculado por externalAuthId
    const byExternalId = await db.user.findUnique({
      where: {
        externalAuthId: user.id,
      },
    });

    if (byExternalId) {
      return byExternalId;
    }

    // Caso de migracion: existe por email pero sin el externalAuthId actual
    const byEmail = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (byEmail) {
      return await db.user.update({
        where: { id: byEmail.id },
        data: {
          externalAuthId: user.id,
          name,
          avatarUrl: user.imageUrl,
        },
      });
    }

    // Alta inicial del usuario
    return await db.user.create({
      data: {
        externalAuthId: user.id,
        name,
        email,
        avatarUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Error al obtener o sincronizar usuario con Prisma:", error);
    throw new Error("USER_SYNC_FAILED");
  }
};
