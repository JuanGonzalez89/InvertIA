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
  twoFactorEnabled?: boolean;
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
    twoFactorEnabled: Boolean(user?.publicMetadata?.twoFactorEnabled),
  };
}

export const getCurrentUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const fallbackUser = buildFallbackUser(user);

  try {
    return await syncCurrentUserWithDatabase(user, fallbackUser);
  } catch (error) {
    console.error("Error al obtener o sincronizar usuario con Prisma:", error);
    return fallbackUser;
  }
};

export async function syncCurrentUserWithDatabase(
  user?: Awaited<ReturnType<typeof currentUser>>,
  fallbackUser?: AppUser,
) {
  const resolvedUser = user ?? await currentUser();

  if (!resolvedUser) {
    return null;
  }

  const resolvedFallbackUser = fallbackUser ?? buildFallbackUser(resolvedUser);

  const byExternalId = await db.user.findUnique({
    where: { externalAuthId: resolvedUser.id },
  });

  if (byExternalId) {
    return {
      ...byExternalId,
      twoFactorEnabled: Boolean(resolvedUser.publicMetadata?.twoFactorEnabled),
    };
  }

  const byEmail = await db.user.findUnique({
    where: { email: resolvedFallbackUser.email },
  });

  if (byEmail) {
    const updatedUser = await db.user.update({
      where: { id: byEmail.id },
      data: {
        externalAuthId: resolvedUser.id,
        name: resolvedFallbackUser.name,
        avatarUrl: resolvedUser.imageUrl,
      },
    });

    return {
      ...updatedUser,
      twoFactorEnabled: Boolean(resolvedUser.publicMetadata?.twoFactorEnabled),
    };
  }

  const createdUser = await db.user.create({
    data: {
      externalAuthId: resolvedUser.id,
      name: resolvedFallbackUser.name,
      email: resolvedFallbackUser.email,
      avatarUrl: resolvedUser.imageUrl,
    },
  });

  return {
    ...createdUser,
    twoFactorEnabled: Boolean(resolvedUser.publicMetadata?.twoFactorEnabled),
  };
}
