import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart, ProductPieChart, SalesLineChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import { useFuncionarios, useLigacoes } from "@/hooks/useFuncionarios";
import { useAIErrors } from "@/hooks/useDashboardData";
import { type AppUser } from "@/contexts/AuthContext";
import { Database, Users, Phone, TrendingUp, Activity } from "lucide-react";
import SettingsPage from "@/pages/SettingsPage";
import AlertsPage from "@/pages/AlertsPage";

interface DevDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function getWeekOfMonth(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.min(Math.ceil(d.getDate() / 7), 4);
}

function getPeriodOfDay(dateStr: string): string {
  const h = new Date(dateStr).getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function DevHome() {
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes();
  const { data: aiErrors = [] } = useAIErrors();

  const sellerCount = funcionarios.length;
  const totalLigacoes = ligacoes.length;
  const totalSales = ligacoes.filter(l => l.status).length;

  // Ranking
  const ranking = funcionarios.map(f => {
    const sellerLigacoes = ligacoes.filter(l => l.vendedor_id === f.id);
    return {
      id: f.id,
      name: f.nome_completo,
      totalSales: sellerLigacoes.filter(l => l.status).length,
      totalValue: sellerLigacoes.reduce((sum, l) => sum + (l.receita ?? 0), 0),
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  // By operadora
  const operadoras = [...new Set(ligacoes.filter(l => l.operadora).map(l => l.operadora!))];
  const byProduct = operadoras.length > 0
    ? operadoras.map(op => ({ name: op, value: ligacoes.filter(l => l.operadora === op && l.status).length }))
    : [{ name: "Sem dados", value: 0 }];

  // By week & period
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const salesThisMonth = ligacoes.filter(l => {
    if (!l.status) return false;
    const d = new Date(l.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const byWeek = [1, 2, 3, 4].map(week => {
    const weekSales = salesThisMonth.filter(l => getWeekOfMonth(l.created_at) === week);
    return {
      name: `Semana ${week}`,
      Manhã: weekSales.filter(l => getPeriodOfDay(l.created_at) === "morning").length,
      Tarde: weekSales.filter(l => getPeriodOfDay(l.created_at) === "afternoon").length,
      Noite: weekSales.filter(l => getPeriodOfDay(l.created_at) === "evening").length,
    };
  });

  // Idle logs
  const idleLogs = funcionarios.map(f => {
    const sellerSales = ligacoes.filter(l => l.vendedor_id === f.id && l.status);
    const lastSaleDate = sellerSales.length > 0
      ? new Date(sellerSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at)
      : null;
    const daysSinceLastSale = lastSaleDate
      ? Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    return {
      sellerId: f.id,
      sellerName: f.nome_completo,
      totalIdleMinutes: 0,
      idlePeriods: 0,
      daysSinceLastSale,
    };
  });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendedores" value={sellerCount} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Total Ligações" value={totalLigacoes} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Total Vendas" value={totalSales} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Erros IA" value={aiErrors.length} icon={<Database className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProductPieChart data={byProduct} />
        <SalesLineChart data={byWeek} label="Vendas por Semana / Período (Mês Atual)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RankingTable data={ranking} />
        <AlertPanel idleLogs={idleLogs} />
      </div>

      {/* AI Error Logs */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Logs de Erros IA</h3>
        </div>
        <div className="divide-y divide-border">
          {aiErrors.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum erro registrado</div>
          )}
          {aiErrors.map(err => (
            <div key={err.id} className="px-5 py-3 flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{new Date(err.created_at).toLocaleDateString('pt-BR')}</span>
              <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded">Erro</span>
              <span className="text-sm text-foreground flex-1">{err.error_message ?? "Erro desconhecido"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DevUsers() {
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes();

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Funcionários</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Nome</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Vendas</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Receita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funcionarios.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum funcionário cadastrado</td></tr>
            )}
            {funcionarios.map(f => {
              const sellerLigacoes = ligacoes.filter(l => l.vendedor_id === f.id);
              return (
                <tr key={f.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground font-medium">{f.nome_completo}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">{sellerLigacoes.filter(l => l.status).length}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">R$ {sellerLigacoes.reduce((s, l) => s + (l.receita ?? 0), 0).toLocaleString('pt-BR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
        <DashboardLayout user={user} onLogout={onLogout} title="Funcionários" subtitle="Gestão de funcionários do sistema">
          <DevUsers />
        </DashboardLayout>
      } />
      <Route path="alerts" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Alertas" subtitle="Alertas operacionais dos vendedores">
          <AlertsPage />
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
