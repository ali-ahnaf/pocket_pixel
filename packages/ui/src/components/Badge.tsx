import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "primary" | "secondary" | "tertiary" | "error" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClass: Record<BadgeVariant, string> = {
  primary: "pixel-badge-primary",
  secondary: "pixel-badge-secondary",
  tertiary: "pixel-badge-tertiary",
  error: "pixel-badge-error",
  outline: "pixel-badge-outline",
};

export function Badge({ variant = "outline", className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(variantClass[variant], className)} {...props}>
      {children}
    </span>
  );
}
