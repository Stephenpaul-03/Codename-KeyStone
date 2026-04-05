/**
 * Filters Modal Component
 * Filters are independent for income and expense transactions.
 */

import {
  TransactionDatePreset,
  TransactionFilters,
  TransactionType,
} from "../utils/types";
import {
  formatDateForInput,
  getDateRangeFromPreset,
} from "../utils/helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import DateTimePicker, {
  DateType,
  useDefaultStyles,
} from "react-native-ui-datepicker";
import { Button, Chip, Dialog, Menu, Portal, SegmentedButtons, Text, useTheme } from 'react-native-paper';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtersByType: Record<TransactionType, TransactionFilters>;
  onApplyFilters: (type: TransactionType, filters: TransactionFilters) => void;
  onResetFilters: (type: TransactionType) => void;
  incomeCategories: string[];
  expenseCategories: string[];
  defaultType?: TransactionType;
}

function createDefaultFilters(): TransactionFilters {
  const monthRange = getDateRangeFromPreset("month");
  return {
    category: "all",
    account: "all",
    date: monthRange ? { ...monthRange } : undefined,
    datePreset: "month",
    search: undefined,
    tags: undefined,
  };
}

function normalizeFilters(filters?: TransactionFilters): TransactionFilters {
  const normalized: TransactionFilters = {
    ...createDefaultFilters(),
    ...filters,
    date: filters?.date ? { ...filters.date } : undefined,
    datePreset:
      filters?.datePreset ??
      (filters?.date?.start || filters?.date?.end ? "custom" : "month"),
    search: undefined,
    tags: undefined,
  };

  if (normalized.datePreset === "all") {
    normalized.date = undefined;
    return normalized;
  }

  if (
    normalized.datePreset &&
    normalized.datePreset !== "custom" &&
    !normalized.date
  ) {
    const range = getDateRangeFromPreset(normalized.datePreset);
    normalized.date = range ? { ...range } : undefined;
  }

  return normalized;
}

const DATE_PRESET_OPTIONS: {
  key: Exclude<TransactionDatePreset, "custom">;
  label: string;
}[] = [
  { key: "all", label: "All Transactions" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "last3months", label: "Last 3 Months" },
];

function toIsoDateOnly(value: DateType): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return formatDateForInput(parsed);
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return formatDateForInput(parsed);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return formatDateForInput(value);
  }

  const maybeToDate = (value as { toDate?: unknown }).toDate;
  if (typeof maybeToDate === "function") {
    const parsed = (value as { toDate: () => Date }).toDate();
    if (Number.isNaN(parsed.getTime())) return undefined;
    return formatDateForInput(parsed);
  }

  return undefined;
}

