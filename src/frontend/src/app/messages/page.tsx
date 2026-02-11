// app/messages/page.tsx
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
      <div className="bg-muted/50 p-4 rounded-full mb-4">
        <MessageCircle className="h-12 w-12 text-primary/50" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Вашите съобщения</h2>
      <p className="max-w-sm mt-2">
        Изберете чат от списъка вляво или започнете нов разговор с приятел или група.
      </p>
    </div>
  );
}