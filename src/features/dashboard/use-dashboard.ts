import { useDbQuery } from '@/db/use-db-query';
import { todayKey } from '@/lib/dates';

import { loadDashboard } from './load-dashboard';

export function useDashboard() {
  return useDbQuery(() => loadDashboard(todayKey()), []);
}
