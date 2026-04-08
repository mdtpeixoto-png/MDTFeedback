import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFuncionarios, useLigacoes } from "@/hooks/useFuncionarios";

export default function AlertsPage() {
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes();

  const alerts = funcionarios.map(f => {
    const sellerSales = ligacoes.filter(l => l.vendedor_id === f.id && l.status);
    const lastSaleDate = sellerSales.length > 0
      ? new Date(sellerSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at)
      : null;
    const daysSinceLastSale = lastSaleDate
      ? Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const hoursSinceLastSale = lastSaleDate
      ? Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60))
      : null;

    return {
      sellerId: f.id,
      sellerName: f.nome_completo,
      daysSinceLastSale,
      hoursSinceLastSale,
      hasAnySale: sellerSales.length > 0,
    };
  }).sort((a, b) => (b.daysSinceLastSale ?? -1) - (a.daysSinceLastSale ?? -1));

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Alertas Operacionais</h3>
        <span className="ml-auto text-xs text-muted-foreground">{alerts.length} vendedores</span>
      </div>
      <div className="divide-y divide-border">
        {alerts.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum vendedor cadastrado</div>
        )}
        {alerts.map((log, index) => (
          <div key={log.sellerId} className="px-5 py-4 flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground w-6">{index + 1}.</span>
            <div className={cn(
              "h-2.5 w-2.5 rounded-full shrink-0",
              log.daysSinceLastSale === null ? "bg-muted-foreground" :
              log.daysSinceLastSale >= 3 ? "bg-destructive animate-pulse" :
              log.daysSinceLastSale >= 1 ? "bg-warning" :
              "bg-success"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{log.sellerName}</p>
              <p className="text-xs text-muted-foreground">
                {!log.hasAnySale
                  ? "Nenhuma venda registrada"
                  : log.daysSinceLastSale === 0
                    ? `Vendeu hoje (${log.hoursSinceLastSale}h atrás)`
                    : `${log.daysSinceLastSale} dia(s) sem vender`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{log.hasAnySale ? `${log.hoursSinceLastSale}h` : "0h"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
