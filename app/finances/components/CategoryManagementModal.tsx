import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput, useTheme } from "react-native-paper";

import { useCategoryManagement } from "../hooks/useCategoryManagement";
import { TransactionType } from "../utils/types";
import { CategoryModal } from "./Addcategorymodal";

type Tone = {
  bg: string;
  border: string;
  text: string;
  icon: string;
};

interface Props {
  isOpen: boolean;
  activeTab: TransactionType;
  expenseTone: Tone;
  incomeTone: Tone;
  onClose: () => void;
}

export function CategoryManagementModal({ isOpen, activeTab, expenseTone, incomeTone, onClose }: Props) {
  const theme = useTheme();
  const management = useCategoryManagement(activeTab);

  const [localCategoryName, setLocalCategoryName] = useState("");
  const [localIcon, setLocalIcon] = useState(management.iconOptions[0] || "tag-outline");

  const handleTabChange = (type: TransactionType) => {
    management.handleOpenManagement(type);
  };

  const handleAddNew = () => {
    setLocalCategoryName("");
    setLocalIcon(management.iconOptions[0] || "tag-outline");
    management.handleOpenManagement(management.selectedType);
  };

  const selectedTone = management.selectedType === "income" ? incomeTone : expenseTone;

  return (
    <Portal>
      <Dialog visible={isOpen} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>
          <Text variant="headlineSmall">Manage Categories</Text>
        </Dialog.Title>

        <Dialog.Content style={{ paddingHorizontal: 0 }}>
          <View style={styles.content}>
            <View style={styles.tabsRow}>
              {(["expense", "income"] as TransactionType[]).map((type) => {
                const isSelected = management.selectedType === type;
                const tone = type === "income" ? incomeTone : expenseTone;
                return (
                  <Button
                    key={type}
                    mode={isSelected ? "contained-tonal" : "outlined"}
                    onPress={() => handleTabChange(type)}
                    style={styles.tabBtn}
                    buttonColor={isSelected ? tone.bg : undefined}
                    textColor={isSelected ? tone.text : theme.colors.onSurfaceVariant}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({management.filteredCategories.length})
                  </Button>
                );
              })}
            </View>

            <TextInput
              mode="outlined"
              placeholder="Search categories..."
              value={management.searchQuery}
              onChangeText={management.setSearchQuery}
              left={<TextInput.Icon icon="magnify" />}
            />

            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={styles.listContent}>
              {management.filteredCategories.map((name) => {
                const icon = management.getCategoryIcon(name);
                return (
                  <View
                    key={name}
                    style={[
                      styles.rowCard,
                      { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.outlineVariant },
                    ]}>
                    <View style={styles.rowMain}>
                      <View style={[styles.rowIconWrap, { backgroundColor: selectedTone.icon }]}>
                        <MaterialCommunityIcons name={icon as any} size={20} color="white" />
                      </View>
                      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                        {name}
                      </Text>
                    </View>

                    <View style={styles.rowActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => management.handleEditCategory(name)}
                        style={[styles.iconBtn, { backgroundColor: theme.colors.primary }]}>
                        <MaterialCommunityIcons name="pencil" size={18} color="white" />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => management.handleRemoveCategory(name)}
                        style={[
                          styles.iconBtn,
                          { backgroundColor: theme.colors.elevation.level1, borderColor: theme.colors.error },
                        ]}>
                        <MaterialCommunityIcons name="delete-outline" size={18} color={theme.colors.error} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {management.filteredCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="magnify-close" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>No categories found</Text>
                </View>
              ) : null}
            </ScrollView>

            <Button mode="contained" onPress={handleAddNew} icon="plus">
              Add New Category
            </Button>
          </View>
        </Dialog.Content>
      </Dialog>

      <CategoryModal
        isOpen={management.isEditOpen}
        categoryType={management.selectedType}
        categoryNameInput={localCategoryName}
        selectedCategoryIcon={localIcon}
        categoryIconOptions={management.iconOptions}
        expenseTone={expenseTone}
        incomeTone={incomeTone}
        onClose={management.handleCloseEdit}
        onChangeCategoryType={() => {}} // Disabled
        onChangeName={setLocalCategoryName}
        onChangeIcon={setLocalIcon}
        onSubmit={() => management.handleSubmitCategory(localCategoryName, localIcon)}
        isEditMode={!!management.editingCategory}
        editingCategory={management.editingCategory || undefined}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: "center",
    width: 760,
    maxWidth: "95%",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
  },
  tabBtn: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingVertical: 6,
    paddingRight: 4,
  },
  rowCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowActions: {
    flexDirection: "row",
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
});

