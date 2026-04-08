import { useParams, Link } from "react-router-dom";
import MetricCard from "@/components/dashboard/MetricCard";
import { SalesBarChart } from "@/components/dashboard/Charts";
import { useFuncionario, useLigacoes, parsePoints } from "@/hooks/useFuncionarios";
import { Phone, TrendingUp, Trophy, ArrowLeft, ThumbsUp, ThumbsDown, Download } from "lucide-react";

export default function AdminSellerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: seller, isLoading: loadingSeller } = useFuncionario(id);
  const { data: ligacoes = [], isLoading: loadingLigacoes } = useLigacoes(id);

  if (loadingSeller || loadingLigacoes) {
    return <div className="text-muted-foreground text-sm">Carregando...</div>;
  }

  if (!seller) {
    return <div className="text-muted-foreground">Vendedor não encontrado.</div>;
  }

  const sales = ligacoes.filter(l => l.status);
  const totalValue = ligacoes.reduce((sum, l) => sum + (l.receita ?? 0), 0);

  // Aggregated strengths/weaknesses
  const strengthCount: Record<string, number> = {};
  const weaknessCount: Record<string, number> = {};
  ligacoes.forEach(l => {
    parsePoints(l.pontos_bons).forEach(s => { strengthCount[s] = (strengthCount[s] || 0) + 1; });
    parsePoints(l.pontos_ruins).forEach(w => { weaknessCount[w] = (weaknessCount[w] || 0) + 1; });
  });
  const strengths = Object.entries(strengthCount).sort((a, b) => b[1] - a[1]);
  const weaknesses = Object.entries(weaknessCount).sort((a, b) => b[1] - a[1]);

  // By operadora
  const operadoras = [...new Set(ligacoes.filter(l => l.operadora).map(l => l.operadora!))];
  const byProduct = operadoras.length > 0
    ? operadoras.map(op => ({ name: op, value: ligacoes.filter(l => l.operadora === op && l.status).length }))
    : [];

  return (
    <div>
      <Link to="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar para Vendedores
      </Link>

      <h3 className="text-lg font-bold text-foreground mb-4">{seller.nome_completo}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Vendas" value={sales.length} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Receita" value={`R$ ${totalValue.toLocaleString('pt-BR')}`} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Total Ligações" value={ligacoes.length} icon={<Phone className="h-5 w-5" />} />
        <MetricCard label="Taxa Conversão" value={ligacoes.length > 0 ? `${Math.round((sales.length / ligacoes.length) * 100)}%` : '0%'} icon={<Trophy className="h-5 w-5" />} />
      </div>

      {/* Pontos Fortes e Fracos Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-4 w-4 text-success" />
            <h4 className="text-sm font-semibold text-foreground">Pontos Fortes (Geral)</h4>
          </div>
          <div className="space-y-2">
            {strengths.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            {strengths.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: `${Math.min((count / ligacoes.length) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-8 text-right">{count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsDown className="h-4 w-4 text-warning" />
            <h4 className="text-sm font-semibold text-foreground">Pontos Fracos (Geral)</h4>
          </div>
          <div className="space-y-2">
            {weaknesses.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            {weaknesses.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-warning" style={{ width: `${Math.min((count / ligacoes.length) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-8 text-right">{count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {byProduct.length > 0 && (
        <div className="mb-6">
          <SalesBarChart data={byProduct} label="Vendas por Operadora" />
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Feedbacks</h4>
          <span className="ml-auto text-xs text-muted-foreground">{ligacoes.length} feedbacks</span>
        </div>
        <div className="divide-y divide-border">
          {ligacoes.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum feedback disponível</div>
          )}
          {ligacoes.slice(0, 20).map(lig => {
            const pontosBons = parsePoints(lig.pontos_bons);
            const pontosRuins = parsePoints(lig.pontos_ruins);
            return (
              <div key={lig.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${lig.status ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {lig.status ? 'Venda' : 'Não vendeu'}
                  </span>
                  <div className="flex items-center gap-2">
                    {lig.operadora && <span className="text-xs font-mono text-muted-foreground">{lig.operadora}</span>}
                    {lig.receita ? <span className="text-xs font-mono text-primary">R$ {Number(lig.receita).toLocaleString('pt-BR')}</span> : null}
                    <span className="text-xs text-muted-foreground">{new Date(lig.created_at).toLocaleDateString('pt-BR')}</span>
                    {lig.url_audio && (
                      <a href={lig.url_audio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline" title="Download do áudio">
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
    </div>
  );
}
