import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart, ProductPieChart, SalesLineChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import AdminSellerDetail from "@/components/admin/AdminSellerDetail";
import SettingsPage from "@/pages/SettingsPage";
import AlertsPage from "@/pages/AlertsPage";
import {
  mockUsers, mockSales, mockFeedbacks, mockIdleLogs,
  getSellerRanking, getSalesByProduct, getSalesByWeekAndPeriod,
  getSalesBySeller,
} from "@/lib/mockData";
import { type AppUser } from "@/contexts/AuthContext";
import { Users, Phone, BarChart3, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function AdminHome() {
  const navigate = useNavigate();
  const sellerCount = mockUsers.filter(u => u.role === "seller").length;
  const ranking = getSellerRanking();
  const byProduct = getSalesByProduct().map(p => ({ name: p.product, value: p.count }));
  const byWeek = getSalesByWeekAndPeriod();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendedores" value={sellerCount} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Vendas Totais" value={mockSales.length} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Feedbacks" value={mockFeedbacks.length} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Média/Vendedor" value={sellerCount ? Math.round(mockSales.length / sellerCount) : 0} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProductPieChart data={byProduct} />
        <SalesLineChart data={byWeek} label="Vendas por Semana / Período" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingTable data={ranking} onSelect={(id) => navigate(`/admin/sellers/${id}`)} />
        <AlertPanel idleLogs={mockIdleLogs} />
      </div>
    </>
  );
}

function AdminSellers() {
  const navigate = useNavigate();
  const sellers = mockUsers.filter(u => u.role === "seller");

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
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sellers.map(s => {
              const count = mockSales.filter(sale => sale.sellerId === s.id).length;
              return (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/sellers/${s.id}`)}>
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link to={`/admin/sellers/${s.id}`} className="text-primary hover:underline">{s.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{s.email}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">{count}</td>
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
  const feedbacks = mockFeedbacks.slice(0, 20);

  return (
    <div className="space-y-3">
      <div className="glass-card px-5 py-4 flex items-center gap-2">
        <Phone className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Feedbacks de Ligações</h3>
        <span className="ml-auto text-xs text-muted-foreground">{mockFeedbacks.length} total</span>
      </div>
      {feedbacks.map(fb => (
        <div key={fb.id} className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{fb.sellerName}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${fb.tone === 'positive' ? 'bg-success/10 text-success' : fb.tone === 'negative' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                {fb.tone === 'positive' ? 'Positivo' : fb.tone === 'negative' ? 'Negativo' : 'Neutro'}
              </span>
              <span className="text-xs font-mono text-muted-foreground">Score: {fb.score}</span>
              <span className="text-xs text-muted-foreground">{fb.date}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{fb.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-success mb-1">Pontos Fortes</h5>
              <ul className="text-xs text-foreground space-y-0.5">
                {fb.strengths.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-warning mb-1">Pontos Fracos</h5>
              <ul className="text-xs text-foreground space-y-0.5">
                {fb.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {fb.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  return (
    <Routes>
      <Route index element={
        <DashboardLayout user={user} onLogout={onLogout} title="Dashboard" subtitle="Visão geral da operação">
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
        <DashboardLayout user={user} onLogout={onLogout} title="Ligações" subtitle="Todas as ligações analisadas">
          <AdminCalls />
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
