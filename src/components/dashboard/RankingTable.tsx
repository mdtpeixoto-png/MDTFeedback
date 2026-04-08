import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface RankingItem {
  id: number | string;
  name: string;
  totalSales: number;
  totalValue: number;
}

interface RankingTableProps {
  data: RankingItem[];
  onSelect?: (id: string) => void;
  highlightId?: string;
}

export default function RankingTable({ data, onSelect, highlightId }: RankingTableProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          Ranking de Vendedores
        </h3>
      </div>
      <div className="divide-y divide-border">
        {data.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "flex items-center gap-4 w-full px-5 py-3 text-left transition-colors hover:bg-secondary/50",
              highlightId === item.id && "bg-primary/5 border-l-2 border-l-primary"
            )}
          >
            <span className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold",
              index === 0 ? "bg-warning/20 text-warning" :
              index === 1 ? "bg-muted text-muted-foreground" :
              index === 2 ? "bg-warning/10 text-warning/70" :
              "bg-secondary text-secondary-foreground"
            )}>
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">{item.totalSales}</p>
              <p className="text-[10px] text-muted-foreground">vendas</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">R$ {item.totalValue}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
