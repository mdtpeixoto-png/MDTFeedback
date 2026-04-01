import { useParams, Link } from "react-router-dom";
import MetricCard from "@/components/dashboard/MetricCard";
import DownloadButton from "@/components/shared/DownloadButton";
import { useFuncionario, useLigacoes } from "@/hooks/useFuncionarios";
import { Phone, ArrowLeft } from "lucide-react";

export default function AdminSellerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: funcionario, isLoading: loadingFunc } = useFuncionario(id);
  const { data: ligacoes = [], isLoading: loadingLig } = useLigacoes(id);

  if (loadingFunc || loadingLig) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  if (!funcionario) {
    return <div className="text-muted-foreground">Vendedor não encontrado.</div>;
  }

  return (
    <div>
      <Link to="/admin/sellers" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar para Vendedores
      </Link>

      <h3 className="text-lg font-bold text-foreground mb-4">{funcionario.nome_completo}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard label="Ligações" value={ligacoes.length} icon={<Phone className="h-5 w-5" />} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Ligações</h4>
          <span className="ml-auto text-xs text-muted-foreground">{ligacoes.length} ligações</span>
        </div>
        <div className="divide-y divide-border">
          {ligacoes.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma ligação disponível</div>
          )}
          {ligacoes.map(lig => (
            <div key={lig.id} className="p-5">
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
      </div>
    </div>
  );
}
