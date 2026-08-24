import { cn } from "@/lib/cn";
import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-sm border border-line bg-panel px-3 font-sans text-sm text-ink placeholder:text-mute/70",
        "focus-visible:outline-none focus-visible:border-bid/60 focus-visible:ring-1 focus-visible:ring-bid/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
