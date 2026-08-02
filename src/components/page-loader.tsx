'use client';

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface PageLoaderProps extends HTMLAttributes<HTMLDivElement> {
  overlay?: boolean;
}

export function PageLoader({ overlay = false, className, ...props }: PageLoaderProps) {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];
  const delays = ['0s', '0.1s', '0.2s', '0.3s', '0.4s'];

  const animation = (
    <div className="flex flex-col items-center gap-3">
      <title>Loading...</title>
      <div className="flex h-10 items-end gap-2">
        {delays.map((delay, index) => (
          <div
            key={index}
            className="relative h-4 w-4 overflow-hidden rounded-full animate-wave"
            style={{
              animationDelay: delay,
              backgroundColor: colors[index],
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-full bg-white/20 shimmer-overlay" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-loader-bar" />
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className={cn("fixed inset-0 z-[999] flex items-center justify-center bg-background/80 backdrop-blur-sm", className)}
        {...props}
      >
        {animation}
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-screen w-full items-center justify-center bg-background", className)}
      {...props}
    >
      {animation}
    </div>
  );
}
