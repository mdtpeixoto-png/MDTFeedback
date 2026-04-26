import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Settings, Upload, FileText, Check, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_PDF_BASE64 } from "@/lib/apiPdfData";

function downloadPdf() {
  const byteChars = atob(API_PDF_BASE64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "API_MDTFeedback_Documentacao.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  return (
    <div className="max-w-lg space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Preferências</h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Sun className="h-5 w-5 text-warning" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Tema</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? "Modo escuro ativado" : "Modo claro ativado"}
              </p>
            </div>
          </div>
          <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
        </div>
      </div>
    </div>
  );
}
