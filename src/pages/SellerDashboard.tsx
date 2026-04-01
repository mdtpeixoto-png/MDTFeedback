import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import NotebookSystem from "@/components/seller/NotebookSystem";
import DownloadButton from "@/components/shared/DownloadButton";
import { useLigacoes } from "@/hooks/useFuncionarios";
import { type AppUser } from "@/contexts/AuthContext";
import SettingsPage from "@/pages/SettingsPage";
import { Phone, BarChart3 } from "lucide-react";

interface SellerDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function SellerOverview({ user }: { user: AppUser }) {
  const { data: ligacoes = [] } = useLigacoes(user.id);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard label="Minhas Ligações" value={ligacoes.length} icon={<Phone className="h-5 w-5" />} />
      </div>

      <div className="space-y-3">
        {ligacoes.length === 0 && (
          <div className="glass-card p-5 text-center text-sm text-muted-foreground">Nenhuma ligação disponível ainda</div>
        )}
        {ligacoes.slice(0, 10).map(lig => (
          <div key={lig.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString("pt-BR")}</span>
              <DownloadButton url={lig.url_audio} />
            </div>
            {lig.resumo && <p className="text-sm text-foreground mb-3">{lig.resumo}</p>}
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
        ))}
      </div>
    </>
  );
}

function SellerFeedbacks({ user }: { user: AppUser }) {
  const { data: ligacoes = [] } = useLigacoes(user.id);

  return (
    <div className="space-y-3">
      {ligacoes.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">Nenhuma ligação disponível ainda</div>
      )}
      {ligacoes.map(lig => (
        <div key={lig.id} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString("pt-BR")}</span>
            <DownloadButton url={lig.url_audio} />
          </div>
          {lig.resumo && <p className="text-sm text-foreground mb-3">{lig.resumo}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lig.pontos_bons && (
              <div>
                <h5 className="text-xs font-semibold text-success mb-1.5">Pontos Bons</h5>
                <p className="text-xs text-foreground">{lig.pontos_bons}</p>
              </div>
            )}
            {lig.pontos_ruins && (
              <div>
                <h5 className="text-xs font-semibold text-warning mb-1.5">Pontos Ruins</h5>
                <p className="text-xs text-foreground">{lig.pontos_ruins}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SellerDashboard({ user, onLogout }: SellerDashboardProps) {
  return (
    <Routes>
      <Route index element={
        <DashboardLayout user={user} onLogout={onLogout} title="Meu Painel" subtitle="Visão geral do seu desempenho">
          <SellerOverview user={user} />
        </DashboardLayout>
      } />
      <Route path="feedbacks" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Feedbacks" subtitle="Feedbacks das suas ligações">
          <SellerFeedbacks user={user} />
        </DashboardLayout>
      } />
      <Route path="notes" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Anotações" subtitle="Seus cadernos de anotações">
          <NotebookSystem />
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
