import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { TransactionType } from "../utils/types";

type Tone = {
  bg: string;
  border: string;
  text: string;
  icon: string;
};

type Props = {
  isOpen: boolean;
  categoryType: TransactionType;
  categoryNameInput: string;
  selectedCategoryIcon: string;
  categoryIconOptions: string[];
  expenseTone: Tone;
  incomeTone: Tone;
  onClose: () => void;
  onChangeCategoryType: (type: TransactionType) => void;
  onChangeName: (name: string) => void;
  onChangeIcon: (icon: string) => void;
  onSubmit: () => void;
  isEditMode: boolean;
  editingCategory?: { name: string; icon: string; type: TransactionType };
};

export function CategoryModal({
  isOpen,
  categoryType,
  categoryNameInput,
  selectedCategoryIcon,
  categoryIconOptions,
  expenseTone,
  incomeTone,
  onClose,
  onChangeCategoryType,
  onChangeName,
  onChangeIcon,
  onSubmit,
  isEditMode,
}: Props) {
  const theme = useTheme();
  const selectedTone = categoryType === "income" ? incomeTone : expenseTone;

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name={isEditMode ? "tag-edit-outline" : "tag-plus-outline"}
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="titleLarge">{isEditMode ? "Edit Category" : "Add Category"}</Text>
          </View>
        </Dialog.Title>

        <Dialog.Content style={{ paddingHorizontal: 0 }}>
          <View style={styles.content}>
            <SegmentedButtons
              value={categoryType}
              onValueChange={(value) => {
                if (isEditMode) return;
                onChangeCategoryType(value as TransactionType);
              }}
              buttons={[
                {
                  value: "expense",
                  label: "Expense",
                  icon: "trending-down",
                  disabled: isEditMode,
                },
                {
                  value: "income",
                  label: "Income",
                  icon: "trending-up",
                  disabled: isEditMode,
                },
              ]}
            />

            <TextInput
              mode="outlined"
              label="Category Name"
              value={categoryNameInput}
              onChangeText={onChangeName}
              placeholder="Category Name"
            />

            <View>
              <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
                Select Icon
              </Text>
              <View style={[styles.iconListWrap, { borderColor: theme.colors.outlineVariant }]}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                  <View style={styles.iconGrid}>
                    {categoryIconOptions.map((iconName) => {
                      const isSelected = selectedCategoryIcon === iconName;
                      return (
                        <Pressable
                          key={iconName}
                          accessibilityRole="button"
                          onPress={() => onChangeIcon(iconName)}
                          style={[
                            styles.iconCell,
                            {
                              borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
                              backgroundColor: isSelected ? theme.colors.primary : theme.colors.elevation.level1,
                            },
                          ]}>
                          <MaterialCommunityIcons
                            name={iconName as any}
                            size={18}
                            color={isSelected ? "white" : theme.colors.onSurfaceVariant}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button mode="outlined" onPress={onClose}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={!categoryNameInput.trim()}
            buttonColor={theme.dark ? selectedTone.icon : theme.colors.primary}>
            {isEditMode ? "Update Category" : "Add Category"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: "center",
    width: 620,
    maxWidth: "95%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  iconListWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 10,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
});

