import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Funcionario {
  id: number;
  nome_completo: string;
  email?: string;
  created_at: string;
}

export interface Ligacao {
  id: string;
  vendedor_id: number;
  vendedor_nome: string | null;
  lead_id: string | null;
  pontos_bons: string | null;
  pontos_ruins: string | null;
  resumo: string | null;
  url_audio: string | null;
  status: boolean | null;
  receita: number | null;
  operadora: string | null;
  created_at: string;
}

export function useFuncionarios() {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .order("nome_completo");
      if (error) throw error;
      return (data ?? []) as unknown as Funcionario[];
    },
  });
}

export function useLigacoes(vendedorId?: string | number) {
  return useQuery({
    queryKey: ["ligacoes", vendedorId],
    queryFn: async () => {
      let query = supabase
        .from("ligacoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (vendedorId !== undefined) {
        query = query.eq("vendedor_id", Number(vendedorId));
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Ligacao[];
    },
  });
}

export function useFuncionario(id?: string | number) {
  return useQuery({
    queryKey: ["funcionario", id],
    enabled: id !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("id", Number(id))
        .single();
      if (error) throw error;
      return data as unknown as Funcionario;
    },
  });
}

// Helper: parse \n-separated text into array
export function parsePoints(text: string | null): string[] {
  if (!text) return [];
  return text.split("\n").map(s => s.trim()).filter(Boolean);
}
