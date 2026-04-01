import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart } from "@/components/dashboard/Charts";
import NotebookSystem from "@/components/seller/NotebookSystem";
import {
  mockSales, mockFeedbacks,
  getSalesBySeller, getSellerPosition,
} from "@/lib/mockData";
import { type AppUser } from "@/contexts/AuthContext";
import SettingsPage from "@/pages/SettingsPage";
import { Phone, BarChart3, TrendingUp, Trophy } from "lucide-react";

interface SellerDashboardProps {
  user: AppUser;
  onLogout: () => void;
}

function SellerOverview({ user }: { user: AppUser }) {
  // Use seller id "1" as default mock seller for demo
  const sellerId = "1";
  const mySales = getSalesBySeller(sellerId);
  const myFeedbacks = mockFeedbacks.filter(f => f.sellerId === sellerId);
  const position = getSellerPosition(sellerId);
  const totalValue = mySales.reduce((sum, s) => sum + s.value, 0);

  // Sales by product for this seller
  const products = ["Claro", "Nio", "Giga Mais"];
  const byProduct = products.map(p => ({
    name: p,
    value: mySales.filter(s => s.product === p).length,
  }));

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Minhas Vendas" value={mySales.length} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Valor Total" value={`R$ ${totalValue}`} icon={<BarChart3 className="h-5 w-5" />} />
        <MetricCard label="Posição Ranking" value={`${position}º`} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Feedbacks" value={myFeedbacks.length} icon={<Phone className="h-5 w-5" />} />
      </div>

      <div className="mb-6">
        <SalesBarChart data={byProduct} label="Minhas Vendas por Produto" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Feedbacks Recentes</h3>
        </div>
        <div className="divide-y divide-border">
          {myFeedbacks.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum feedback disponível</div>
          )}
          {myFeedbacks.slice(0, 5).map(fb => (
            <div key={fb.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${fb.tone === 'positive' ? 'bg-success/10 text-success' : fb.tone === 'negative' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  {fb.tone === 'positive' ? 'Positivo' : fb.tone === 'negative' ? 'Negativo' : 'Neutro'}
                </span>
                <span className="text-xs text-muted-foreground">{fb.date}</span>
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
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SellerFeedbacks({ user }: { user: AppUser }) {
  const sellerId = "1";
  const myFeedbacks = mockFeedbacks.filter(f => f.sellerId === sellerId);

  return (
    <div className="space-y-3">
      {myFeedbacks.length === 0 && (
        <div className="glass-card p-5 text-center text-sm text-muted-foreground">Nenhum feedback disponível ainda</div>
      )}
      {myFeedbacks.map(fb => (
        <div key={fb.id} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full ${fb.tone === 'positive' ? 'bg-success/10 text-success' : fb.tone === 'negative' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
              {fb.tone === 'positive' ? 'Positivo' : fb.tone === 'negative' ? 'Negativo' : 'Neutro'}
            </span>
            <span className="text-xs font-mono text-muted-foreground">Score: {fb.score}</span>
            <span className="text-xs text-muted-foreground">{fb.date}</span>
          </div>
          <p className="text-sm text-foreground mb-3">{fb.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-semibold text-success mb-1.5">Pontos Fortes</h5>
              <ul className="text-xs text-foreground space-y-0.5">
                {fb.strengths.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-warning mb-1.5">Pontos Fracos</h5>
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
