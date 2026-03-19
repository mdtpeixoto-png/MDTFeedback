import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesLineChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import {
  useSellerProfiles, useAllProfiles, useAllRoles, useSales, useFeedbacks,
  useIdleLogs, useAIErrors, useTags, useCallTags,
  getSellerRankingFromData, getSalesByWeekAndPeriodFromData, getIdleSummaryFromData,
} from "@/hooks/useDashboardData";
import { type AppUser } from "@/contexts/AuthContext";
import { Database, Users, AlertTriangle, Cpu, ShoppingCart, Bug, BarChart3, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import SettingsPage from "@/pages/SettingsPage";

interface DevDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function DevHome() {
  const { data: sellers = [] } = useSellerProfiles();
  const { data: allProfiles = [] } = useAllProfiles();
  const { data: sales = [] } = useSales();
  const { data: idleLogs = [] } = useIdleLogs();
  const { data: aiErrors = [] } = useAIErrors();

  const ranking = getSellerRankingFromData(sales, sellers);
  const weeklyData = getSalesByWeekAndPeriodFromData(sales);
  const idleSummary = getIdleSummaryFromData(idleLogs, sellers);
  const risksCount = idleSummary.filter(l => l.daysSinceLastSale >= 3).length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Vendas" value={sales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Usuários" value={allProfiles.length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Erros IA" value={aiErrors.length} icon={<Cpu className="h-5 w-5" />} />
        <MetricCard label="Riscos Ativos" value={risksCount} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SalesLineChart data={weeklyData} label="Vendas do Mês (por período)" />
        <RankingTable data={ranking} />
      </div>
    </>
  );
}

function DevUsers() {
  const { data: allProfiles = [] } = useAllProfiles();
  const { data: allRoles = [] } = useAllRoles();
  const { data: sales = [] } = useSales();

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Usuários do Sistema</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Nome</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Perfil</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Vendas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allProfiles.map(u => {
              const role = allRoles.find(r => r.user_id === u.user_id)?.role ?? "—";
              const userSales = sales.filter(s => s.user_id === u.user_id).length;
              return (
                <tr key={u.user_id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{role}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">
                    {role === 'seller' ? userSales : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DevAIMetrics() {
  const { data: feedbacks = [] } = useFeedbacks();
  const { data: aiErrors = [] } = useAIErrors();
  const { data: tags = [] } = useTags();
  const { data: callTags = [] } = useCallTags();

  const totalAnalyses = feedbacks.length;
  const errorRate = totalAnalyses > 0 ? ((aiErrors.length / totalAnalyses) * 100).toFixed(1) : "0";

  const tagDistribution = tags.map(tag => ({
    tag: tag.name,
    count: callTags.filter(ct => ct.tag_id === tag.id).length,
  })).sort((a, b) => b.count - a.count);

  const totalTags = tagDistribution.reduce((s, t) => s + t.count, 0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Análises" value={totalAnalyses} icon={<BarChart3 className="h-5 w-5" />} />
        <MetricCard label="Taxa de Erro" value={`${errorRate}%`} icon={<Cpu className="h-5 w-5" />} />
        <MetricCard label="Tags Processadas" value={totalTags} icon={<Tag className="h-5 w-5" />} />
        <MetricCard label="Falhas Recentes" value={aiErrors.length} icon={<Bug className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição de Tags</h3>
          <div className="space-y-2">
            {tagDistribution.map(t => (
              <div key={t.tag} className="flex items-center justify-between">
                <span className="text-sm text-foreground font-mono">{t.tag}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${totalAnalyses > 0 ? (t.count / totalAnalyses) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">{t.count}</span>
                </div>
              </div>
            ))}
            {tagDistribution.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tag registrada</p>}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Bug className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Falhas Recentes da IA</h3>
          </div>
          <div className="divide-y divide-border">
            {aiErrors.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum erro registrado</div>
            )}
            {aiErrors.map(f => (
              <div key={f.id} className="px-5 py-3 flex items-center gap-4">
                <span className="text-xs font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded">Error</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{f.error_message ?? "Erro desconhecido"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{new Date(f.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DevRisks() {
  const { data: sellers = [] } = useSellerProfiles();
  const { data: idleLogs = [] } = useIdleLogs();

  const idleSummary = getIdleSummaryFromData(idleLogs, sellers);
  const sorted = [...idleSummary].sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Vendedores em Risco" value={idleSummary.filter(l => l.daysSinceLastSale >= 3).length} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Ociosidade Média" value={`${idleSummary.length ? Math.round(idleSummary.reduce((s, l) => s + l.totalIdleMinutes, 0) / idleSummary.length) : 0}min`} icon={<Cpu className="h-5 w-5" />} />
        <MetricCard label="Alertas Ativos" value={idleSummary.filter(l => l.daysSinceLastSale >= 1).length} icon={<Bug className="h-5 w-5" />} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Riscos Operacionais</h3>
        </div>
        <div className="divide-y divide-border">
          {sorted.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum risco detectado</div>
          )}
          {sorted.map(log => (
            <div key={log.sellerId} className="px-5 py-3 flex items-center gap-4">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                log.daysSinceLastSale >= 3 ? "bg-destructive animate-pulse" :
                log.daysSinceLastSale >= 1 ? "bg-warning" : "bg-success"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{log.sellerName}</p>
                <p className="text-xs text-muted-foreground">
                  {log.daysSinceLastSale === 0 ? "Vendeu hoje" : `${log.daysSinceLastSale} dia(s) sem vender`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{log.totalIdleMinutes}min ocioso</span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{log.idlePeriods}x</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function DevDashboard({ user, onLogout }: DevDashboardProps) {
  return (
    <Routes>
      <Route index element={
        <DashboardLayout user={user} onLogout={onLogout} title="Painel do Desenvolvedor" subtitle="Visão global do sistema">
          <DevHome />
        </DashboardLayout>
      } />
      <Route path="users" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Usuários" subtitle="Gestão de usuários do sistema">
          <DevUsers />
        </DashboardLayout>
      } />
      <Route path="ai-metrics" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Métricas IA" subtitle="Monitoramento da inteligência artificial">
          <DevAIMetrics />
        </DashboardLayout>
      } />
      <Route path="risks" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Riscos" subtitle="Riscos operacionais detectados">
          <DevRisks />
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