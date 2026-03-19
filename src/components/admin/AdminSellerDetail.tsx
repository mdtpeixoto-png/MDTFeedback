import { useParams, Link } from "react-router-dom";
import MetricCard from "@/components/dashboard/MetricCard";
import {
  useSellerProfiles, useSales, useFeedbacks, useIdleLogs,
  getSellerRankingFromData, getIdleSummaryFromData, parseList,
} from "@/hooks/useDashboardData";
import { ShoppingCart, Trophy, Phone, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSellerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: sellers = [] } = useSellerProfiles();
  const { data: allSales = [] } = useSales();
  const { data: feedbacks = [] } = useFeedbacks(id);
  const { data: idleLogs = [] } = useIdleLogs(id);

  const seller = sellers.find(s => s.user_id === id);

  if (!seller) {
    return <div className="text-muted-foreground">Vendedor não encontrado.</div>;
  }

  const mySales = allSales.filter(s => s.user_id === id);
  const ranking = getSellerRankingFromData(allSales, sellers);
  const position = ranking.findIndex(r => r.id === id) + 1;
  const totalSellers = ranking.length;

  const idleSummary = getIdleSummaryFromData(idleLogs, [seller]);
  const myIdle = idleSummary[0];

  const allStrengths = feedbacks.flatMap(f => parseList(f.strengths));
  const allWeaknesses = feedbacks.flatMap(f => parseList(f.weaknesses));
  const strengthCounts = Object.entries(allStrengths.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1]);
  const weaknessCounts = Object.entries(allWeaknesses.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <Link to="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar para Vendedores
      </Link>

      <h3 className="text-lg font-bold text-foreground mb-4">{seller.name}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendas" value={mySales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Posição" value={position > 0 ? `${position}º de ${totalSellers}` : "—"} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Ligações" value={feedbacks.length} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Dias s/ Venda" value={myIdle?.daysSinceLastSale ?? 0} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">Pontos Fortes</h4>
          <div className="space-y-2">
            {strengthCounts.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            {strengthCounts.slice(0, 5).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s}</span>
                <span className="text-xs font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">{count}x</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">Pontos a Melhorar</h4>
          <div className="space-y-2">
            {weaknessCounts.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            {weaknessCounts.slice(0, 5).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s}</span>
                <span className="text-xs font-mono text-warning bg-warning/10 px-2 py-0.5 rounded-full">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5 mb-6">
        <h4 className="text-sm font-semibold text-foreground mb-3">Tempo Ocioso</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Total ocioso: <span className="text-foreground font-mono">{myIdle?.totalIdleMinutes ?? 0} min</span></p>
          <p>Períodos ociosos: <span className="text-foreground font-mono">{myIdle?.idlePeriods ?? 0}x</span></p>
          <p>Dias sem vender: <span className={cn(
            "font-mono text-xs px-2 py-0.5 rounded-full",
            (myIdle?.daysSinceLastSale ?? 0) >= 3 ? "bg-destructive/10 text-destructive" :
            (myIdle?.daysSinceLastSale ?? 0) >= 1 ? "bg-warning/10 text-warning" :
            "bg-success/10 text-success"
          )}>{myIdle?.daysSinceLastSale ?? 0}d</span></p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Feedbacks de Ligações</h4>
          <span className="ml-auto text-xs text-muted-foreground">{feedbacks.length} ligações</span>
        </div>
        <div className="divide-y divide-border">
          {feedbacks.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum feedback disponível</div>
          )}
          {feedbacks.map(fb => {
            const strengths = parseList(fb.strengths);
            const weaknesses = parseList(fb.weaknesses);
            return (
              <div key={fb.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString("pt-BR")}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      fb.tone === 'positive' ? "bg-success/10 text-success" :
                      fb.tone === 'negative' ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {fb.tone === 'positive' ? 'Positivo' : fb.tone === 'negative' ? 'Negativo' : 'Neutro'}
                    </span>
                    {fb.score && <span className="text-xs font-bold text-primary">{fb.score}/100</span>}
                  </div>
                </div>
                <p className="text-sm text-foreground mb-3">{fb.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-success mb-1">Pontos Fortes</h5>
                    <ul className="space-y-1">
                      {strengths.map(s => (
                        <li key={s} className="text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-success" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-warning mb-1">Pontos a Melhorar</h5>
                    <ul className="space-y-1">
                      {weaknesses.map(w => (
                        <li key={w} className="text-xs text-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-warning" />{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}