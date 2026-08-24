import { cn } from "@/lib/cn";
import { forwardRef, SelectHTMLAttributes } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-sm border border-line bg-panel px-3 pr-8 font-sans text-sm text-ink",
        "focus-visible:outline-none focus-visible:border-bid/60 focus-visible:ring-1 focus-visible:ring-bid/40",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
