import { AlertCircle } from "lucide-react";
import { Button } from "@frontend/components/ui/button";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  const handleRetry = onRetry || (() => window.location.reload());

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/10">
      <div className="text-center space-y-4 max-w-md p-6 bg-background rounded-xl border shadow-sm">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Възникна грешка</h2>
        <p className="text-muted-foreground">
          {message || "Неуспешно зареждане на данните."}
        </p>
        <Button onClick={handleRetry}>Опитай отново</Button>
      </div>
    </div>
  );
}