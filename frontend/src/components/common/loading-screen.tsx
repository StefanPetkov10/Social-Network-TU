import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/10">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Зареждане на съдържанието...</p>
      </div>
    </div>
  );
}