export function FiltersModal({
  isOpen,
  onClose,
  filtersByType,
  onApplyFilters,
  onResetFilters,
  incomeCategories,
  expenseCategories,
  defaultType = "expense",
}: FiltersModalProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isMobileLayout = width < 768;
  const modalHorizontalMargin = isMobileLayout ? 12 : 0;
  const modalMaxWidth = Math.max(width - modalHorizontalMargin * 2, 280);
  const modalMaxHeight = Math.max(Math.min(height * 0.9, 760), 460);
  const datePickerStyles = useDefaultStyles(theme.dark ? "dark" : "light");

  const [activeTab, setActiveTab] = useState<TransactionType>(defaultType);
  const [localFiltersByType, setLocalFiltersByType] = useState<
    Record<TransactionType, TransactionFilters>
  >(() => ({
    income: normalizeFilters(filtersByType.income),
    expense: normalizeFilters(filtersByType.expense),
  }));

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(defaultType);
    setLocalFiltersByType({
      income: normalizeFilters(filtersByType.income),
      expense: normalizeFilters(filtersByType.expense),
    });
  }, [defaultType, filtersByType, isOpen]);

  const currentCategories =
    activeTab === "income" ? incomeCategories : expenseCategories;

  const activeFilters = localFiltersByType[activeTab];

  const updateActiveFilters = (
    updater: (prev: TransactionFilters) => TransactionFilters,
  ) => {
    setLocalFiltersByType((prev) => ({
      ...prev,
      [activeTab]: updater(prev[activeTab]),
    }));
  };

  const handleReset = () => {
    const resetValue = createDefaultFilters();
    setLocalFiltersByType((prev) => ({
      ...prev,
      [activeTab]: resetValue,
    }));
    onResetFilters(activeTab);
  };

  const handleApply = () => {
    onApplyFilters(activeTab, normalizeFilters(activeFilters));
    onClose();
  };

  const handleClearDate = () => {
    const monthRange = getDateRangeFromPreset("month");
    updateActiveFilters((prev) => ({
      ...prev,
      datePreset: "month",
      date: monthRange ? { ...monthRange } : undefined,
    }));
  };

  const handleSelectDatePreset = (
    preset: Exclude<TransactionDatePreset, "custom">,
  ) => {
    const nextRange = getDateRangeFromPreset(preset);
    updateActiveFilters((prev) => ({
      ...prev,
      datePreset: preset,
      date: nextRange ? { ...nextRange } : undefined,
    }));
  };

  const activePreset = activeFilters.datePreset ?? "month";

  const dialogWidth = isMobileLayout ? modalMaxWidth : Math.min(720, modalMaxWidth);
  const dialogMaxHeight = isMobileLayout
    ? Math.max(Math.min(height * 0.92, 820), 520)
    : modalMaxHeight;

  return (
    <Portal>
      <Dialog
        visible={isOpen}
        onDismiss={onClose}
        dismissable
        style={[styles.dialog, { width: dialogWidth, maxHeight: dialogMaxHeight }]}>
        <Dialog.Title>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons name="filter-variant" size={20} color={theme.colors.primary} />
            </View>
            <Text variant={isMobileLayout ? "titleLarge" : "headlineSmall"}>Filters</Text>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>
        </Dialog.Title>

        <Dialog.Content style={{ paddingHorizontal: 0 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionGap}>
              <SegmentedButtons
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as TransactionType)}
                buttons={[
                  { value: "expense", label: "Expenses", icon: "trending-down" },
                  { value: "income", label: "Income", icon: "trending-up" },
                ]}
              />

              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                These filters apply only to {activeTab === "income" ? "income" : "expense"}.
              </Text>

              <View>
                <Text variant="labelLarge" style={styles.sectionLabel}>
                  Quick Date Filters
                </Text>
                <View style={styles.chipWrap}>
                  {DATE_PRESET_OPTIONS.map((option) => (
                    <Chip
                      key={option.key}
                      mode="outlined"
                      selected={activePreset === option.key}
                      onPress={() => handleSelectDatePreset(option.key)}
                      style={styles.chip}>
                      {option.label}
                    </Chip>
                  ))}
                  <Chip
                    mode="outlined"
                    selected={activePreset === "custom"}
                    onPress={() =>
                      updateActiveFilters((prev) => ({
                        ...prev,
                        datePreset: "custom",
                        date: prev.date ? { ...prev.date } : undefined,
                      }))
                    }
                    style={styles.chip}>
                    Custom
                  </Chip>
                </View>
              </View>

              <View>
                <Text variant="labelLarge" style={styles.sectionLabel}>
                  Date Range
                </Text>
                <View style={[styles.twoCol, isMobileLayout && styles.twoColMobile]}>
                  <View style={styles.col}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      From
                    </Text>
                    <View style={[styles.readonlyBox, { borderColor: theme.colors.outlineVariant }]}>
                      <Text style={{ color: activeFilters.date?.start ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                        {activeFilters.date?.start || "Select date"}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={16} color={theme.colors.onSurfaceVariant} />
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      To
                    </Text>
                    <View style={[styles.readonlyBox, { borderColor: theme.colors.outlineVariant }]}>
                      <Text style={{ color: activeFilters.date?.end ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                        {activeFilters.date?.end || "Select date"}
                      </Text>
                      <MaterialCommunityIcons name="calendar-month-outline" size={16} color={theme.colors.onSurfaceVariant} />
                    </View>
                  </View>
                </View>

                {activePreset === "custom" ? (
                  <View style={[styles.datePickerBox, { borderColor: theme.colors.outlineVariant }]}>
                    <DateTimePicker
                      mode="range"
                      startDate={activeFilters.date?.start}
                      endDate={activeFilters.date?.end}
                      styles={datePickerStyles}
                      onChange={({ startDate, endDate }) => {
                        const nextStart = toIsoDateOnly(startDate);
                        const nextEnd = toIsoDateOnly(endDate);
                        const start = nextStart && nextEnd && nextStart > nextEnd ? nextEnd : nextStart;
                        const end = nextStart && nextEnd && nextStart > nextEnd ? nextStart : nextEnd;

                        updateActiveFilters((prev) => ({
                          ...prev,
                          datePreset: "custom",
                          date: start || end ? { start, end } : undefined,
                        }));
                      }}
                    />
                  </View>
                ) : null}

                {(activeFilters.date?.start || activeFilters.date?.end) ? (
                  <Pressable accessibilityRole="button" onPress={handleClearDate} style={styles.clearDate}>
                    <MaterialCommunityIcons
                      name="close-circle-outline"
                      size={14}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>Clear date range</Text>
                  </Pressable>
                ) : null}
              </View>

              <View>
                <Text variant="labelLarge" style={styles.sectionLabel}>
                  Category
                </Text>
                <Menu
                  visible={categoryMenuOpen}
                  onDismiss={() => setCategoryMenuOpen(false)}
                  anchor={
                    <Button mode="outlined" onPress={() => setCategoryMenuOpen(true)}>
                      {activeFilters.category === "all" ? "All categories" : activeFilters.category}
                    </Button>
                  }>
                  <Menu.Item
                    title="All Categories"
                    onPress={() => {
                      updateActiveFilters((prev) => ({ ...prev, category: "all" }));
                      setCategoryMenuOpen(false);
                    }}
                  />
                  {currentCategories.map((category) => (
                    <Menu.Item
                      key={category}
                      title={category}
                      onPress={() => {
                        updateActiveFilters((prev) => ({ ...prev, category }));
                        setCategoryMenuOpen(false);
                      }}
                    />
                  ))}
                </Menu>
              </View>

              <View>
                <Text variant="labelLarge" style={styles.sectionLabel}>
                  Account
                </Text>
                <Menu
                  visible={accountMenuOpen}
                  onDismiss={() => setAccountMenuOpen(false)}
                  anchor={
                    <Button mode="outlined" onPress={() => setAccountMenuOpen(true)}>
                      {activeFilters.account === "all"
                        ? "All accounts"
                        : activeFilters.account === "cash"
                          ? "Cash"
                          : "Card"}
                    </Button>
                  }>
                  <Menu.Item
                    title="All Accounts"
                    onPress={() => {
                      updateActiveFilters((prev) => ({ ...prev, account: "all" }));
                      setAccountMenuOpen(false);
                    }}
                  />
                  <Menu.Item
                    title="Cash"
                    onPress={() => {
                      updateActiveFilters((prev) => ({ ...prev, account: "cash" }));
                      setAccountMenuOpen(false);
                    }}
                  />
                  <Menu.Item
                    title="Card"
                    onPress={() => {
                      updateActiveFilters((prev) => ({ ...prev, account: "card" }));
                      setAccountMenuOpen(false);
                    }}
                  />
                </Menu>
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button mode="outlined" onPress={handleReset} icon="filter-remove">
            Reset
          </Button>
          <Button mode="contained" onPress={handleApply} icon="check">
            Apply {activeTab === "income" ? "Income" : "Expense"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 18,
  },
  sectionGap: {
    gap: 18,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 0,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  twoColMobile: {
    flexDirection: 'column',
  },
  col: {
    flex: 1,
    gap: 6,
  },
  readonlyBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerBox: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 8,
  },
  clearDate: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
});
