/**
 * Transaction Modal Component
 * Form for adding and editing financial transactions
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import DateTimePicker, { DateType, useDefaultStyles } from "react-native-ui-datepicker";
import { useDispatch, useSelector } from "react-redux";
import { Button, Dialog, Menu, Portal, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { ConfirmActionModal } from "./ConfirmActionModal";
import {
  addExpenseCategory,
  addIncomeCategory,
  addTransaction,
  permanentDeleteTransaction,
  selectEditingTransactionId,
  selectExpenseCategories,
  selectIncomeCategories,
  selectModalMode,
  selectTransactionById,
  updateTransaction,
} from "../slices/transactionSlice";
import { PaymentMethod, TransactionFormData, TransactionType } from "../utils/types";
import { formatDateForInput, getTodayDate, validateAmount } from "../utils/helpers";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

function toIsoDateOnly(value: DateType): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return formatDateForInput(parsed);
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return formatDateForInput(parsed);
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return formatDateForInput(value);
  }

  const maybeToDate = (value as { toDate?: unknown }).toDate;
  if (typeof maybeToDate === "function") {
    const parsed = (value as { toDate: () => Date }).toDate();
    if (Number.isNaN(parsed.getTime())) return "";
    return formatDateForInput(parsed);
  }

  return "";
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseIsoDateOnly(value: string): { year: number; month: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = new Date(year, month, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) {
    return null;
  }

  return { year, month };
}

function getWeekRowsInMonth(year: number, month: number, firstDayOfWeek: number = 0): number {
  const firstDayIndex = (new Date(year, month, 1).getDay() - firstDayOfWeek + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.ceil((firstDayIndex + daysInMonth) / 7);
}

export function TransactionModal({ isOpen, onClose, defaultType = "expense" }: TransactionModalProps) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const datePickerStyles = useDefaultStyles(theme.dark ? "dark" : "light");

  const modalMode = useSelector(selectModalMode);
  const editingTransactionId = useSelector(selectEditingTransactionId);
  const editingTransaction = useSelector(
    editingTransactionId ? selectTransactionById(editingTransactionId) : () => null,
  );

  const incomeCategories = useSelector(selectIncomeCategories);
  const expenseCategories = useSelector(selectExpenseCategories);

  // Form state
  const [formData, setFormData] = useState<TransactionFormData>({
    date: getTodayDate(),
    amount: 0,
    type: defaultType,
    category: "",
    account: "card",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});
  const [amountString, setAmountString] = useState("");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [calendarWidth, setCalendarWidth] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  // Get current categories based on transaction type
  const currentCategories = formData.type === "income" ? incomeCategories : expenseCategories;

  // Load editing data
  useEffect(() => {
    if (modalMode === "edit" && editingTransaction) {
      setFormData({
        date: editingTransaction.date,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        account: editingTransaction.account,
        notes: editingTransaction.notes || "",
      });
      setAmountString(String(Math.abs(editingTransaction.amount)));
      const parsed = parseIsoDateOnly(editingTransaction.date);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
    } else if (isOpen) {
      const today = getTodayDate();
      // Reset form for add mode
      setFormData({
        date: today,
        amount: 0,
        type: defaultType,
        category: "",
        account: "card",
        notes: "",
      });
      setAmountString("");
      const parsed = parseIsoDateOnly(today);
      if (parsed) {
        setCalendarMonth(parsed.month);
        setCalendarYear(parsed.year);
      }
    }
    setErrors({});
    setNewCategoryInput("");
    if (!isOpen) {
      setIsDeleteConfirmOpen(false);
    }
  }, [modalMode, editingTransaction, isOpen, defaultType]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TransactionFormData, string>> = {};

    const amountValidation = validateAmount(parseFloat(amountString) || 0);
    if (!amountString.trim()) {
      newErrors.amount = "Amount is required";
    } else if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error;
    }

    if (!formData.category.trim() || formData.category === "__add_new__") {
      newErrors.category = "Category is required";
    }

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return;

    const amount = parseFloat(amountString) || 0;
    const transactionData: TransactionFormData = {
      ...formData,
      amount,
      tags: undefined,
      notes: formData.notes ? formData.notes : undefined,
    };

    if (modalMode === "edit" && editingTransactionId) {
      dispatch(updateTransaction({ id: editingTransactionId, data: transactionData }));
    } else {
      dispatch(addTransaction(transactionData));
    }

    onClose();
  };

  // Handle type change
  const handleTypeChange = (type: TransactionType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      category: "", // Reset category when type changes
    }));
  };

  // Handle amount change
  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    let sanitized = cleaned;
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      sanitized = parts[0] + "." + parts[1].slice(0, 2);
    }

    setAmountString(sanitized);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  // Handle add category
  const handleAddCategory = () => {
    const newCategory = newCategoryInput.trim();
    if (!newCategory) return;

    if (formData.type === "income") {
      dispatch(addIncomeCategory(newCategory));
    } else {
      dispatch(addExpenseCategory(newCategory));
    }

    setFormData((prev) => ({ ...prev, category: newCategory }));
    setNewCategoryInput("");
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!editingTransactionId) return;
    setIsDeleteConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!editingTransactionId) return;
    dispatch(permanentDeleteTransaction(editingTransactionId));
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  const isIncome = formData.type === "income";
  const isEditMode = modalMode === "edit";
  const isMobileLayout = width < 768;
  const modalHorizontalMargin = isMobileLayout ? 12 : 0;
  const modalMaxWidth = Math.max(width - modalHorizontalMargin * 2, 280);
  const modalMaxHeight = Math.max(Math.min(height * 0.9, 760), 460);
  const headerColor = isIncome ? theme.colors.primary : theme.colors.error;
  const headerBg = isIncome ? theme.colors.primaryContainer : theme.colors.errorContainer;
  const primaryActionLabel = !isEditMode
    ? isIncome
      ? "Add Income"
      : "Add Expense"
    : isMobileLayout
      ? "Save"
      : "Save Changes";

  const calendarCellSize = useMemo(() => {
    if (!calendarWidth) return undefined;
    return clampNumber(Math.floor(calendarWidth / 7), 28, 44);
  }, [calendarWidth]);

  const calendarRows = useMemo(() => getWeekRowsInMonth(calendarYear, calendarMonth), [calendarYear, calendarMonth]);

  const calendarWeekdaysHeight = useMemo(
    () => clampNumber(Math.round((calendarCellSize ?? 36) * 0.65), 22, 30),
    [calendarCellSize],
  );

  const calendarContainerHeight = useMemo(() => {
    if (!calendarCellSize) return undefined;
    return calendarWeekdaysHeight + calendarRows * calendarCellSize;
  }, [calendarCellSize, calendarWeekdaysHeight, calendarRows]);

  const calendarStyles = useMemo(() => {
    if (!calendarCellSize) return datePickerStyles;
    return {
      ...datePickerStyles,
      day_cell: {
        ...(datePickerStyles.day_cell ?? {}),
        minHeight: calendarCellSize,
      },
    };
  }, [calendarCellSize, datePickerStyles]);

  const calendarHeaderLabel = useMemo(() => {
    const date = new Date(calendarYear, calendarMonth, 1);
    const monthLabel = date.toLocaleString("en-US", { month: "long" });
    return `${monthLabel} ${calendarYear}`;
  }, [calendarMonth, calendarYear]);

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((year) => Math.max(0, year - 1));
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((year) => year + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const categoryLabel =
    formData.category && formData.category !== "__add_new__" ? formData.category : "Select category";

  return (
    <Portal>
      <Dialog
        visible={isOpen}
        onDismiss={onClose}
        dismissable={false}
        style={[
          styles.dialog,
          {
            width: isMobileLayout ? modalMaxWidth : Math.min(920, modalMaxWidth),
            maxHeight: isMobileLayout ? Math.max(Math.min(height * 0.92, 820), 520) : modalMaxHeight,
          },
        ]}>
        <Dialog.Title>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: headerBg }]}>
              <MaterialCommunityIcons name={isIncome ? "trending-up" : "trending-down"} size={20} color={headerColor} />
            </View>
            <Text variant={isMobileLayout ? "titleLarge" : "headlineSmall"}>
              {!isEditMode ? (isIncome ? "Add Income" : "Add Expense") : "Edit Transaction"}
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>
        </Dialog.Title>

        <Dialog.Content style={{ paddingHorizontal: 0 }}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <SegmentedButtons
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value as TransactionType)}
                buttons={[
                  { value: "expense", label: "Expense", icon: "trending-down" },
                  { value: "income", label: "Income", icon: "trending-up" },
                ]}
              />
            </View>

            <View style={styles.section}>
              <TextInput
                mode="outlined"
                label="Amount *"
                keyboardType="decimal-pad"
                value={amountString}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                error={!!errors.amount}
              />
              {errors.amount ? <Text style={{ color: theme.colors.error }}>{errors.amount}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Date *
              </Text>
              <View
                style={[
                  styles.calendarWrap,
                  { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.elevation.level1 },
                ]}
                onLayout={(event: LayoutChangeEvent) => {
                  const nextWidth = Math.floor(event.nativeEvent.layout.width);
                  setCalendarWidth((prev) => (prev === nextWidth ? prev : nextWidth));
                }}>
                <View style={[styles.calendarHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Pressable accessibilityRole="button" onPress={handlePrevMonth} hitSlop={8} style={styles.calNavBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={18} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                  <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                    {calendarHeaderLabel}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={handleNextMonth} hitSlop={8} style={styles.calNavBtn}>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                </View>
                <DateTimePicker
                  mode="single"
                  date={formData.date}
                  styles={calendarStyles}
                  containerHeight={calendarContainerHeight}
                  weekdaysHeight={calendarWeekdaysHeight}
                  month={calendarMonth}
                  year={calendarYear}
                  hideHeader
                  onChange={({ date }) => {
                    const iso = toIsoDateOnly(date);
                    setFormData((prev) => ({ ...prev, date: iso }));
                    const parsed = parseIsoDateOnly(iso);
                    if (parsed) {
                      setCalendarMonth(parsed.month);
                      setCalendarYear(parsed.year);
                    }
                    if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                  }}
                />
              </View>
              {errors.date ? <Text style={{ color: theme.colors.error }}>{errors.date}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Account
              </Text>
              <SegmentedButtons
                value={formData.account}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, account: value as PaymentMethod }))}
                buttons={[
                  { value: "cash", label: "Cash", icon: "cash" },
                  { value: "card", label: "Card", icon: "credit-card" },
                  { value: "upi", label: "UPI", icon: "bank-transfer" },
                ]}
              />
            </View>

            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                Category *
              </Text>
              <Menu
                visible={categoryMenuOpen}
                onDismiss={() => setCategoryMenuOpen(false)}
                anchor={
                  <Button mode="outlined" onPress={() => setCategoryMenuOpen(true)} textColor={errors.category ? theme.colors.error : undefined}>
                    {categoryLabel}
                  </Button>
                }>
                {currentCategories.map((category) => (
                  <Menu.Item
                    key={category}
                    title={category}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, category }));
                      if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                      setCategoryMenuOpen(false);
                    }}
                  />
                ))}
                <Menu.Item
                  title="+ Add new category"
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, category: "__add_new__" }));
                    setCategoryMenuOpen(false);
                  }}
                />
              </Menu>

              {formData.category === "__add_new__" ? (
                <View style={styles.inlineRow}>
                  <TextInput
                    mode="outlined"
                    value={newCategoryInput}
                    onChangeText={setNewCategoryInput}
                    placeholder="New category name"
                    style={{ flex: 1 }}
                    onSubmitEditing={handleAddCategory}
                  />
                  <Button mode="contained" onPress={handleAddCategory} disabled={!newCategoryInput.trim()}>
                    Add
                  </Button>
                </View>
              ) : null}

              {errors.category ? <Text style={{ color: theme.colors.error }}>{errors.category}</Text> : null}
            </View>

            <View style={styles.section}>
              <TextInput
                mode="outlined"
                label="Notes (Optional)"
                value={formData.notes}
                onChangeText={(value: string) => setFormData((prev) => ({ ...prev, notes: value }))}
                placeholder="Add notes..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          {isEditMode ? (
            <Button mode="outlined" onPress={handleDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          ) : (
            <View />
          )}
          <View style={styles.actionsRight}>
            <Button mode="outlined" onPress={onClose}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSubmit} icon={!isEditMode ? "plus" : "check"}>
              {primaryActionLabel}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>

      <ConfirmActionModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Transaction"
        message="Are You Sure You Want To Delete This Transaction?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destructive
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    marginBottom: 6,
  },
  calendarWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: "hidden",
  },
  calendarHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  actions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

