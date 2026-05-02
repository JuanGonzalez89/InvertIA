import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import type { BaseCurrency, InvestorType } from "@prisma/client";

type AppUser = {
  id: string;
  externalAuthId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  investorType: InvestorType;
  baseCurrency: BaseCurrency;
  phone?: string | null;
  country?: string | null;
  cbu?: string | null;
};

export type DbUser = Awaited<ReturnType<typeof syncCurrentUserWithDatabase>>;

function buildFallbackUser(user: Awaited<ReturnType<typeof currentUser>>): AppUser {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario InvertIA";
  const email = user?.emailAddresses[0]?.emailAddress || `${user?.id ?? "clerk"}@clerk.local`;

  return {
    id: user?.id ?? "clerk-user",
    externalAuthId: user?.id ?? "clerk-user",
    name,
    email,
    avatarUrl: user?.imageUrl ?? null,
    investorType: "MODERADO",
    baseCurrency: "ARS",
    phone: null,
    country: null,
    cbu: null,
  };
}

export const getCurrentUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const fallbackUser = buildFallbackUser(user);

  try {
    return await syncCurrentUserWithDatabase();
  } catch (error) {
    console.error("Error al obtener o sincronizar usuario con Prisma:", error);
    return fallbackUser;
  }
};

export async function syncCurrentUserWithDatabase() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const fallbackUser = buildFallbackUser(user);

  const byExternalId = await db.user.findUnique({
    where: { externalAuthId: user.id },
  });

  if (byExternalId) {
    return byExternalId;
  }

  const byEmail = await db.user.findUnique({
    where: { email: fallbackUser.email },
  });

  if (byEmail) {
    return await db.user.update({
      where: { id: byEmail.id },
      data: {
        externalAuthId: user.id,
        name: fallbackUser.name,
        avatarUrl: user.imageUrl,
      },
    });
  }

  return await db.user.create({
    data: {
      externalAuthId: user.id,
      name: fallbackUser.name,
      email: fallbackUser.email,
      avatarUrl: user.imageUrl,
    },
  });
}
