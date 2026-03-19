import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesLineChart, ProductPieChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import AdminSellerDetail from "@/components/admin/AdminSellerDetail";
import SettingsPage from "@/pages/SettingsPage";
import {
  useSellerProfiles, useSales, useFeedbacks, useIdleLogs,
  getSellerRankingFromData, getSalesByProductFromData, getSalesByWeekAndPeriodFromData,
  getIdleSummaryFromData, parseList,
  type SellerProfile, type SaleRow,
} from "@/hooks/useDashboardData";
import { useAuth, type AppUser } from "@/contexts/AuthContext";
import { DollarSign, TrendingUp, Users, ShoppingCart, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function AdminHome() {
  const { data: sellers = [] } = useSellerProfiles();
  const { data: sales = [] } = useSales();

  const ranking = getSellerRankingFromData(sales, sellers);
  const byProduct = getSalesByProductFromData(sales);
  const weeklyData = getSalesByWeekAndPeriodFromData(sales);
  const totalValue = sales.reduce((s, v) => s + (v.value ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Vendas" value={sales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Receita Total" value={`R$ ${totalValue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <MetricCard label="Vendedores Ativos" value={sellers.filter(s => s.is_active).length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Média/Vendedor" value={sellers.length ? Math.round(sales.length / sellers.length) : 0} icon={<TrendingUp className="h-5 w-5" />} />
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
  const navigate = useNavigate();
  const { data: sellers = [] } = useSellerProfiles();
  const { data: sales = [] } = useSales();
  const { data: idleLogs = [] } = useIdleLogs();

  const idleSummary = getIdleSummaryFromData(idleLogs, sellers);

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
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Dias s/ Venda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sellers.map(s => {
              const salesCount = sales.filter(sale => sale.user_id === s.user_id).length;
              const idle = idleSummary.find(l => l.sellerId === s.user_id);
              return (
                <tr key={s.user_id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/sellers/${s.user_id}`)}>
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link to={`/admin/sellers/${s.user_id}`} className="text-primary hover:underline">{s.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{s.email}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">{salesCount}</td>
                  <td className="px-5 py-3 text-sm text-right">
                    <span className={cn(
                      "font-mono text-xs px-2 py-0.5 rounded-full",
                      (idle?.daysSinceLastSale || 0) >= 3 ? "bg-destructive/10 text-destructive" :
                      (idle?.daysSinceLastSale || 0) >= 1 ? "bg-warning/10 text-warning" :
                      "bg-success/10 text-success"
                    )}>
                      {idle?.daysSinceLastSale ?? 0}d
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
  const { data: feedbacks = [] } = useFeedbacks();
  const { data: sellers = [] } = useSellerProfiles();
  const { data: allCalls = [] } = (await import("@/hooks/useDashboardData")).useCalls();

  // Build a map of call_id -> user_id -> seller name
  const callUserMap = new Map(allCalls.map(c => [c.id, c.user_id]));
  const sellerMap = new Map(sellers.map(s => [s.user_id, s.name]));

  const recentFeedbacks = feedbacks.slice(0, 20);

  return (
    <div className="space-y-3">
      <div className="glass-card px-5 py-4 flex items-center gap-2">
        <Phone className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Ligações Recentes</h3>
        <span className="ml-auto text-xs text-muted-foreground">{feedbacks.length} total</span>
      </div>
      {recentFeedbacks.map(fb => {
        const userId = callUserMap.get(fb.call_id);
        const sellerName = userId ? sellerMap.get(userId) : undefined;
        return (
          <div key={fb.id} className="glass-card p-5">
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
                <span className="text-xs font-bold text-primary">{fb.score}/100</span>
              </div>
            </div>
            {sellerName && <p className="text-sm text-muted-foreground mb-1"><span className="font-medium text-foreground">{sellerName}</span></p>}
            <p className="text-sm text-muted-foreground">{fb.summary}</p>
          </div>
        );
      })}
    </div>
  );
}

function AdminAlerts() {
  const { data: sellers = [] } = useSellerProfiles();
  const { data: idleLogs = [] } = useIdleLogs();
  const summary = getIdleSummaryFromData(idleLogs, sellers);
  return <AlertPanel idleLogs={summary} />;
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
          <AdminCallsWrapper />
        </DashboardLayout>
      } />
      <Route path="alerts" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Alertas" subtitle="Riscos operacionais">
          <AdminAlerts />
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
