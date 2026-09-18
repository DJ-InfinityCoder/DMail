import { Mail } from "lucide-react";

export default function FolderPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background/50 text-muted-foreground p-8 text-center animate-fade-in border-l border-border/20">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
        <Mail className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">Select an email to read</h3>
      <p className="text-xs text-muted-foreground max-w-[260px]">
        Choose a message from the list on the left to view the complete thread conversation.
      </p>
    </div>
  );
}
