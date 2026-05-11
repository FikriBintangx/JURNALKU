import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/5", className)}
      {...props}
    />
  );
}

export function JournalCardSkeleton() {
  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2 py-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-grow rounded-xl" />
        <Skeleton className="h-10 w-12 rounded-xl" />
      </div>
    </div>
  );
}
