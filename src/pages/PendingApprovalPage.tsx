import { motion } from "framer-motion";
import { BarChart3, Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApprovalPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-secondary mb-4">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Aguardando aprovação</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Olá, <span className="text-foreground font-medium">{user?.name}</span>!
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Seu cadastro foi recebido. Um administrador precisa aprovar seu acesso e atribuir seu perfil antes de continuar.
        </p>

        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </motion.div>
    </div>
  );
}
