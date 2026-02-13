import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart, ProductPieChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import {
  User, mockSales, mockIdleLogs,
  getSellerRanking, getSalesByProduct, getSalesByPeriod, getSalesByMonth,
} from "@/lib/mockData";
import { DollarSign, TrendingUp, Users, ShoppingCart } from "lucide-react";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const ranking = getSellerRanking();
  const byProduct = getSalesByProduct().map(p => ({ name: p.product, value: p.count }));
  const byPeriod = getSalesByPeriod().map(p => ({ name: p.period, value: p.count }));
  const byMonth = getSalesByMonth().map(m => ({ name: m.month, value: m.count }));
  const totalValue = mockSales.reduce((s, v) => s + v.value, 0);

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Dashboard" subtitle="Visão geral da operação de vendas">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Vendas" value={mockSales.length} icon={<ShoppingCart className="h-5 w-5" />} trend={{ value: 12, label: "vs mês anterior" }} />
        <MetricCard label="Receita Total" value={`R$ ${totalValue.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} trend={{ value: 8, label: "vs mês anterior" }} />
        <MetricCard label="Vendedores Ativos" value={ranking.length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Média/Vendedor" value={Math.round(mockSales.length / ranking.length)} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 5, label: "vs mês anterior" }} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <SalesBarChart data={byMonth} label="Vendas por Mês" />
        </div>
        <ProductPieChart data={byProduct} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SalesBarChart data={byPeriod} label="Vendas por Período do Dia" />
        <RankingTable data={ranking} />
      </div>

      {/* Alerts */}
      <AlertPanel idleLogs={mockIdleLogs} />
    </DashboardLayout>
  );
}
