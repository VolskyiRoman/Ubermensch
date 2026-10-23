export type DailyCategory = 'workout' | 'habit' | 'food' | 'sleep';

/** One segment of the daily donut: today's workout or a habit / food / sleep item. */
export type DailyItem = {
  id: string;
  /** Lowercase name used in the "Залишилось: …" line. */
  title: string;
  category: DailyCategory;
  done: boolean;
};

export type TodayWorkout = {
  id: number;
  name: string;
  exerciseCount: number;
  supersetCount: number;
  estimatedMin: number;
  done: boolean;
  inProgress: boolean;
};

export type DayVolume = {
  /** 'YYYY-MM-DD' */
  date: string;
  volumeKg: number;
};

export type LatestPr = {
  /** 'YYYY-MM-DD' */
  date: string;
  exercise: string;
  weightKg: number;
  reps: number;
};

export type DashboardData = {
  /** 'YYYY-MM-DD' */
  today: string;
  perfectDayStreak: number;
  perfectDayBest: number;
  dailyItems: DailyItem[];
  categoryStreaks: Record<DailyCategory, number>;
  todayWorkout: TodayWorkout | null;
  /** Last 7 days, oldest first, ending today. */
  weekVolume: DayVolume[];
  previousWeekVolumeKg: number;
  latestPr: LatestPr | null;
  totals: {
    workouts: number;
    avgDurationMin: number;
    volumeKg: number;
  };
};
