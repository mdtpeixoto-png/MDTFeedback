import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatName(name: string): string {
  if (!name) return "";
  const prepositions = ["de", "da", "do", "das", "dos", "e"];
  return name
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
