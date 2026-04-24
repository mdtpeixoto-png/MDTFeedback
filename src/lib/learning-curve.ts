
import { startOfMonth, addDays, isWeekend, format, isAfter, differenceInDays } from "date-fns";

/**
 * Calculates the 5th business day of a given month.
 * Business days are Monday to Friday.
 */
export function getFifthBusinessDay(date: Date): Date {
  let count = 0;
  let current = startOfMonth(date);
  
  while (count < 5) {
    if (!isWeekend(current)) {
      count++;
    }
    if (count < 5) {
      current = addDays(current, 1);
    }
  }
  
  return current;
}

/**
 * Gets the start date of the current billing period (the most recent 5th business day).
 */
export function getCurrentPeriodStart(): Date {
  const now = new Date();
  const currentMonthFifth = getFifthBusinessDay(now);
  
  // If we haven't reached the 5th business day of the current month yet,
  // the period started on the 5th business day of the previous month.
  if (isAfter(currentMonthFifth, now)) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return getFifthBusinessDay(prevMonth);
  }
  
  return currentMonthFifth;
}

export interface LearningCurvePoint {
  date: string;
  score: number;
}

/**
 * Calculates a performance score for a single call.
 * Based on: Strengths, Weaknesses, Sales status, and Technical Quality.
 */
export function calculateCallScore(ligacao: any): number {
  // Base points for technical quality (0-100)
  let score = (ligacao.technical_quality ?? 5) * 10;
  
  // Bonus for sales
  if (ligacao.status) score += 20;
  
  // Bonus/Penalty for points
  const strengths = (ligacao.pontos_bons ?? "").split("\n").filter(Boolean).length;
  const weaknesses = (ligacao.pontos_ruins ?? "").split("\n").filter(Boolean).length;
  
  score += strengths * 5;
  score -= weaknesses * 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the learning efficiency ratio: (Cumulative Sales / Days Active)
 * Returns a score from 0-100 where 2.0 sales/day is considered 100%.
 */
export function calculateEfficiencyRatio(totalSales: number, startDate: Date): number {
  const days = Math.max(1, differenceInDays(new Date(), startDate) + 1);
  const ratio = totalSales / days;
  // If 2 sales per day is the target for 100 score
  return Math.min(100, Math.round(ratio * 50)); 
}
