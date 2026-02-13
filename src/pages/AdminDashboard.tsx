import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesLineChart, ProductPieChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import AdminSellerDetail from "@/components/admin/AdminSellerDetail";
import {
  User, mockSales, mockIdleLogs, mockUsers, mockFeedbacks,
  getSellerRanking, getSalesByProduct, getSalesByWeekAndPeriod,
} from "@/lib/mockData";
import { DollarSign, TrendingUp, Users, ShoppingCart, Cpu, AlertTriangle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

function AdminHome() {
  const ranking = getSellerRanking();
  const byProduct = getSalesByProduct().map(p => ({ name: p.product, value: p.count }));
  const weeklyData = getSalesByWeekAndPeriod();
  const totalValue = mockSales.reduce((s, v) => s + v.value, 0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Vendas" value={mockSales.length} icon={<ShoppingCart className="h-5 w-5" />} trend={{ value: 12, label: "vs mês anterior" }} />
        <MetricCard label="Receita Total" value={`R$ ${totalValue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} trend={{ value: 8, label: "vs mês anterior" }} />
        <MetricCard label="Vendedores Ativos" value={ranking.length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Média/Vendedor" value={Math.round(mockSales.length / ranking.length)} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 5, label: "vs mês anterior" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <SalesLineChart data={weeklyData} label="Vendas do Mês Atual (por período)" />
        </div>
        <ProductPieChart data={byProduct} />
      </div>

      <RankingTable data={ranking} />
    </>
  );
}

function AdminSellers() {
  const sellers = mockUsers.filter(u => u.role === 'seller');

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Vendedores</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Nome</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Email</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Vendas</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Feedbacks</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Dias s/ Venda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sellers.map(s => {
              const salesCount = mockSales.filter(sale => sale.sellerId === s.id).length;
              const fbCount = mockFeedbacks.filter(f => f.sellerId === s.id).length;
              const idle = mockIdleLogs.find(l => l.sellerId === s.id);
              return (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/sellers/${s.id}`}>
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link to={`/admin/sellers/${s.id}`} className="text-primary hover:underline">{s.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{s.email}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">{salesCount}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">{fbCount}</td>
                  <td className="px-5 py-3 text-sm text-right">
                    <span className={cn(
                      "font-mono text-xs px-2 py-0.5 rounded-full",
                      (idle?.daysSinceLastSale || 0) >= 3 ? "bg-destructive/10 text-destructive" :
                      (idle?.daysSinceLastSale || 0) >= 1 ? "bg-warning/10 text-warning" :
                      "bg-success/10 text-success"
                    )}>
                      {idle?.daysSinceLastSale || 0}d
                    </span>
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

function AdminCalls() {
  const recentFeedbacks = [...mockFeedbacks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  return (
    <div className="space-y-3">
      <div className="glass-card px-5 py-4 flex items-center gap-2">
        <Phone className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Ligações Recentes</h3>
        <span className="ml-auto text-xs text-muted-foreground">{mockFeedbacks.length} total</span>
      </div>
      {recentFeedbacks.map(fb => (
        <div key={fb.id} className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{fb.sellerName}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{fb.date}</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                fb.tone === 'positive' ? "bg-success/10 text-success" :
                fb.tone === 'negative' ? "bg-destructive/10 text-destructive" :
                "bg-muted text-muted-foreground"
              )}>
                {fb.tone === 'positive' ? 'Positivo' : fb.tone === 'negative' ? 'Negativo' : 'Neutro'}
              </span>
              <span className="text-xs font-bold text-primary">{fb.score}/100</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{fb.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {fb.tags.map(tag => (
              <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminAlerts() {
  return <AlertPanel idleLogs={mockIdleLogs} />;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  return (
    <Routes>
      <Route index element={
        <DashboardLayout user={user} onLogout={onLogout} title="Dashboard" subtitle="Visão geral da operação de vendas">
          <AdminHome />
        </DashboardLayout>
      } />
      <Route path="sellers" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Vendedores" subtitle="Gestão de vendedores">
          <AdminSellers />
        </DashboardLayout>
      } />
      <Route path="sellers/:id" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Detalhes do Vendedor" subtitle="Perfil individual">
          <AdminSellerDetail />
        </DashboardLayout>
      } />
      <Route path="calls" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Ligações" subtitle="Feedbacks de ligações analisadas">
          <AdminCalls />
        </DashboardLayout>
      } />
      <Route path="alerts" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Alertas" subtitle="Riscos operacionais">
          <AdminAlerts />
        </DashboardLayout>
      } />
    </Routes>
  );
}
