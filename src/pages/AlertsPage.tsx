import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockIdleLogs } from "@/lib/mockData";

export default function AlertsPage() {
  // Sort by days since last sale descending (longest without sale first)
  const sorted = [...mockIdleLogs].sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Alertas Operacionais</h3>
        <span className="ml-auto text-xs text-muted-foreground">{sorted.length} vendedores</span>
      </div>
      <div className="divide-y divide-border">
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum alerta no momento</div>
        )}
        {sorted.map((log, index) => (
          <div key={log.sellerId} className="px-5 py-4 flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground w-6">{index + 1}.</span>
            <div className={cn(
              "h-2.5 w-2.5 rounded-full shrink-0",
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
              {log.idlePeriods}x pausas
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
