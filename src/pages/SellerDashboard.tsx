import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart } from "@/components/dashboard/Charts";
import NotebookSystem from "@/components/seller/NotebookSystem";
import { useLigacoes, useFuncionarios, parsePoints } from "@/hooks/useFuncionarios";
import { type AppUser } from "@/contexts/AuthContext";
import SettingsPage from "@/pages/SettingsPage";
import { Phone, BarChart3, TrendingUp, Trophy, Download } from "lucide-react";
import LearningCurveChart from "@/components/dashboard/LearningCurveChart";
import { getCurrentPeriodStart } from "@/lib/learning-curve";
import { format } from "date-fns";

interface SellerDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function SellerOverview({ user }: { user: AppUser }) {
  const { data: funcionarios = [] } = useFuncionarios();
  const myFunc = funcionarios.find(f => f.email === user.email);
  const periodStart = getCurrentPeriodStart();
  const { data: myLigacoes = [] } = useLigacoes(myFunc?.id ?? "NOT_FOUND", periodStart);
  
  // For learning curve, fetch all to see the progress
  const { data: allMyLigacoes = [] } = useLigacoes(myFunc?.id ?? "NOT_FOUND");
  const mySales = myLigacoes.filter(l => l.status);
  const totalValue = myLigacoes.reduce((sum, l) => sum + (l.receita ?? 0), 0);

  // Ranking position - for now, we'll only show the user's own data 
  // since RLS will prevent seeing others. 
  // If a global ranking is needed, a separate view/API should be used.
  const position = 0; // Simplified for now to avoid showing all data

  // By operadora
  const operadoras = [...new Set(myLigacoes.filter(l => l.operadora).map(l => l.operadora!))];
  const byProduct = operadoras.length > 0
    ? operadoras.map(op => ({ name: op, value: myLigacoes.filter(l => l.operadora === op && l.status).length }))
    : [];

  // Learning curve data
  const learningData = allMyLigacoes
    .slice()
    .reverse()
    .reduce((acc: any[], lig) => {
      try {
        if (!lig.created_at) return acc;
        const date = format(new Date(lig.created_at), 'dd/MM');
        const existing = acc.find(a => a.date === date);
        const score = lig.score ?? 50;
        if (existing) {
          existing.score = (existing.score + score) / 2;
        } else {
          acc.push({ date, score });
        }
      } catch (e) {
        console.error("Erro ao formatar data para o gráfico:", e);
      }
      return acc;
    }, [])
    .slice(-15);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Minhas Vendas" value={mySales.length} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Receita Total" value={`R$ ${totalValue.toLocaleString('pt-BR')}`} icon={<BarChart3 className="h-5 w-5" />} />
        <MetricCard label="Posição Ranking" value={position > 0 ? `${position}º` : '—'} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Feedbacks" value={myLigacoes.length} icon={<Phone className="h-5 w-5" />} />
      </div>

      {byProduct.length > 0 && (
        <div className="mb-6">
          <SalesBarChart data={byProduct} label="Minhas Vendas por Operadora" />
        </div>
      )}

      <div className="mb-6">
        <LearningCurveChart 
          data={learningData} 
          title={`Minha Curva de Aprendizado (Desde ${format(periodStart, 'dd/MM')})`} 
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Feedbacks Recentes</h3>
        </div>
        <div className="divide-y divide-border">
          {myLigacoes.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum feedback disponível</div>
          )}
          {myLigacoes.slice(0, 5).map(lig => {
            const pontosBons = parsePoints(lig.pontos_bons);
            const pontosRuins = parsePoints(lig.pontos_ruins);
            return (
              <div key={lig.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${lig.status ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {lig.status ? 'Venda' : 'Não vendeu'}
                  </span>
                  <div className="flex items-center gap-2">
                    {lig.receita ? <span className="text-xs font-mono text-primary">R$ {Number(lig.receita).toLocaleString('pt-BR')}</span> : null}
                    <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString('pt-BR')}</span>
                    {lig.url_audio && (
                      <a href={lig.url_audio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Download className="h-3 w-3" /> Áudio
                      </a>
                    )}
                  </div>
                </div>
                {lig.resumo && <p className="text-sm text-muted-foreground mb-2">{lig.resumo}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-success mb-1">Pontos Fortes</h5>
                    <ul className="text-xs text-foreground space-y-0.5">
                      {pontosBons.map((s, i) => <li key={i}>• {s}</li>)}
                      {pontosBons.length === 0 && <li className="text-muted-foreground">—</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-warning mb-1">Pontos Fracos</h5>
                    <ul className="text-xs text-foreground space-y-0.5">
                      {pontosRuins.map((w, i) => <li key={i}>• {w}</li>)}
                      {pontosRuins.length === 0 && <li className="text-muted-foreground">—</li>}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function SellerFeedbacks({ user }: { user: AppUser }) {
  const { data: funcionarios = [] } = useFuncionarios();
  const myFunc = funcionarios.find(f => f.email === user.email);
  const { data: ligacoes = [] } = useLigacoes(myFunc?.id ?? "NOT_FOUND");

  return (
    <div className="space-y-3">
      {ligacoes.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">Nenhum feedback disponível ainda</div>
      )}
      {ligacoes.map(lig => {
        const pontosBons = parsePoints(lig.pontos_bons);
        const pontosRuins = parsePoints(lig.pontos_ruins);
        return (
          <div key={lig.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${lig.status ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {lig.status ? 'Venda' : 'Não vendeu'}
              </span>
              <div className="flex items-center gap-2">
                {lig.operadora && <span className="text-xs font-mono text-muted-foreground">{lig.operadora}</span>}
                {lig.receita ? <span className="text-xs font-mono text-primary">R$ {Number(lig.receita).toLocaleString('pt-BR')}</span> : null}
                <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString('pt-BR')}</span>
                {lig.url_audio && (
                  <a href={lig.url_audio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Download className="h-3 w-3" /> Áudio
                  </a>
                )}
              </div>
            </div>
            {lig.resumo && <p className="text-sm text-foreground mb-3">{lig.resumo}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h5 className="text-xs font-semibold text-success mb-1.5">Pontos Fortes</h5>
                <ul className="text-xs text-foreground space-y-0.5">
                  {pontosBons.map((s, i) => <li key={i}>• {s}</li>)}
                  {pontosBons.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-warning mb-1.5">Pontos Fracos</h5>
                <ul className="text-xs text-foreground space-y-0.5">
                  {pontosRuins.map((w, i) => <li key={i}>• {w}</li>)}
                  {pontosRuins.length === 0 && <li className="text-muted-foreground">—</li>}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
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
