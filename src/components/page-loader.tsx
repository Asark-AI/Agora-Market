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
    <div className="flex h-10 items-end gap-2">
      <title>Loading...</title>
      {delays.map((delay, index) => (
        <div
          key={index}
          className="h-4 w-4 rounded-full animate-wave"
          style={{
            animationDelay: delay,
            backgroundColor: colors[index],
          }}
        />
      ))}
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
