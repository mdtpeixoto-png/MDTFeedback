import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Phone, Settings,
  LogOut, BarChart3, Notebook, Shield, Cog, AlertTriangle, DollarSign
} from "lucide-react";
import { cn, formatName } from "@/lib/utils";

interface SidebarUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface SidebarProps {
  user: SidebarUser;
  onLogout: () => void;
}

const roleMenus: Record<string, { label: string; path: string; icon: ReactNode }[]> = {
  developer: [
    { label: "Dashboard", path: "/dev", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Funcionários", path: "/dev/users", icon: <Users className="h-4 w-4" /> },
    { label: "Alertas", path: "/dev/alerts", icon: <AlertTriangle className="h-4 w-4" /> },
    { label: "Configurações", path: "/dev/settings", icon: <Cog className="h-4 w-4" /> },
  ],
  admin: [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Vendedores", path: "/admin/sellers", icon: <Users className="h-4 w-4" /> },
    { label: "Vendas", path: "/admin/sales", icon: <DollarSign className="h-4 w-4" /> },
    { label: "Ligações", path: "/admin/calls", icon: <Phone className="h-4 w-4" /> },
    { label: "Alertas", path: "/admin/alerts", icon: <AlertTriangle className="h-4 w-4" /> },
    { label: "Configurações", path: "/admin/settings", icon: <Cog className="h-4 w-4" /> },
  ],
  seller: [
    { label: "Meu Painel", path: "/seller", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Feedbacks", path: "/seller/feedbacks", icon: <Phone className="h-4 w-4" /> },
    { label: "Anotações", path: "/seller/notes", icon: <Notebook className="h-4 w-4" /> },
    { label: "Configurações", path: "/seller/settings", icon: <Cog className="h-4 w-4" /> },
  ],
};

const roleBadge: Record<string, { label: string; icon: ReactNode }> = {
  developer: { label: "Desenvolvedor", icon: <Shield className="h-3 w-3" /> },
  admin: { label: "Administrador", icon: <Settings className="h-3 w-3" /> },
  seller: { label: "Vendedor", icon: <Phone className="h-3 w-3" /> },
};

export default function AppSidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation();
  const menu = roleMenus[user.role] || [];
  const badge = roleBadge[user.role];

  return (
    <aside className="flex flex-col w-64 h-screen bg-sidebar border-r border-sidebar-border sticky top-0 shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center h-10 w-10">
          <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-accent-foreground tracking-tight">MDTFeedback</h1>
          <p className="text-[10px] text-sidebar-foreground uppercase tracking-widest">Call Center Analytics</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
              {formatName(user.name)}
            </p>
            {badge && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary uppercase tracking-wider">
                {badge.icon} {badge.label}
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-md text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
