import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger";
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const variantConfig = {
  primary: {
    bg: "from-blue-600 to-indigo-700",
    iconBg: "bg-white/20",
    accent: "bg-blue-200/30",
    glow: "shadow-blue-500/20",
  },
  success: {
    bg: "from-emerald-500 to-teal-600",
    iconBg: "bg-white/20",
    accent: "bg-emerald-200/30",
    glow: "shadow-emerald-500/20",
  },
  warning: {
    bg: "from-amber-500 to-orange-600",
    iconBg: "bg-white/20",
    accent: "bg-amber-200/30",
    glow: "shadow-amber-500/20",
  },
  danger: {
    bg: "from-rose-500 to-red-600",
    iconBg: "bg-white/20",
    accent: "bg-rose-200/30",
    glow: "shadow-rose-500/20",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  trend,
  trendUp,
  loading,
}: MetricCardProps) {
  const config = variantConfig[variant];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default",
      config.bg,
      config.glow
    )}>
      {/* Background decoration */}
      <div className={cn("absolute -top-4 -right-4 w-28 h-28 rounded-full opacity-20", config.accent)} />
      <div className={cn("absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-10", config.accent)} />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">{title}</p>
          <div className={cn("p-2.5 rounded-xl backdrop-blur-sm", config.iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-24 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        ) : (
          <>
            <p className="text-4xl font-extrabold text-white tracking-tight leading-none mb-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-white/70 text-sm font-medium mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-xs font-semibold",
                trendUp ? "bg-white/20 text-white" : "bg-black/20 text-white/80"
              )}>
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
