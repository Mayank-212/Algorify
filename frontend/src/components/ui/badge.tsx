"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variant === "default" && "bg-bg-tertiary text-text-secondary border border-border-primary",
        variant === "success" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        variant === "warning" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        variant === "danger" && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        variant === "info" && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        variant === "purple" && "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "purple" | "emerald" | "amber" | "rose" | "cyan";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorMap = {
    blue: "from-accent-blue to-blue-400",
    purple: "from-accent-purple to-purple-400",
    emerald: "from-accent-emerald to-emerald-400",
    amber: "from-accent-amber to-amber-400",
    rose: "from-accent-rose to-rose-400",
    cyan: "from-accent-cyan to-cyan-400",
  };

  const sizeMap = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-text-muted">Progress</span>
          <span className="text-xs font-medium text-text-secondary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-bg-tertiary overflow-hidden",
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
            colorMap[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const sizeMap = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover border-2 border-border-primary",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold bg-gradient-to-br from-accent-blue to-accent-purple text-white",
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
