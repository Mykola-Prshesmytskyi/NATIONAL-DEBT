import { APP_VERSION, DEFAULT_DAILY_ALLOWANCE } from "../constants";
import type { AppState } from "../types";
import { todayKey } from "../utils/date";

export function createDefaultState(): AppState {
  const now = new Date().toISOString();
  return {
    version: APP_VERSION,
    settings: {
      startDate: todayKey(),
      dailyAllowance: DEFAULT_DAILY_ALLOWANCE,
      dailyLimits: [{ fromDate: todayKey(), amount: DEFAULT_DAILY_ALLOWANCE }],
      subscriptionBudget: 0,
      dailyLimitEnabled: true,
      language: "uk",
    },
    accounts: [],
    entries: [],
    turnoverProjects: [],
    createdAt: now,
    updatedAt: now,
  };
}
