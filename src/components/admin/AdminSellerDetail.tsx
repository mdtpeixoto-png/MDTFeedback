import { useParams, Link } from "react-router-dom";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart } from "@/components/dashboard/Charts";
import {
  mockUsers, mockSales, mockFeedbacks,
  getSalesBySeller, getSellerPosition,
} from "@/lib/mockData";
import { Phone, TrendingUp, Trophy, ArrowLeft } from "lucide-react";

export default function AdminSellerDetail() {
  const { id } = useParams<{ id: string }>();
  const seller = mockUsers.find(u => u.id === id);

  if (!seller) {
    return <div className="text-muted-foreground">Vendedor não encontrado.</div>;
  }

  const mySales = getSalesBySeller(seller.id);
  const myFeedbacks = mockFeedbacks.filter(f => f.sellerId === seller.id);
  const position = getSellerPosition(seller.id);
  const totalValue = mySales.reduce((sum, s) => sum + s.value, 0);

  const products = ["Claro", "Nio", "Giga Mais"];
  const byProduct = products.map(p => ({
    name: p,
    value: mySales.filter(s => s.product === p).length,
  }));

  return (
    <div>
      <Link to="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar para Vendedores
      </Link>

      <h3 className="text-lg font-bold text-foreground mb-4">{seller.name}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendas" value={mySales.length} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Valor Total" value={`R$ ${totalValue}`} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Posição" value={`${position}º`} icon={<Trophy className="h-5 w-5" />} />
        <MetricCard label="Feedbacks" value={myFeedbacks.length} icon={<Phone className="h-5 w-5" />} />
      </div>

      <div className="mb-6">
        <SalesBarChart data={byProduct} label="Vendas por Produto" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Feedbacks</h4>
          <span className="ml-auto text-xs text-muted-foreground">{myFeedbacks.length} feedbacks</span>
        </div>
        <div className="divide-y divide-border">
          {myFeedbacks.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum feedback disponível</div>
          )}
          {myFeedbacks.slice(0, 10).map(fb => (
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
    </div>
  );
}
