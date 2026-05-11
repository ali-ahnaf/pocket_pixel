import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  title?: string;
}

export function Card({ elevated = false, title, className, children, ...props }: CardProps) {
  return (
    <div className={cn(elevated ? "card-elevated" : "card", className)} {...props}>
      {title && (
        <p className="font-anybody font-bold text-on-surface-variant uppercase text-label-caps mb-block-3 tracking-wider">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

export interface WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Window({ title, children, className }: WindowProps) {
  return (
    <div className={cn("pixel-window", className)}>
      <div className="pixel-window-header">{title}</div>
      <div className="pixel-window-body">{children}</div>
    </div>
  );
}
