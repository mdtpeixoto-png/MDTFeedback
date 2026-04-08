import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdleLogSummary {
  sellerId: number | string;
  sellerName: string;
  totalIdleMinutes: number;
  idlePeriods: number;
  daysSinceLastSale: number;
}

interface AlertPanelProps {
  idleLogs: IdleLogSummary[];
}

export default function AlertPanel({ idleLogs }: AlertPanelProps) {
  const sorted = [...idleLogs].sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Alertas Operacionais</h3>
      </div>
      <div className="divide-y divide-border">
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum alerta no momento</div>
        )}
        {sorted.map((log) => (
          <div key={log.sellerId} className="px-5 py-3 flex items-center gap-4">
            <div className={cn(
              "h-2 w-2 rounded-full",
              log.daysSinceLastSale >= 3 ? "bg-destructive animate-pulse" :
              log.daysSinceLastSale >= 1 ? "bg-warning" :
              "bg-success"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{log.sellerName}</p>
              <p className="text-xs text-muted-foreground">
                {log.daysSinceLastSale === 0
                  ? "Vendeu hoje"
                  : `${log.daysSinceLastSale} dia(s) sem vender`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{log.totalIdleMinutes}min ocioso</span>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {log.idlePeriods}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
