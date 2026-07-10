import React from "react";
import { Skeleton } from "./Skeleton";

export function TableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
