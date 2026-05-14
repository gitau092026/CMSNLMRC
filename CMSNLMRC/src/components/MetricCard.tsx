import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success";
  trend?: string;
  trendUp?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  trend,
  trendUp,
}: MetricCardProps) {
  const gradientClass = variant === "success" ? "bg-gradient-card-accent-success" : "bg-gradient-card-accent-primary";
  const iconBgClass = variant === "success" ? "bg-success" : "bg-primary";

  return (
    <Card className="relative overflow-hidden border-border hover:shadow-lg transition-shadow">
      <div className={cn("absolute top-0 left-0 right-0 h-1", gradientClass)} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={cn("text-sm font-medium mt-2", trendUp ? "text-success" : "text-muted-foreground")}>
                {trendUp && "↑ "}{trend}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-full", iconBgClass)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
