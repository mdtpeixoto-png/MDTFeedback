import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────
export interface SellerProfile {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
}

export interface SaleRow {
  id: string;
  user_id: string;
  product: string;
  plan: string | null;
  period: string | null;
  value: number | null;
  week: number | null;
  sale_date: string;
}

export interface FeedbackRow {
  id: string;
  call_id: string;
  summary: string | null;
  strengths: string | null;
  weaknesses: string | null;
  tone: string | null;
  score: number | null;
  created_at: string;
}

export interface CallRow {
  id: string;
  user_id: string;
  duration_seconds: number | null;
  had_sale: boolean | null;
  call_datetime: string;
}

export interface IdleLogRow {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  days_since_last_sale: number | null;
}

export interface AIErrorRow {
  id: string;
  call_id: string | null;
  error_message: string | null;
  created_at: string;
}

// ── Queries ────────────────────────────────────────────

export function useSellerProfiles() {
  return useQuery({
    queryKey: ["profiles", "sellers"],
    queryFn: async () => {
      // Get all profiles that have seller role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "seller");

      if (!roles?.length) return [] as SellerProfile[];

      const sellerIds = roles.map((r) => r.user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, avatar_url, is_active")
        .in("user_id", sellerIds);

      if (error) throw error;
      return (data ?? []) as SellerProfile[];
    },
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, avatar_url, is_active");
      if (error) throw error;
      return (data ?? []) as SellerProfile[];
    },
  });
}

export function useAllRoles() {
  return useQuery({
    queryKey: ["user_roles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return (data ?? []) as { user_id: string; role: string }[];
    },
  });
}

export function useSales(userId?: string) {
  return useQuery({
    queryKey: ["sales", userId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("sales").select("*");
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.order("sale_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SaleRow[];
    },
  });
}

export function useCalls(userId?: string) {
  return useQuery({
    queryKey: ["calls", userId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("calls").select("*");
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.order("call_datetime", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CallRow[];
    },
  });
}

export function useFeedbacks(userId?: string) {
  return useQuery({
    queryKey: ["feedbacks", userId ?? "all"],
    queryFn: async () => {
      // If userId is provided, join through calls to get feedbacks for that user
      if (userId) {
        const { data: calls } = await supabase
          .from("calls")
          .select("id")
          .eq("user_id", userId);

        if (!calls?.length) return [] as (FeedbackRow & { call_user_id?: string; seller_name?: string })[];

        const callIds = calls.map((c) => c.id);
        const { data, error } = await supabase
          .from("ai_feedbacks")
          .select("*")
          .in("call_id", callIds)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data ?? []) as (FeedbackRow & { call_user_id?: string; seller_name?: string })[];
      }

      const { data, error } = await supabase
        .from("ai_feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (FeedbackRow & { call_user_id?: string; seller_name?: string })[];
    },
  });
}

export function useCallTags() {
  return useQuery({
    queryKey: ["call_tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("call_tags").select("call_id, tag_id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*");
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
  });
}

export function useIdleLogs(userId?: string) {
  return useQuery({
    queryKey: ["idle_logs", userId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("idle_time_logs").select("*");
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as IdleLogRow[];
    },
  });
}

export function useAIErrors() {
  return useQuery({
    queryKey: ["ai_errors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AIErrorRow[];
    },
  });
}

// ── Computed Helpers ───────────────────────────────────

export function getSellerRankingFromData(
  sales: SaleRow[],
  sellers: SellerProfile[]
) {
  return sellers
    .map((s) => {
      const sellerSales = sales.filter((sale) => sale.user_id === s.user_id);
      return {
        id: s.user_id,
        name: s.name,
        totalSales: sellerSales.length,
        totalValue: sellerSales.reduce((sum, sale) => sum + (sale.value ?? 0), 0),
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);
}

export function getSalesByProductFromData(sales: SaleRow[]) {
  const products = ["Claro", "Nio", "Giga Mais"];
  return products.map((p) => ({
    name: p,
    value: sales.filter((s) => s.product === p).length,
  }));
}

export function getSalesByWeekAndPeriodFromData(sales: SaleRow[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthSales = sales.filter((s) => {
    const d = new Date(s.sale_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return [1, 2, 3, 4].map((week) => {
    const weekSales = currentMonthSales.filter((s) => s.week === week);
    return {
      name: `Semana ${week}`,
      Manhã: weekSales.filter((s) => s.period === "morning").length,
      Tarde: weekSales.filter((s) => s.period === "afternoon").length,
      Noite: weekSales.filter((s) => s.period === "evening").length,
    };
  });
}

/** Build idle log summary per seller (latest log per user) */
export function getIdleSummaryFromData(
  idleLogs: IdleLogRow[],
  sellers: SellerProfile[]
) {
  return sellers.map((s) => {
    const logs = idleLogs.filter((l) => l.user_id === s.user_id);
    const totalIdleSeconds = logs.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
    const latestLog = logs[0]; // already sorted desc
    return {
      sellerId: s.user_id,
      sellerName: s.name,
      totalIdleMinutes: Math.round(totalIdleSeconds / 60),
      idlePeriods: logs.length,
      daysSinceLastSale: latestLog?.days_since_last_sale ?? 0,
    };
  });
}

/** Parse strengths/weaknesses from string to array */
export function parseList(str: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fallback: comma-separated
  }
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}
