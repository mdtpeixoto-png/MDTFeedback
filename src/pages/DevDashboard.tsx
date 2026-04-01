import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart, ProductPieChart, SalesLineChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import {
  mockUsers, mockSales, mockFeedbacks, mockIdleLogs,
  getSellerRanking, getSalesByProduct, getSalesByWeekAndPeriod,
  getSalesByMonth, getAIMetrics,
} from "@/lib/mockData";
import { type AppUser } from "@/contexts/AuthContext";
import { Database, Users, Phone, BarChart3, TrendingUp, Activity } from "lucide-react";
import SettingsPage from "@/pages/SettingsPage";
import AlertsPage from "@/pages/AlertsPage";

interface DevDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function DevHome() {
  const sellerCount = mockUsers.filter(u => u.role === "seller").length;
  const ranking = getSellerRanking();
  const byProduct = getSalesByProduct().map(p => ({ name: p.product, value: p.count }));
  const byWeek = getSalesByWeekAndPeriod();
  const byMonth = getSalesByMonth().map(m => ({ name: m.month, value: m.count }));
  const aiMetrics = getAIMetrics();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendedores" value={sellerCount} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Vendas Totais" value={mockSales.length} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Análises IA" value={mockFeedbacks.length} icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Taxa Erro IA" value={`${aiMetrics.errorRate}%`} icon={<Database className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SalesBarChart data={byMonth} label="Vendas por Mês" />
        <ProductPieChart data={byProduct} />
      </div>

      <div className="mb-6">
        <SalesLineChart data={byWeek} label="Vendas por Semana / Período (Mês Atual)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RankingTable data={ranking} />
        <AlertPanel idleLogs={mockIdleLogs} />
      </div>

      {/* AI Error Logs */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Logs de Erros IA</h3>
        </div>
        <div className="divide-y divide-border">
          {aiMetrics.recentFailures.map(f => (
            <div key={f.id} className="px-5 py-3 flex items-center gap-4">
              <span className="text-xs text-muted-foreground">{f.date}</span>
              <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded">{f.type}</span>
              <span className="text-sm text-foreground flex-1">{f.message}</span>
              <span className="text-xs text-muted-foreground font-mono">{f.endpoint}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DevUsers() {
  const sellers = mockUsers.filter(u => u.role === "seller");

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
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Email</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Vendas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sellers.map(s => (
              <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 text-sm text-foreground font-medium">{s.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{s.email}</td>
                <td className="px-5 py-3 text-sm text-right font-mono text-foreground">
                  {mockSales.filter(sale => sale.sellerId === s.id).length}
                </td>
              </tr>
            ))}
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
      <Route path="settings" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Configurações" subtitle="Preferências do sistema">
          <SettingsPage />
        </DashboardLayout>
      } />
    </Routes>
  );
}
