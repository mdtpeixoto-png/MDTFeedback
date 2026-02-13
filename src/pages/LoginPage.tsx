import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, Shield, Settings, Phone } from "lucide-react";
import { User } from "@/lib/mockData";

const roles: { value: User['role']; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'developer', label: 'Desenvolvedor', icon: <Shield className="h-5 w-5" />, desc: 'Acesso total ao sistema' },
  { value: 'admin', label: 'Administrador', icon: <Settings className="h-5 w-5" />, desc: 'Gestão da operação' },
  { value: 'seller', label: 'Vendedor', icon: <Phone className="h-5 w-5" />, desc: 'Painel individual' },
];

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<User['role'] | null>(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedRole) return;
    const userMap: Record<string, User> = {
      developer: { id: '8', name: 'Dev Master', email: 'dev@mdt.com', role: 'developer' },
      admin: { id: '7', name: 'Rafael Mendes', email: 'rafael@mdt.com', role: 'admin' },
      seller: { id: '1', name: 'Carlos Silva', email: 'carlos@mdt.com', role: 'seller' },
    };
    const user = userMap[selectedRole];
    onLogin(user);
    const paths: Record<string, string> = { developer: '/dev', admin: '/admin', seller: '/seller' };
    navigate(paths[selectedRole]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary mb-4">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MDTFeedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise de desempenho para call centers</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3 mb-6">
          {roles.map((role) => (
            <motion.button
              key={role.value}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedRole(role.value)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 text-left ${
                selectedRole === role.value
                  ? 'border-primary bg-primary/5 shadow-[0_0_20px_-5px_hsl(174_72%_46%_/_0.3)]'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <div className={`flex items-center justify-center h-10 w-10 rounded-lg ${
                selectedRole === role.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
                {role.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{role.label}</p>
                <p className="text-xs text-muted-foreground">{role.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={!selectedRole}
          className="w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:opacity-90"
        >
          Entrar como {selectedRole ? roles.find(r => r.value === selectedRole)?.label : '...'}
        </motion.button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo mode — selecione um perfil para explorar
        </p>
      </motion.div>
    </div>
  );
}
