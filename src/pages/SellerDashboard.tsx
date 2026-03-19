import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import NotebookSystem from "@/components/seller/NotebookSystem";
import {
  useSellerProfiles, useSales, useFeedbacks, useIdleLogs, useCalls,
  getSellerRankingFromData, getIdleSummaryFromData, parseList,
} from "@/hooks/useDashboardData";
import { type AppUser } from "@/contexts/AuthContext";
import SettingsPage from "@/pages/SettingsPage";
import { ShoppingCart, Trophy, Phone, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function SellerOverview({ user }: { user: AppUser }) {
  const { data: sellers = [] } = useSellerProfiles();
  const { data: allSales = [] } = useSales();
  const { data: feedbacks = [] } = useFeedbacks(user.id);
  const { data: idleLogs = [] } = useIdleLogs(user.id);

  const mySales = allSales.filter(s => s.user_id === user.id);
  const ranking = getSellerRankingFromData(allSales, sellers);
  const position = ranking.findIndex(r => r.id === user.id) + 1;
  const totalSellers = ranking.length;

  const idleSummary = getIdleSummaryFromData(idleLogs, sellers.filter(s => s.user_id === user.id));
  const myIdle = idleSummary[0];

  // Parse strengths/weaknesses from all feedbacks
  const allStrengths = feedbacks.flatMap(f => parseList(f.strengths));
  const allWeaknesses = feedbacks.flatMap(f => parseList(f.weaknesses));

  const strengthCounts = Object.entries(
    allStrengths.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const weaknessCounts = Object.entries(
    allWeaknesses.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Minhas Vendas" value={mySales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Posição no Ranking" value={position > 0 ? `${position}º de ${totalSellers}` : "—"} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Ligações Analisadas" value={feedbacks.length} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Tempo Ocioso Hoje" value={`${myIdle?.totalIdleMinutes || 0}min`} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pontos Fortes</h3>
          <div className="space-y-2">
            {strengthCounts.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda</p>}
            {strengthCounts.slice(0, 5).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s}</span>
                <span className="text-xs font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">{count}x</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Pontos a Melhorar</h3>
          <div className="space-y-2">
            {weaknessCounts.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda</p>}
            {weaknessCounts.slice(0, 5).map(([s, count]) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s}</span>
                <span className="text-xs font-mono text-warning bg-warning/10 px-2 py-0.5 rounded-full">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SellerFeedbacks({ user }: { user: AppUser }) {
  const { data: feedbacks = [] } = useFeedbacks(user.id);

  return (
    <div className="space-y-3">
      {feedbacks.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">Nenhum feedback disponível ainda</div>
      )}
      {feedbacks.map(fb => {
        const strengths = parseList(fb.strengths);
        const weaknesses = parseList(fb.weaknesses);
        return (
          <div key={fb.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
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
                <h4 className="text-xs font-semibold text-success mb-1.5">Pontos Fortes</h4>
                <ul className="space-y-1">
                  {strengths.map(s => (
                    <li key={s} className="text-xs text-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-success" />{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-warning mb-1.5">Pontos a Melhorar</h4>
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
  );
}

function SellerRanking({ user }: { user: AppUser }) {
  const { data: sellers = [] } = useSellerProfiles();
  const { data: allSales = [] } = useSales();

  const ranking = getSellerRankingFromData(allSales, sellers);
  const position = ranking.findIndex(r => r.id === user.id) + 1;
  const totalSellers = ranking.length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard label="Posição Atual" value={position > 0 ? `${position}º` : "—"} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Total de Vendedores" value={totalSellers} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="glass-card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            Ranking Geral
          </h3>
        </div>
        <div className="divide-y divide-border">
          {ranking.map((seller, index) => (
            <div
              key={seller.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3 transition-colors",
                seller.id === user.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <span className={cn(
                "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
                index === 0 ? "bg-warning/20 text-warning" :
                index === 1 ? "bg-muted text-muted-foreground" :
                index === 2 ? "bg-warning/10 text-warning/70" :
                "bg-secondary text-secondary-foreground"
              )}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {seller.id === user.id ? `${seller.name} (Você)` : seller.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboard({ user, onLogout }: SellerDashboardProps) {
  return (
    <Routes>
      <Route index element={
        <DashboardLayout user={user} onLogout={onLogout} title="Meu Painel" subtitle="Visão geral do seu desempenho">
          <SellerOverview user={user} />
        </DashboardLayout>
      } />
      <Route path="feedbacks" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Feedbacks" subtitle="Feedbacks das suas ligações">
          <SellerFeedbacks user={user} />
        </DashboardLayout>
      } />
      <Route path="ranking" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Ranking" subtitle="Sua posição no ranking">
          <SellerRanking user={user} />
        </DashboardLayout>
      } />
      <Route path="notes" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Anotações" subtitle="Seus cadernos de anotações">
          <NotebookSystem />
        </DashboardLayout>
      } />
      <Route path="settings" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Configurações" subtitle="Preferências do sistema">
          <SettingsPage />
        </DashboardLayout>
      } />
    </Routes>
  );
}