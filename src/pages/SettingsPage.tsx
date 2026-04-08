import { useState, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon, Settings, Upload, FileText, Check, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_PDF_BASE64 = "JVBERi0xLjQKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUiAvRjMgNCAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YxIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKMyAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMiAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0Jhc2VGb250IC9Db3VyaWVyIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMyAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0NvbnRlbnRzIDEwIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDkgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0NvbnRlbnRzIDExIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1LjI3NTYgODQxLjg4OTggXSAvUGFyZW50IDkgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA5IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKOCAwIG9iago8PAovQXV0aG9yIChcKGFub255bW91c1wpKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwNDA4MTQwODM0KzAwJzAwJykgL0NyZWF0b3IgKFwodW5zcGVjaWZpZWRcKSkgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwNDA4MTQwODM0KzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKFwodW5zcGVjaWZpZWRcKSkgL1RpdGxlIChcKGFub255bW91c1wpKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjkgMCBvYmoKPDwKL0NvdW50IDIgL0tpZHMgWyA1IDAgUiA2IDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKMTAgMCBvYmoKPDwKL0ZpbHRlciBbIC9BU0NJSTg1RGVjb2RlIC9GbGF0ZURlY29kZSBdIC9MZW5ndGggMTg0Mgo+PgpzdHJlYW0KR2F0bTxIWi5YcyZIPXRlaVhmS189dTxOVTRZLWooSjBvN0NbcEc2T2NAPnAiJHE/cylbP0JgTTtPVklkR01lTy89RlM/Ylo5alNOKjA1PFk0NUw+bEAsYVFHW2lZXkI6UztidEo1RFdXSl81XGRQOUtRRzdvKVhOakUuQltwMVRMUGY8dSpPPXRaRGFEMWU0T2s3VW4iU25kakdhRzIiKThLKT1qMHJnbTNbMGxSaSJQNUtBPG5Icm1EPyklK0Q/Z19sKGFLVlNjKS1lRCQoK1dFTCM0TzI9LkJOaWJsQEFALT06M1AoL0BxbCwxOC4+Q2RVamJCTUgxUk5tMDJcVSVyOy9eOz4mNi5KdTxqOF1EPDVbbTVTPSo5Jj8+Y1tdUmVNbyo1M15dNlMrM0pUa3EwVFljQD5gY0NNPU45SmlgbHRBWG1zby1HQzcmM0M+ZHI+V10nNmM0bF8oXyRjYy9VNlcsMy1JXTQlKzNIKERIPFlGZzNgMVVJT2xXJUhhN2QnXktob10mPUIvLVlyQnJmaTFQPT1BOzROYUNfazRHR1FbVUhGYmBpL3Q/cmJIaDt0PU5hcUlqXTZFaGp0LFEvL1goISQzZVRtL0dTWU5CU1FZZEo7K1NAQC8vNjJEUzkkJGZLTz03OUI6bydOcmpEbD4pXD4+Qm0/VlpRNiwzMVdiWD9hXWo4UzgnXypyaTNcZig0LEMoUm9fWDRjRy1AdC1WLzlsPC9oWTdDbWFWYjtKQlNEOSpZRTZfQDFKNihpR2g4ZXAtR1FOcS9bUmVfKlNOLU5nazQtPzFPdE1wbS0mQ19VU2YpN1ZALyNLIm4zcHVdLWJkMSVbLj9zUFRybz80IU4rXGVDTkc9KWUlQSdXKSJFQThicDhLTGVMP2xXQTpIMyspOWJham9aX2g8ZzpjKUI7WyZncFZzN3EwNHVAI0AwNE9FXmZWI0gyJy9AMzY8PTc2LEI6XTVnJi8oUlRRMzc3JW1kaTg4KiY4MzVgMUhAdGVnU1QxVy9dWTUlMD0uV0ZnNmFhJT8kYjFYLVUzOGRoX1VgR2VBaDhIbENtSW4oMkJEWUQ+RFBEaU1QXi5XbSo9YTZGOnVjZXU+KGxnX1VMWHBSJkFENFgiLUtOMmgoIzNzakZzNUVPdTFzKmxwQT5xW3NaSzY/S1MtSXVbLC5Gaiosb=" ;

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
