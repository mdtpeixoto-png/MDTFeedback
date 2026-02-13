import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import {
  User, mockUsers, mockSales, mockFeedbacks, mockIdleLogs,
  getSellerRanking, getSalesByMonth,
} from "@/lib/mockData";
import { Database, Users, AlertTriangle, Cpu, ShoppingCart, Bug } from "lucide-react";

interface DevDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function DevDashboard({ user, onLogout }: DevDashboardProps) {
  const ranking = getSellerRanking();
  const byMonth = getSalesByMonth().map(m => ({ name: m.month, value: m.count }));
  const aiErrorRate = 2.3; // mock
  const totalUsers = mockUsers.length;
  const risksCount = mockIdleLogs.filter(l => l.daysSinceLastSale >= 3).length;

  const errorLogs = [
    { id: 'e1', date: '2026-02-12', endpoint: '/api/ingest', message: 'Payload inválido: campo "sellerId" ausente', status: 400 },
    { id: 'e2', date: '2026-02-11', endpoint: '/api/ai-feedback', message: 'Timeout na resposta da IA (>30s)', status: 504 },
    { id: 'e3', date: '2026-02-10', endpoint: '/api/ingest', message: 'Duplicata detectada: sale_id já existe', status: 409 },
  ];

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Painel do Desenvolvedor" subtitle="Visão global do sistema">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total de Vendas" value={mockSales.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <MetricCard label="Usuários" value={totalUsers} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Erro IA" value={`${aiErrorRate}%`} icon={<Cpu className="h-5 w-5" />} trend={{ value: -0.5, label: "vs semana anterior" }} />
        <MetricCard label="Riscos Ativos" value={risksCount} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SalesBarChart data={byMonth} label="Vendas Globais por Mês" />
        <RankingTable data={ranking} />
      </div>

      {/* User Management */}
      <div className="glass-card overflow-hidden mb-6">
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
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {u.role}
                    </span>
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

      {/* Error Logs */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Bug className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-foreground">Logs de Erro Recentes</h3>
        </div>
        <div className="divide-y divide-border">
          {errorLogs.map(log => (
            <div key={log.id} className="px-5 py-3 flex items-center gap-4">
              <span className="text-xs font-mono text-destructive bg-destructive/10 px-2 py-0.5 rounded">{log.status}</span>
              <div className="flex-1">
                <p className="text-sm text-foreground">{log.message}</p>
                <p className="text-xs text-muted-foreground font-mono">{log.endpoint} — {log.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
