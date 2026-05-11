import { cn } from "@/lib/utils";

export type ProgressVariant = "primary" | "secondary" | "tertiary" | "error";

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  label?: string;
  showValue?: boolean;
  className?: string;
}

const blockColor: Record<ProgressVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  tertiary: "bg-tertiary",
  error: "bg-error",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  label,
  showValue = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const totalBlocks = 16;
  const filledBlocks = Math.round(pct * totalBlocks);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="pixel-input-label mb-0">{label}</span>}
          {showValue && (
            <span className="font-mono text-label-caps text-on-surface-variant">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
        {Array.from({ length: totalBlocks }, (_, i) => (
          <div
            key={i}
            className={cn(
              "progress-block",
              i < filledBlocks ? blockColor[variant] : "bg-surface-container-high"
            )}
          />
        ))}
      </div>
    </div>
  );
}
