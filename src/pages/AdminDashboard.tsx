import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import AdminSellerDetail from "@/components/admin/AdminSellerDetail";
import SettingsPage from "@/pages/SettingsPage";
import DownloadButton from "@/components/shared/DownloadButton";
import { useFuncionarios, useLigacoes } from "@/hooks/useFuncionarios";
import { type AppUser } from "@/contexts/AuthContext";
import { Users, Phone, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function AdminHome() {
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
          <span className="ml-auto text-xs text-muted-foreground">{ligacoes.length} total</span>
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
                {lig.resumo && <p className="text-sm text-muted-foreground mb-2">{lig.resumo}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lig.pontos_bons && (
                    <div>
                      <h5 className="text-xs font-semibold text-success mb-1">Pontos Bons</h5>
                      <p className="text-xs text-foreground">{lig.pontos_bons}</p>
                    </div>
                  )}
                  {lig.pontos_ruins && (
                    <div>
                      <h5 className="text-xs font-semibold text-warning mb-1">Pontos Ruins</h5>
                      <p className="text-xs text-foreground">{lig.pontos_ruins}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AdminSellers() {
  const navigate = useNavigate();
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes();

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
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Ligações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funcionarios.length === 0 && (
              <tr><td colSpan={2} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum funcionário cadastrado</td></tr>
            )}
            {funcionarios.map(f => {
              const count = ligacoes.filter(l => l.vendedor_id === f.id).length;
              return (
                <tr key={f.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/sellers/${f.id}`)}>
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link to={`/admin/sellers/${f.id}`} className="text-primary hover:underline">{f.nome_completo}</Link>
                  </td>
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
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes();

  return (
    <div className="space-y-3">
      <div className="glass-card px-5 py-4 flex items-center gap-2">
        <Phone className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Todas as Ligações</h3>
        <span className="ml-auto text-xs text-muted-foreground">{ligacoes.length} total</span>
      </div>
      {ligacoes.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">Nenhuma ligação registrada</div>
      )}
      {ligacoes.map(lig => {
        const func = funcionarios.find(f => f.id === lig.vendedor_id);
        return (
          <div key={lig.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{func?.nome_completo ?? "—"}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString("pt-BR")}</span>
                <DownloadButton url={lig.url_audio} />
              </div>
            </div>
            {lig.resumo && <p className="text-sm text-muted-foreground mb-2">{lig.resumo}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lig.pontos_bons && (
                <div>
                  <h5 className="text-xs font-semibold text-success mb-1">Pontos Bons</h5>
                  <p className="text-xs text-foreground">{lig.pontos_bons}</p>
                </div>
              )}
              {lig.pontos_ruins && (
                <div>
                  <h5 className="text-xs font-semibold text-warning mb-1">Pontos Ruins</h5>
                  <p className="text-xs text-foreground">{lig.pontos_ruins}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
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
