import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="pixel-input-label">
          {label}
        </label>
      )}
      <input id={inputId} className={cn("pixel-input", error && "border-error", className)} {...props} />
      {error && (
        <p className="font-mono text-label-caps text-error mt-1 uppercase">{error}</p>
      )}
    </div>
  );
}
