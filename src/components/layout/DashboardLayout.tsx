import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { User } from "@/lib/mockData";

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ user, onLogout, children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-5">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
