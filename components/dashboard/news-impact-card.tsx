'use client';

import { cn } from "@/lib/utils";
import { ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";

type Impact = "Bullish" | "Bearish" | "Neutral";

interface NewsImpactCardProps {
  title: string;
  summary: string;
  impact: Impact;
  impactReason: string;
  source?: string | null;
  publishedAt?: string | null;
  link?: string | null;
}

export function NewsImpactCard({
  title,
  summary,
  impact,
  impactReason,
  source,
  publishedAt,
  link,
}: NewsImpactCardProps) {
  const impactConfig = {
    Bullish: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Alcista",
    },
    Bearish: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: <TrendingDown className="h-4 w-4" />,
      label: "Bajista",
    },
    Neutral: {
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/20",
      icon: <Minus className="h-4 w-4" />,
      label: "Neutral",
    },
  }[impact];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
      {/* Indicador de impacto IA */}
      <div className={cn("absolute inset-y-0 left-0 w-1", impactConfig.bg)} />
      
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="font-bold text-foreground/70">{source || "Mercado"}</span>
              {publishedAt && (
                <>
                  <span className="opacity-40">•</span>
                  <span>{new Date(publishedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                </>
              )}
            </div>
            
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-tighter",
              impactConfig.bg,
              impactConfig.color,
              "border", impactConfig.border
            )}>
              {impactConfig.icon}
              {impactConfig.label}
            </div>
          </div>

          {/* Title Section */}
          <div className="space-y-1.5">
            <a 
              href={link || "#"} 
              target="_blank" 
              rel="noreferrer"
              className="group/link block"
            >
              <h3 className="text-sm font-semibold leading-tight text-foreground decoration-primary/30 underline-offset-4 group-hover/link:text-primary group-hover/link:underline sm:text-base">
                {title}
                <ExternalLink className="ml-1 inline-block h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-100" />
              </h3>
            </a>
          </div>

          {/* AI Insight Box (Premium Glassmorphism) */}
          <div className="relative space-y-2 rounded-lg border border-border/50 bg-secondary/15 p-3">
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-foreground/90">
                {summary}
              </p>
              <div className="pt-2 border-t border-border/20">
                <p className={cn("text-[11px] font-medium italic leading-tight", impactConfig.color)}>
                  {impactReason}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
