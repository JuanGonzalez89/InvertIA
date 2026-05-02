import type { ReactNode } from "react";
import { Show } from "@clerk/nextjs";

interface SignedStateProps {
  children: ReactNode;
}

export async function SignedIn({ children }: SignedStateProps) {
  return <Show when="signed-in">{children}</Show>;
}

export async function SignedOut({ children }: SignedStateProps) {
  return <Show when="signed-out">{children}</Show>;
}
