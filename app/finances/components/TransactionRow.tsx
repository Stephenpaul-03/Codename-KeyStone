/**
 * Transaction Row Component
 * Displays a single transaction in the transactions list
 */

import { selectCategoryIcons } from "../slices/transactionSlice";
import { Transaction } from "../utils/types";
import {
  formatCurrencyWithSymbol,
  formatDate,
  getCategoryIconName,
} from "../utils/helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSelector } from "react-redux";

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isMobile?: boolean;
}

export function TransactionRow({
  transaction,
  onEdit,
  onDelete,
  isMobile = false,
}: TransactionRowProps) {
  const theme = useTheme();
  const categoryIcons = useSelector(selectCategoryIcons);

  const colors = {
    background: {
      card: theme.colors.elevation.level1,
      input: theme.colors.elevation.level2,
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

  const tone =
    transaction.type === "income"
      ? {
          tintBg: theme.colors.primaryContainer,
          tintBorder: theme.colors.primary,
          tintText: theme.colors.primary,
          icon: theme.colors.primary,
        }
      : {
          tintBg: theme.colors.errorContainer,
          tintBorder: theme.colors.error,
          tintText: theme.colors.error,
          icon: theme.colors.error,
        };

  const categoryIcon = useMemo(
    () =>
      getCategoryIconName(transaction.category, transaction.type, categoryIcons),
    [categoryIcons, transaction.category, transaction.type],
  );

  if (isMobile) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.primary,
          },
        ]}>
        <View style={styles.topRow}>
          <View style={styles.leftBlock}>
            <View style={[styles.iconBox, { backgroundColor: tone.icon }]}>
              <MaterialCommunityIcons name={categoryIcon as any} size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" numberOfLines={1} style={{ color: colors.text.primary }}>
                {transaction.category}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={12} color={colors.text.muted} />
                  <Text variant="labelSmall" style={{ color: colors.text.muted }}>
                    {formatDate(transaction.date)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons
                    name={transaction.account === "cash" ? "cash" : "credit-card-outline"}
                    size={12}
                    color={colors.text.muted}
                  />
                  <Text variant="labelSmall" style={{ color: colors.text.muted }}>
                    {transaction.account === "cash" ? "Cash" : "Card"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text variant="titleLarge" style={{ color: tone.tintText }}>
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrencyWithSymbol(transaction.amount)}
          </Text>
        </View>

        {transaction.notes ? (
          <Text
            variant="bodyMedium"
            numberOfLines={1}
            style={[styles.notes, { color: colors.text.secondary }]}>
            {transaction.notes}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            style={[
              styles.actionButton,
              { borderColor: colors.border.primary, backgroundColor: colors.background.input },
            ]}>
            <View style={styles.actionContent}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.text.secondary} />
              <Text variant="labelLarge" style={{ color: colors.text.secondary }}>
                Edit
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            style={[
              styles.actionButton,
              { borderColor: tone.tintBorder, backgroundColor: tone.tintBg },
            ]}>
            <View style={styles.actionContent}>
              <MaterialCommunityIcons name="delete-outline" size={14} color={tone.icon} />
              <Text variant="labelLarge" style={{ color: tone.tintText }}>
                Delete
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.primary,
          paddingVertical: 12,
        },
      ]}>
      <View style={styles.desktopRow}>
        <View style={styles.leftBlockDesktop}>
          <View style={[styles.iconBoxDesktop, { backgroundColor: tone.icon }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={18} color="white" />
          </View>

          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" numberOfLines={1} style={{ color: colors.text.primary }}>
              {transaction.category}
            </Text>
            <View style={styles.metaRowDesktop}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={12} color={colors.text.muted} />
                <Text variant="labelSmall" style={{ color: colors.text.muted }}>
                  {formatDate(transaction.date)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name={transaction.account === "cash" ? "cash" : "credit-card-outline"}
                  size={12}
                  color={colors.text.muted}
                />
                <Text variant="labelSmall" style={{ color: colors.text.muted }}>
                  {transaction.account === "cash" ? "Cash" : "Card"}
                </Text>
              </View>
              {transaction.notes ? (
                <Text variant="labelSmall" numberOfLines={1} style={{ color: colors.text.secondary }}>
                  {transaction.notes}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.rightBlock}>
          <Text variant="titleLarge" style={{ color: tone.tintText }}>
            {transaction.type === "income" ? "+" : "-"}
            {formatCurrencyWithSymbol(transaction.amount)}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onEdit}
            hitSlop={8}
            style={[
              styles.iconAction,
              { borderColor: colors.border.primary, backgroundColor: colors.background.input },
            ]}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.text.secondary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            hitSlop={8}
            style={[
              styles.iconAction,
              { borderColor: tone.tintBorder, backgroundColor: tone.tintBg },
            ]}>
            <MaterialCommunityIcons name="delete-outline" size={14} color={tone.icon} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Transaction Row Compact Version (for mobile/smaller displays)
 */
export function TransactionRowCompact({
  transaction,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  return (
    <TransactionRow
      transaction={transaction}
      onEdit={onEdit}
      onDelete={onDelete}
      isMobile={true}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notes: {
    marginTop: 10,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftBlockDesktop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBoxDesktop: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
