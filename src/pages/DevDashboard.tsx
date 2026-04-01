import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import DownloadButton from "@/components/shared/DownloadButton";
import { useFuncionarios, useLigacoes } from "@/hooks/useFuncionarios";
import { type AppUser } from "@/contexts/AuthContext";
import { Database, Users, Phone, BarChart3 } from "lucide-react";
import SettingsPage from "@/pages/SettingsPage";

interface DevDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function DevHome() {
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Funcionários" value={funcionarios.length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Ligações" value={ligacoes.length} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Média/Funcionário" value={funcionarios.length ? Math.round(ligacoes.length / funcionarios.length) : 0} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Ligações Recentes</h3>
        </div>
        <div className="divide-y divide-border">
          {ligacoes.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma ligação registrada</div>
          )}
          {ligacoes.slice(0, 10).map(lig => {
            const func = funcionarios.find(f => f.id === lig.vendedor_id);
            return (
              <div key={lig.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{func?.nome_completo ?? "—"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString("pt-BR")}</span>
                    <DownloadButton url={lig.url_audio} />
                  </div>
                </div>
                {lig.resumo && <p className="text-sm text-muted-foreground">{lig.resumo}</p>}
              </div>
            );
          })}
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
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Ligações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funcionarios.length === 0 && (
              <tr><td colSpan={2} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum funcionário cadastrado</td></tr>
            )}
            {funcionarios.map(f => (
              <tr key={f.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 text-sm text-foreground font-medium">{f.nome_completo}</td>
                <td className="px-5 py-3 text-sm text-right font-mono text-foreground">
                  {ligacoes.filter(l => l.vendedor_id === f.id).length}
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
