import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Funcionario {
  id: string;
  nome_completo: string;
  created_at: string;
}

export interface Ligacao {
  id: string;
  vendedor_id: string;
  pontos_bons: string | null;
  pontos_ruins: string | null;
  resumo: string | null;
  url_audio: string | null;
  created_at: string;
}

export function useFuncionarios() {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios" as any)
        .select("*")
        .order("nome_completo");
      if (error) throw error;
      return (data ?? []) as unknown as Funcionario[];
    },
  });
}

export function useLigacoes(vendedorId?: string) {
  return useQuery({
    queryKey: ["ligacoes", vendedorId],
    queryFn: async () => {
      let query = supabase
        .from("ligacoes" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (vendedorId) {
        query = query.eq("vendedor_id", vendedorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Ligacao[];
    },
  });
}

export function useFuncionario(id?: string) {
  return useQuery({
    queryKey: ["funcionario", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios" as any)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as Funcionario;
    },
  });
}
