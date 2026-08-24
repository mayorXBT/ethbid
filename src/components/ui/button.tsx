import { cn } from "@/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bid/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-bid text-void hover:bg-bid/90 text-sm font-semibold uppercase tracking-[0.12em]",
        ghost: "border border-line bg-transparent text-ink hover:border-mute hover:bg-panel",
        rank: "border border-bid/40 bg-bid/10 text-bid hover:bg-bid/20 font-mono text-xs tracking-wide",
        danger: "bg-heat text-void hover:bg-heat/90 font-mono uppercase tracking-wider text-sm",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-8 px-3",
        lg: "h-12 px-6",
        full: "h-12 w-full px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
