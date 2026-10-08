import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-md bg-[#1d2227] border border-[#2a2f34]', className)}
      {...props}
    />
  );
}

export { Skeleton };
