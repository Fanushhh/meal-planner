"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STORAGE_KEY = "meal-planner-week-view";

interface WeekViewPersistProps {
  weekStart: string;
  currentWeekStart: string;
}

export function WeekViewPersist({ weekStart, currentWeekStart }: WeekViewPersistProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const weekParam = searchParams.get("week");

    if (weekParam) {
      if (weekStart !== currentWeekStart) {
        localStorage.setItem(STORAGE_KEY, weekStart);
      } else {
        // User explicitly navigated back to current week ("← This week")
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      // No ?week= param — restore saved preference if it's a future week
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored > currentWeekStart) {
        router.replace(`/dashboard?week=${stored}`);
      } else if (stored) {
        // Stored week is now in the past — clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [weekStart, currentWeekStart, searchParams, router]);

  return null;
}
