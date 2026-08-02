"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl bg-bg-tertiary/50 border border-border-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue",
              "hover:border-border-hover",
              icon && "pl-10",
              error && "border-rose-500/50 focus:ring-rose-500/50",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-bg-tertiary/50 border border-border-primary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue",
            "hover:border-border-hover",
            error && "border-rose-500/50 focus:ring-rose-500/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
