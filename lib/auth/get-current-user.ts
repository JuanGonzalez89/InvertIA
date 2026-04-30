import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const getCurrentUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    // Buscamos si el usuario ya existe en nuestra base de datos (Prisma)
    const existingUser = await db.user.findUnique({
      where: {
        externalAuthId: user.id
      }
    });

    if (existingUser) {
      return existingUser;
    }

    // Si el usuario no existe, lo insertamos en la BD de Prisma
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || 'Usuario InvertIA';
    const email = user.emailAddresses[0]?.emailAddress || '';

    const newUser = await db.user.create({
      data: {
        externalAuthId: user.id,
        name: name,
        email: email,
        avatarUrl: user.imageUrl,
      }
    });

    return newUser;

  } catch (error) {
    console.error("Error al obtener o registrar el usuario:", error);
    return null;
  }
};
