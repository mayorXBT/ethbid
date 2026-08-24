import { cn } from "@/lib/cn";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-line bg-void px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute",
        className,
      )}
    >
      {children}
    </span>
  );
}
