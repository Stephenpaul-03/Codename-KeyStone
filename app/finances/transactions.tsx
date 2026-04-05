/**
 * Transactions Page
 * Source of truth for all financial data
 *
 * Mobile: Tab-based layout (Expenses | Income)
 * Web: Side-by-side sections (both visible)
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { CategoryManagementModal } from "./components/CategoryManagementModal";
import { ConfirmActionModal } from "./components/ConfirmActionModal";
import { FiltersModal } from "./components/FiltersModal";
import { TransactionFilterChips } from "./components/Transactionfilterchips";
import { TransactionModal } from "./components/TransactionModal";
import { TransactionRow } from "./components/TransactionRow";
import { useCategoryManagement } from "./hooks/useCategoryManagement";
import { useTransactionFilters } from "./hooks/Usetransactionfilters";
import {
  closeModal,
  importTransactions,
  openAddModal,
  openEditModal,
  selectActiveExpenseCategories,
  selectActiveIncomeCategories,
  selectExpenseTransactions,
  selectIncomeTransactions,
  selectIsModalOpen,
  selectNonDeletedTransactions,
  softDeleteTransaction,
} from "./slices/transactionSlice";
import { countActiveFilters } from "./utils/filters";
import { calculateTotal, formatCurrencyWithSymbol, matchesFilters, sortByDate } from "./utils/helpers";
import { Transaction, TransactionType } from "./utils/types";

function TitleBar({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Text variant="headlineSmall">{title}</Text>
      <View style={{ flex: 1 }} />
    </View>
  );
}

export default function Transactions() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== "web" || width < 768;

  const colors = {
    background: {
      primary: theme.colors.background,
      card: theme.colors.elevation.level1,
    },
    border: {
      primary: theme.colors.outlineVariant,
    },
    text: {
      primary: theme.colors.onSurface,
      secondary: theme.colors.onSurfaceVariant,
      muted: theme.colors.onSurfaceVariant,
    },
  };

  const expenseTone = {
    bg: theme.colors.errorContainer,
    border: theme.colors.error,
    text: theme.colors.error,
    icon: theme.colors.error,
  };
  const incomeTone = {
    bg: theme.colors.primaryContainer,
    border: theme.colors.primary,
    text: theme.colors.primary,
    icon: theme.colors.primary,
  };

  const nonDeletedTransactions = useSelector(selectNonDeletedTransactions);
  const incomeTransactions = useSelector(selectIncomeTransactions);
  const expenseTransactions = useSelector(selectExpenseTransactions);
  const incomeCategories = useSelector(selectActiveIncomeCategories);
  const expenseCategories = useSelector(selectActiveExpenseCategories);
  const isModalOpen = useSelector(selectIsModalOpen);

  const [activeTab, setActiveTab] = useState<TransactionType>("expense");
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { filtersByType, handleApplyFilters, handleResetFilters, handleRemoveFilterChip } = useTransactionFilters();
  const categoryManagement = useCategoryManagement(activeTab);

  const filteredIncomeTransactions = useMemo(() => {
    return sortByDate(incomeTransactions).filter((t) => matchesFilters(t, filtersByType.income));
  }, [incomeTransactions, filtersByType.income]);

  const filteredExpenseTransactions = useMemo(() => {
    return sortByDate(expenseTransactions).filter((t) => matchesFilters(t, filtersByType.expense));
  }, [expenseTransactions, filtersByType.expense]);

  const incomeTotal = calculateTotal(filteredIncomeTransactions);
  const expenseTotal = calculateTotal(filteredExpenseTransactions);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filtersByType.income) + countActiveFilters(filtersByType.expense),
    [filtersByType],
  );
  const hasActiveFilters = activeFilterCount > 0;

  const handleDelete = (id: string) => setPendingDeleteId(id);
  const handleCancelDelete = () => setPendingDeleteId(null);
  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    dispatch(softDeleteTransaction(pendingDeleteId));
    setPendingDeleteId(null);
  };

  const renderEmptyState = (type: TransactionType) => {
    const isIncome = type === "income";
    const tone = isIncome ? incomeTone : expenseTone;

    return (
      <View
        style={[
          styles.emptyCard,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.primary,
          },
        ]}>
        <View style={[styles.emptyIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <MaterialCommunityIcons name={isIncome ? "trending-up" : "trending-down"} size={24} color={tone.icon} />
        </View>
        <Text variant="titleLarge" style={{ color: colors.text.primary, textAlign: "center" }}>
          {isIncome ? "No Income Found" : "No Expenses Found"}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.text.secondary, textAlign: "center" }}>
          {isIncome ? "Try Adjusting Filters Or Add A New Income Entry" : "Try Adjusting Filters Or Add A New Expense Entry"}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => dispatch(openAddModal(type))} style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.onPrimary, fontWeight: "600" }}>{isIncome ? "Add Income" : "Add Expense"}</Text>
        </Pressable>
      </View>
    );
  };

  const renderTransactionList = (transactions: Transaction[], type: TransactionType) => {
    if (transactions.length === 0) return renderEmptyState(type);
    return (
      <View style={{ gap: 10 }}>
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onEdit={() => dispatch(openEditModal(transaction.id))}
            onDelete={() => handleDelete(transaction.id)}
            isMobile={isMobile}
          />
        ))}
      </View>
    );
  };

  const renderWebLayout = () => (
    <View style={styles.webRow}>
      {(["expense", "income"] as TransactionType[]).map((type) => {
        const isExpense = type === "expense";
        const tone = isExpense ? expenseTone : incomeTone;
        const transactions = isExpense ? filteredExpenseTransactions : filteredIncomeTransactions;
        const total = isExpense ? expenseTotal : incomeTotal;

        return (
          <View
            key={type}
            style={[
              styles.webColCard,
              { backgroundColor: colors.background.card, borderColor: colors.border.primary },
            ]}>
            <View style={styles.webColHeader}>
              <View style={styles.webColHeaderLeft}>
                <View style={[styles.webColIcon, { backgroundColor: tone.icon }]}>
                  <MaterialCommunityIcons name={isExpense ? "trending-down" : "trending-up"} size={18} color="white" />
                </View>
                <Text variant="labelLarge" style={{ color: colors.text.primary }}>
                  {isExpense ? "EXPENSES" : "INCOME"}
                </Text>
              </View>

              <View style={[styles.totalPill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Text variant="labelLarge" style={{ color: tone.text }}>
                  {formatCurrencyWithSymbol(total, "", false)}
                </Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>{renderTransactionList(transactions, type)}</ScrollView>
          </View>
        );
      })}
    </View>
  );

  const handleImport = async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const text = await file.text();
          const rawData = JSON.parse(text);
          const transactions = Array.isArray(rawData.transactions)
            ? rawData.transactions
            : Array.isArray(rawData)
              ? rawData
              : [];
          if (!Array.isArray(transactions) || transactions.length === 0) {
            Alert.alert("Error", "Invalid or empty JSON. Expected { transactions: [...] } or flat [] array.");
            return;
          }
          dispatch(importTransactions(transactions));
          // Imported data is often outside the default "This Month" filter, so show everything.
          handleApplyFilters("income", { category: "all", account: "all", datePreset: "all", date: undefined });
          handleApplyFilters("expense", { category: "all", account: "all", datePreset: "all", date: undefined });
          Alert.alert("Success", `Imported ${transactions.length} transactions!`);
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/json"],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const assetUri = result.assets?.[0]?.uri;
        if (!assetUri) return;
        const jsonStr = await FileSystem.readAsStringAsync(assetUri);
        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data.transactions)) {
          Alert.alert("Error", "Invalid JSON format. Expected { transactions: [...] }");
          return;
        }
        dispatch(importTransactions(data.transactions));
        handleApplyFilters("income", { category: "all", account: "all", datePreset: "all", date: undefined });
        handleApplyFilters("expense", { category: "all", account: "all", datePreset: "all", date: undefined });
        Alert.alert("Success", `Imported ${data.transactions.length} transactions!`);
      }
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Error", "Failed to import data.");
    }
  };

  const handleExport = async () => {
    try {
      const exportData = { transactions: nonDeletedTransactions };
      const jsonStr = JSON.stringify(exportData, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nest-transactions-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert("Success", `Exported ${nonDeletedTransactions.length} transactions!`);
      } else {
        console.log("🧾 NEST EXPORT JSON (copy this to save as .json):", jsonStr);
        Alert.alert(
          "Exported to Console",
          `Copied ${nonDeletedTransactions.length} transactions to console. Copy JSON and save.`,
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <TitleBar title="Transactions" />

      <View style={[styles.body, { paddingHorizontal: isMobile ? 16 : 24, paddingBottom: isMobile ? 110 : 90 }]}>
        {isMobile ? (
          <View style={styles.tabsCardsRow}>
            {(["expense", "income"] as TransactionType[]).map((type) => {
              const isExpense = type === "expense";
              const tone = isExpense ? expenseTone : incomeTone;
              const total = isExpense ? expenseTotal : incomeTotal;
              const isActive = activeTab === type;

              return (
                <Pressable key={type} accessibilityRole="button" onPress={() => setActiveTab(type)} style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.tabCard,
                      {
                        backgroundColor: isActive ? tone.bg : colors.background.card,
                        borderColor: isActive ? tone.border : colors.border.primary,
                      },
                    ]}>
                    <View style={styles.tabCardTop}>
                      <View>
                        <Text variant="labelSmall" style={{ color: colors.text.muted }}>
                          {isExpense ? "EXPENSE" : "INCOME"}
                        </Text>
                        <Text variant="headlineSmall" style={{ color: tone.text }}>
                          {formatCurrencyWithSymbol(total, "", false)}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name={isExpense ? "trending-down" : "trending-up"} size={20} color={tone.icon} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {hasActiveFilters ? (
          <TransactionFilterChips
            filtersByType={filtersByType}
            activeFilterCount={activeFilterCount}
            expenseTone={expenseTone}
            incomeTone={incomeTone}
            onRemoveChip={handleRemoveFilterChip}
          />
        ) : null}

        {isMobile ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {activeTab === "expense"
              ? renderTransactionList(filteredExpenseTransactions, "expense")
              : renderTransactionList(filteredIncomeTransactions, "income")}
          </ScrollView>
        ) : (
          renderWebLayout()
        )}
      </View>

      {/* Bottom-left action bar */}
      <View style={styles.bottomLeft}>
        <ActionPill
          label={`Filters${hasActiveFilters ? ` (${activeFilterCount})` : ""}`}
          icon={hasActiveFilters ? "filter-variant" : "filter-outline"}
          onPress={() => setIsFiltersModalOpen(true)}
          active={hasActiveFilters}
        />
        <ActionPill label="Categories" icon="tag-multiple-outline" onPress={() => categoryManagement.handleOpenManagement(activeTab)} />
        <ActionPill label="Import" icon="file-import-outline" onPress={handleImport} />
        <ActionPill label="Export" icon="file-export-outline" onPress={handleExport} />
      </View>

      {/* Bottom-right add button */}
      <Pressable
        accessibilityRole="button"
        onPress={() => dispatch(openAddModal(activeTab))}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}>
        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} />
        <Text style={{ color: theme.colors.onPrimary, fontWeight: "700" }}>Add</Text>
      </Pressable>

      <TransactionModal isOpen={isModalOpen} onClose={() => dispatch(closeModal())} defaultType={activeTab} />

      <FiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filtersByType={filtersByType}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        defaultType={activeTab}
      />

      <ConfirmActionModal
        isOpen={pendingDeleteId !== null}
        title="Delete Transaction"
        message="Are You Sure You Want To Delete This Transaction?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destructive
      />

      <CategoryManagementModal
        isOpen={categoryManagement.isManagementOpen}
        activeTab={activeTab}
        expenseTone={expenseTone}
        incomeTone={incomeTone}
        onClose={categoryManagement.handleCloseManagement}
      />
    </View>
  );
}

function ActionPill({
  label,
  icon,
  onPress,
  active = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  active?: boolean;
}) {
  const theme = useTheme();
  const bg = active ? theme.colors.primary : theme.colors.elevation.level1;
  const border = active ? theme.colors.primary : theme.colors.outlineVariant;
  const textColor = active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <MaterialCommunityIcons name={icon} size={14} color={textColor} />
      <Text variant="labelMedium" style={{ color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  body: {
    flex: 1,
    paddingTop: 16,
  },
  tabsCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  tabCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
  },
  tabCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  webRow: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  webColCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  webColHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  webColHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  webColIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  totalPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyIcon: {
    borderWidth: StyleSheet.hairlineWidth,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bottomLeft: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    zIndex: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    right: 12,
    bottom: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 4,
  },
});
