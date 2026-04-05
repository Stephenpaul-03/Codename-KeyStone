import { TransactionFilters, TransactionType } from "../utils/types";
import {
  createDefaultFilters,
  FilterChip,
  normalizeFilterPayload,
} from "../utils/filters";
import { getDateRangeFromPreset } from "../utils/helpers";
import { useState } from "react";

export function useTransactionFilters() {
  const [filtersByType, setFiltersByType] = useState<
    Record<TransactionType, TransactionFilters>
  >({
    income: createDefaultFilters(),
    expense: createDefaultFilters(),
  });

  const handleApplyFilters = (
    type: TransactionType,
    filters: TransactionFilters,
  ) => {
    setFiltersByType((prev) => ({
      ...prev,
      [type]: normalizeFilterPayload(filters),
    }));
  };

  const handleResetFilters = (type: TransactionType) => {
    setFiltersByType((prev) => ({
      ...prev,
      [type]: createDefaultFilters(),
    }));
  };

  const handleRemoveFilterChip = (
    type: TransactionType,
    chipKey: FilterChip["key"],
  ) => {
    setFiltersByType((prev) => {
      const current = prev[type];

      if (chipKey === "category") {
        return { ...prev, [type]: { ...current, category: "all" } };
      }

      if (chipKey === "account") {
        return { ...prev, [type]: { ...current, account: "all" } };
      }

      if (chipKey === "period") {
        const monthRange = getDateRangeFromPreset("month");
        return {
          ...prev,
          [type]: {
            ...current,
            datePreset: "month",
            date: monthRange ? { ...monthRange } : undefined,
          },
        };
      }

      const nextDate = { ...current.date };
      if (chipKey === "dateStart") nextDate.start = undefined;
      if (chipKey === "dateEnd") nextDate.end = undefined;

      const hasDate = Boolean(nextDate.start || nextDate.end);
      const monthRange = getDateRangeFromPreset("month");

      return {
        ...prev,
        [type]: {
          ...current,
          datePreset: hasDate ? "custom" : "month",
          date: hasDate ? nextDate : monthRange ? { ...monthRange } : undefined,
        },
      };
    });
  };

  return {
    filtersByType,
    handleApplyFilters,
    handleResetFilters,
    handleRemoveFilterChip,
  };
}