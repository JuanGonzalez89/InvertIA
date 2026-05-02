import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface DataErrorStateProps {
  title?: string;
  description?: string;
}

export function DataErrorState({
  title = "No pudimos cargar tus datos",
  description = "Tu sesion esta activa, pero hubo un problema al sincronizar con la base de datos.",
}: DataErrorStateProps) {
  return (
    <section className="rounded-xl border border-destructive/30 bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reintentar
            </Link>
            <Link
              href="/chat"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium text-foreground hover:bg-secondary"
            >
              Ir al chat
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
