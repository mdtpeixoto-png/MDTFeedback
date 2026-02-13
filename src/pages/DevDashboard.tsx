import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesLineChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import {
  User, mockUsers, mockSales, mockFeedbacks, mockIdleLogs,
  getSellerRanking, getSalesByWeekAndPeriod, getAIMetrics,
} from "@/lib/mockData";
import { Database, Users, AlertTriangle, Cpu, ShoppingCart, Bug, BarChart3, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import SettingsPage from "@/pages/SettingsPage";

interface DevDashboardProps {
  user: User;
  onLogout: () => void;
}

function DevHome() {
  const ranking = getSellerRanking();
  const weeklyData = getSalesByWeekAndPeriod();
  const aiMetrics = getAIMetrics();
  const risksCount = mockIdleLogs.filter(l => l.daysSinceLastSale >= 3).length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Vendas" value={mockSales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Usuários" value={mockUsers.length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Erro IA" value={`${aiMetrics.errorRate}%`} icon={<Cpu className="h-5 w-5" />} trend={{ value: -0.5, label: "vs semana anterior" }} />
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
            {mockUsers.map(u => (
              <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 text-sm text-foreground font-medium">{u.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{u.email}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">{u.role}</span>
                </td>
                <td className="px-5 py-3 text-sm text-right font-mono text-foreground">
                  {u.role === 'seller' ? mockSales.filter(s => s.sellerId === u.id).length : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DevAIMetrics() {
  const { totalAnalyses, errorRate, tagDistribution, recentFailures } = getAIMetrics();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Análises" value={totalAnalyses} icon={<BarChart3 className="h-5 w-5" />} />
        <MetricCard label="Taxa de Erro" value={`${errorRate}%`} icon={<Cpu className="h-5 w-5" />} />
        <MetricCard label="Tags Processadas" value={tagDistribution.reduce((s, t) => s + t.count, 0)} icon={<Tag className="h-5 w-5" />} />
        <MetricCard label="Falhas Recentes" value={recentFailures.length} icon={<Bug className="h-5 w-5" />} />
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
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(t.count / totalAnalyses) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">{t.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Bug className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Falhas Recentes da IA</h3>
          </div>
          <div className="divide-y divide-border">
            {recentFailures.map(f => (
              <div key={f.id} className="px-5 py-3 flex items-center gap-4">
                <span className="text-xs font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded">{f.type}</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{f.message}</p>
                  <p className="text-xs text-muted-foreground font-mono">{f.endpoint} — {f.date}</p>
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
  const riskyLogs = [...mockIdleLogs].sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Vendedores em Risco" value={mockIdleLogs.filter(l => l.daysSinceLastSale >= 3).length} icon={<AlertTriangle className="h-5 w-5" />} />
        <MetricCard label="Ociosidade Média" value={`${Math.round(mockIdleLogs.reduce((s, l) => s + l.totalIdleMinutes, 0) / mockIdleLogs.length)}min`} icon={<Cpu className="h-5 w-5" />} />
        <MetricCard label="Alertas Ativos" value={mockIdleLogs.filter(l => l.daysSinceLastSale >= 1).length} icon={<Bug className="h-5 w-5" />} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Riscos Operacionais</h3>
        </div>
        <div className="divide-y divide-border">
          {riskyLogs.map(log => (
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
