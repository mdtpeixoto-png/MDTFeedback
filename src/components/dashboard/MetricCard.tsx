import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}

export default function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("glass-card p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value mt-1 text-foreground">{value}</p>
        </div>
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-3 text-xs">
          {trend.value > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={cn(
            "font-medium",
            trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
