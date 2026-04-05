import { TransactionFilters, TransactionType } from "../utils/types";
import { FilterChip, getFilterChips } from "../utils/filters";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';

type Props = {
  filtersByType: Record<TransactionType, TransactionFilters>;
  activeFilterCount: number;
  expenseTone: { icon: string };
  incomeTone: { icon: string };
  onRemoveChip: (type: TransactionType, chipKey: FilterChip["key"]) => void;
};

export function TransactionFilterChips({
  filtersByType,
  activeFilterCount,
  expenseTone,
  incomeTone,
  onRemoveChip,
}: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="tune-variant" size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Active Filters
          </Text>
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {activeFilterCount} Applied
        </Text>
      </View>

        {(["expense", "income"] as TransactionType[]).map((type) => {
          const chips = getFilterChips(filtersByType[type]);
          const isExpenseRow = type === "expense";

          return chips.length > 0 ? (
            <View key={type} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name={isExpenseRow ? "trending-down" : "trending-up"}
                  size={14}
                  color={isExpenseRow ? expenseTone.icon : incomeTone.icon}
                />
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                  {isExpenseRow ? "Expense Filters" : "Income Filters"}
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {chips.map((chip) => (
                  <Chip
                    key={`${type}-${chip.key}`}
                    mode="outlined"
                    style={styles.chip}
                    onClose={() => onRemoveChip(type, chip.key)}>
                    {chip.label}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          ) : null;
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chipsRow: {
    paddingRight: 8,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
});
