'use client';

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function LiquidLoader(props: HTMLAttributes<HTMLDivElement>) {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];
  const delays = ['0s', '0.1s', '0.2s', '0.3s', '0.4s'];

  return (
    <div className={cn("flex h-5 items-end gap-[6px]", props.className)} {...props}>
      <title>Loading...</title>
      {delays.map((delay, index) => (
        <div
          key={index}
          className="relative h-2 w-2 overflow-hidden rounded-full animate-wave"
          style={{
            animationDelay: delay,
            backgroundColor: colors[index],
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-full bg-white/20 shimmer-overlay" />
        </div>
      ))}
    </div>
  );
}
