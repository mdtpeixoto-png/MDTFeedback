import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Settings, Upload, FileText, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      toast({ title: "Formato inválido", description: "Por favor, envie um arquivo Word (.doc ou .docx)", variant: "destructive" });
      return;
    }

    setUploading(true);

    // Simulate processing delay
    setTimeout(() => {
      setUploadedFile(file.name);
      setUploading(false);
      toast({
        title: "Documento importado",
        description: `"${file.name}" foi processado. Os novos parâmetros de avaliação serão aplicados nas próximas análises da IA.`,
      });
    }, 2000);
  };

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

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Parâmetros de Avaliação IA</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Importe um documento Word (.docx) com novos parâmetros de avaliação operacional. A IA usará esses critérios para analisar as ligações.
        </p>

        <label className="relative block cursor-pointer">
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileUpload}
            className="sr-only"
            disabled={uploading}
          />
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 transition-colors">
            {uploading ? (
              <>
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Processando documento...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para importar documento Word</span>
              </>
            )}
          </div>
        </label>

        {uploadedFile && (
          <div className="mt-3 flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4" />
            <span>Último documento: {uploadedFile}</span>
          </div>
        )}
      </div>
    </div>
  );
}
