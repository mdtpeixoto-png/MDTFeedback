import React, { useState, useMemo } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart, ProductPieChart, SalesLineChart } from "@/components/dashboard/Charts";
import RankingTable from "@/components/dashboard/RankingTable";
import AlertPanel from "@/components/dashboard/AlertPanel";
import AdminSellerDetail from "@/components/admin/AdminSellerDetail";
import SettingsPage from "@/pages/SettingsPage";
import AlertsPage from "@/pages/AlertsPage";
import { useFuncionarios, useLigacoes, type Ligacao } from "@/hooks/useFuncionarios";
import { type AppUser } from "@/contexts/AuthContext";
import { Users, Phone, BarChart3, TrendingUp, Search, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import LearningCurveChart from "@/components/dashboard/LearningCurveChart";
import { getCurrentPeriodStart } from "@/lib/learning-curve";
import { format, differenceInDays } from "date-fns";

interface AdminDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function getWeekOfMonth(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.min(Math.ceil(d.getDate() / 7), 4);
}

function getPeriodOfDay(dateStr: string): string {
  const h = new Date(dateStr).getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function AdminHome() {
  const navigate = useNavigate();
  const periodStart = getCurrentPeriodStart();
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: ligacoes = [] } = useLigacoes(undefined, periodStart);
  // For learning curve, we might want a longer history or just the current period. 
  // Let's use the current period for now or fetch all.
  const { data: allLigacoes = [] } = useLigacoes(); 

  const sellerCount = funcionarios.length;
  const totalReceita = ligacoes.reduce((sum, l) => sum + (l.receita ?? 0), 0);
  const totalFeedbacks = ligacoes.length;
  const avgPerSeller = sellerCount ? Math.round(ligacoes.filter(l => l.status).length / sellerCount) : 0;

  // Ranking
  const ranking = funcionarios.map(f => {
    const sellerLigacoes = ligacoes.filter(l => l.vendedor_id === f.id);
    return {
      id: f.id,
      name: f.nome_completo,
      totalSales: sellerLigacoes.filter(l => l.status).length,
      totalValue: sellerLigacoes.reduce((sum, l) => sum + (l.receita ?? 0), 0),
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  // By product (operadora)
  const operadoras = [...new Set(ligacoes.filter(l => l.operadora).map(l => l.operadora!))];
  const byProduct = operadoras.length > 0
    ? operadoras.map(op => ({ name: op, value: ligacoes.filter(l => l.operadora === op && l.status).length }))
    : [{ name: "Sem dados", value: 0 }];

  // By week & period
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const salesThisMonth = ligacoes.filter(l => {
    if (!l.status) return false;
    const d = new Date(l.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const byWeek = [1, 2, 3, 4].map(week => {
    const weekSales = salesThisMonth.filter(l => getWeekOfMonth(l.created_at) === week);
    return {
      name: `Semana ${week}`,
      Manhã: weekSales.filter(l => getPeriodOfDay(l.created_at) === "morning").length,
      Tarde: weekSales.filter(l => getPeriodOfDay(l.created_at) === "afternoon").length,
      Noite: weekSales.filter(l => getPeriodOfDay(l.created_at) === "evening").length,
    };
  });

  // Idle logs from ligacoes
  const idleLogs = funcionarios.map(f => {
    const sellerLigacoes = ligacoes.filter(l => l.vendedor_id === f.id && l.status);
    const lastSaleDate = sellerLigacoes.length > 0
      ? new Date(sellerLigacoes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at)
      : null;
    const daysSinceLastSale = lastSaleDate
      ? Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      sellerId: f.id,
      sellerName: f.nome_completo,
      totalIdleMinutes: 0,
      idlePeriods: 0,
      daysSinceLastSale,
    };
  });

  // Prepare learning curve data (Cumulative Sales / Days Active)
  const learningData = useMemo(() => {
    if (allLigacoes.length === 0) return [];
    
    const sorted = [...allLigacoes].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstDate = new Date(sorted[0].created_at);
    let cumulativeSales = 0;
    const dailyData: Record<string, number> = {};
    
    sorted.forEach(lig => {
      const d = format(new Date(lig.created_at), 'yyyy-MM-dd');
      if (lig.status) {
        dailyData[d] = (dailyData[d] || 0) + 1;
      } else {
        dailyData[d] = (dailyData[d] || 0);
      }
    });

    const uniqueDays = Object.keys(dailyData).sort();
    return uniqueDays.map(dayStr => {
      cumulativeSales += dailyData[dayStr];
      const dateObj = new Date(dayStr);
      const daysElapsed = Math.max(1, differenceInDays(dateObj, firstDate) + 1);
      // For the whole team, we scale differently. Let's say 10 sales/day is 100%
      const score = Math.min(100, Math.round((cumulativeSales / daysElapsed) * 10));
      return { date: format(dateObj, 'dd/MM'), score };
    }).slice(-20); // Show last 20 days of progress
  }, [allLigacoes]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendedores" value={sellerCount} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Receita Total" value={`R$ ${totalReceita.toLocaleString('pt-BR')}`} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Feedbacks" value={totalFeedbacks} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Média Vendas/Vendedor" value={avgPerSeller} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProductPieChart data={byProduct} />
        <SalesLineChart data={byWeek} label="Vendas por Semana / Período do Dia" />
      </div>

      <div className="mb-6">
        <LearningCurveChart 
          data={learningData} 
          title={`Curva de Aprendizado Geral — Equipe (Desde ${format(periodStart, 'dd/MM')})`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingTable data={ranking} onSelect={(id) => navigate(`/admin/sellers/${id}`)} />
        <AlertPanel idleLogs={idleLogs} />
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
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Vendas</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 uppercase tracking-wider">Receita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funcionarios.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum vendedor cadastrado</td>
              </tr>
            )}
            {funcionarios.map(f => {
              const sellerLigacoes = ligacoes.filter(l => l.vendedor_id === f.id);
              const salesCount = sellerLigacoes.filter(l => l.status).length;
              const totalValue = sellerLigacoes.reduce((sum, l) => sum + (l.receita ?? 0), 0);
              return (
                <tr key={f.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/sellers/${f.id}`)}>
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link to={`/admin/sellers/${f.id}`} className="text-primary hover:underline">{f.nome_completo}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">{salesCount}</td>
                  <td className="px-5 py-3 text-sm text-right font-mono text-foreground">R$ {totalValue.toLocaleString('pt-BR')}</td>
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
  const { data: ligacoes = [] } = useLigacoes();
  const [searchId, setSearchId] = useState("");

  const filteredLigacoes = ligacoes.filter(lig => 
    (!searchId || (lig.lead_id?.toLowerCase().includes(searchId.toLowerCase()))) &&
    lig.status === false &&
    lig.resumo !== null
  );

  return (
    <div className="space-y-3">
      <div className="glass-card px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 mr-auto">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Feedbacks de Ligações</h3>
          <span className="text-xs text-muted-foreground">{ligacoes.length} total</span>
        </div>
        
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por ID do Make (Ex: WEB...)" 
            className="w-full bg-secondary/50 border border-border rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>
      </div>
      
      {filteredLigacoes.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">
          {searchId ? "Nenhuma ligação encontrada para este ID" : "Nenhuma ligação registrada ainda"}
        </div>
      )}
      {filteredLigacoes.slice(0, 20).map(lig => {
        const pontosBons = (lig.pontos_bons ?? "").split("\n").filter(Boolean);
        const pontosRuins = (lig.pontos_ruins ?? "").split("\n").filter(Boolean);
        return (
          <div key={lig.id} className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{lig.vendedor_nome ?? "Vendedor"}</span>
                {lig.lead_id && <span className="text-[10px] font-mono text-muted-foreground uppercase">{lig.lead_id}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${lig.status ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {lig.status ? 'Venda' : 'Não vendeu'}
                </span>
                {lig.operadora && <span className="text-xs font-mono text-muted-foreground">{lig.operadora}</span>}
                {lig.receita ? <span className="text-xs font-mono text-primary">R$ {Number(lig.receita).toLocaleString('pt-BR')}</span> : null}
                <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString('pt-BR')}</span>
                {lig.url_audio && (
                  <a href={lig.url_audio} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">🎧 Áudio</a>
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
  );
}

function AdminSales() {
  const { data: ligacoes = [] } = useLigacoes();
  const [searchId, setSearchId] = useState("");

  const filteredSales = ligacoes.filter(lig => 
    (!searchId || (lig.lead_id?.toLowerCase().includes(searchId.toLowerCase()))) &&
    lig.status === true
  );

  return (
    <div className="space-y-3">
      <div className="glass-card px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 mr-auto">
          <DollarSign className="h-4 w-4 text-success" />
          <h3 className="text-sm font-semibold text-foreground">Vendas Realizadas</h3>
          <span className="text-xs text-muted-foreground">{filteredSales.length} total</span>
        </div>
        
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por ID..." 
            className="w-full bg-secondary/50 border border-border rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>
      </div>
      
      {filteredSales.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">
          {searchId ? "Nenhuma venda encontrada" : "Nenhuma venda registrada ainda"}
        </div>
      )}
      {filteredSales.slice(0, 30).map(lig => {
        const pontosBons = (lig.pontos_bons ?? "").split("\n").filter(Boolean);
        const pontosRuins = (lig.pontos_ruins ?? "").split("\n").filter(Boolean);
        const hasAnalysis = !!lig.resumo;

        return (
          <div key={lig.id} className="glass-card p-5 border-l-4 border-l-success">
            <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{lig.vendedor_nome ?? "Vendedor"}</span>
                {lig.lead_id && <span className="text-[10px] font-mono text-muted-foreground uppercase">{lig.lead_id}</span>}
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {lig.operadora && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{lig.operadora}</span>}
                {lig.receita ? <span className="text-xs font-mono font-bold text-success">R$ {Number(lig.receita).toLocaleString('pt-BR')}</span> : null}
                <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString('pt-BR')}</span>
                {lig.url_audio && (
                  <a href={lig.url_audio} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">🎧 Áudio</a>
                )}
              </div>
            </div>
            
            {hasAnalysis ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">{lig.resumo}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-[11px] font-semibold text-success uppercase tracking-wider mb-1">Pontos Fortes</h5>
                    <ul className="text-xs text-foreground space-y-0.5">
                      {pontosBons.map((s, i) => <li key={i}>• {s}</li>)}
                      {pontosBons.length === 0 && <li className="text-muted-foreground">—</li>}
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-semibold text-warning uppercase tracking-wider mb-1">Pontos Fracos</h5>
                    <ul className="text-xs text-foreground space-y-0.5">
                      {pontosRuins.map((w, i) => <li key={i}>• {w}</li>)}
                      {pontosRuins.length === 0 && <li className="text-muted-foreground">—</li>}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-3 p-3 bg-secondary/30 rounded-md border border-border/50 flex items-center justify-center">
                <span className="text-xs text-muted-foreground italic">
                  Análise não disponível (áudio não encontrado no Asterisk ou em processamento)
                </span>
              </div>
            )}
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
      <Route path="sales" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Vendas" subtitle="Controle de vendas fechadas">
          <AdminSales />
        </DashboardLayout>
      } />
      <Route path="calls" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Ligações" subtitle="Ligações analisadas (não-vendas)">
          <AdminCalls />
        </DashboardLayout>
      } />
      <Route path="alerts" element={
        <DashboardLayout user={user} onLogout={onLogout} title="Alertas" subtitle="Alertas operacionais dos vendedores">
          <AlertsPage />
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
