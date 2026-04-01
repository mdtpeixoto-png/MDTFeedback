import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  url: string | null;
  label?: string;
}

export default function DownloadButton({ url, label = "Download da Ligação" }: DownloadButtonProps) {
  if (!url) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
