import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import MetricCard from "@/components/dashboard/MetricCard";
import {
  User, mockFeedbacks, mockIdleLogs,
  getSalesBySeller, getSellerPosition, getSellerRanking,
} from "@/lib/mockData";
import { ShoppingCart, Trophy, Phone, Clock, Notebook } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function SellerDashboard({ user, onLogout }: SellerDashboardProps) {
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'feedbacks' | 'notes'>('overview');
  const sales = getSalesBySeller(user.id);
  const position = getSellerPosition(user.id);
  const totalSellers = getSellerRanking().length;
  const feedbacks = mockFeedbacks.filter(f => f.sellerId === user.id);
  const idleLog = mockIdleLogs.find(l => l.sellerId === user.id);

  const allStrengths = feedbacks.flatMap(f => f.strengths);
  const allWeaknesses = feedbacks.flatMap(f => f.weaknesses);
  const strengthCounts = Object.entries(allStrengths.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1]);
  const weaknessCounts = Object.entries(allWeaknesses.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {} as Record<string, number>))
    .sort((a, b) => b[1] - a[1]);

  const tabs = [
    { id: 'overview' as const, label: 'Visão Geral' },
    { id: 'feedbacks' as const, label: 'Feedbacks' },
    { id: 'notes' as const, label: 'Anotações' },
  ];

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Meu Painel" subtitle="Acompanhe seu desempenho">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary/50 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Minhas Vendas" value={sales.length} icon={<ShoppingCart className="h-5 w-5" />} />
            <MetricCard label="Posição no Ranking" value={`${position}º de ${totalSellers}`} icon={<Trophy className="h-5 w-5" />} />
            <MetricCard label="Ligações Analisadas" value={feedbacks.length} icon={<Phone className="h-5 w-5" />} />
            <MetricCard label="Tempo Ocioso Hoje" value={`${idleLog?.totalIdleMinutes || 0}min`} icon={<Clock className="h-5 w-5" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Pontos Fortes</h3>
              <div className="space-y-2">
                {strengthCounts.slice(0, 5).map(([s, count]) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{s}</span>
                    <span className="text-xs font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Weaknesses */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Pontos a Melhorar</h3>
              <div className="space-y-2">
                {weaknessCounts.slice(0, 5).map(([s, count]) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{s}</span>
                    <span className="text-xs font-mono text-warning bg-warning/10 px-2 py-0.5 rounded-full">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'feedbacks' && (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div key={fb.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{fb.date}</span>
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
              <p className="text-sm text-foreground mb-3">{fb.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {fb.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Notebook className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Bloco de Anotações</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escreva suas anotações aqui..."
            className="w-full h-64 bg-secondary/50 border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
