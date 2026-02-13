import { useParams, Link } from "react-router-dom";
import MetricCard from "@/components/dashboard/MetricCard";
import {
  mockUsers, mockSales, mockFeedbacks, mockIdleLogs,
  getSalesBySeller, getSellerPosition, getSellerRanking,
} from "@/lib/mockData";
import { ShoppingCart, Trophy, Phone, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminSellerDetail() {
  const { id } = useParams<{ id: string }>();
  const seller = mockUsers.find(u => u.id === id);

  if (!seller) {
    return <div className="text-muted-foreground">Vendedor não encontrado.</div>;
  }

  const sales = getSalesBySeller(seller.id);
  const position = getSellerPosition(seller.id);
  const totalSellers = getSellerRanking().length;
  const feedbacks = mockFeedbacks.filter(f => f.sellerId === seller.id);
  const idleLog = mockIdleLogs.find(l => l.sellerId === seller.id);

  const allStrengths = feedbacks.flatMap(f => f.strengths);
  const allWeaknesses = feedbacks.flatMap(f => f.weaknesses);
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
        <MetricCard label="Vendas" value={sales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Posição" value={`${position}º de ${totalSellers}`} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Ligações" value={feedbacks.length} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Dias s/ Venda" value={idleLog?.daysSinceLastSale || 0} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-foreground mb-3">Pontos Fortes</h4>
          <div className="space-y-2">
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
            {weaknessCounts.slice(0, 5).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s}</span>
                <span className="text-xs font-mono text-warning bg-warning/10 px-2 py-0.5 rounded-full">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-foreground mb-3">Tempo Ocioso</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Total ocioso: <span className="text-foreground font-mono">{idleLog?.totalIdleMinutes || 0} min</span></p>
          <p>Períodos ociosos: <span className="text-foreground font-mono">{idleLog?.idlePeriods || 0}x</span></p>
        </div>
      </div>
    </div>
  );
}
