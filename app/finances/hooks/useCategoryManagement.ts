import { useDispatch, useSelector } from 'react-redux';
import { TransactionState, TransactionType } from '../utils/types';
import {
  addIncomeCategory,
  addExpenseCategory,
  updateIncomeCategory,
  updateExpenseCategory,
  softRemoveIncomeCategory,
  softRemoveExpenseCategory,
  selectActiveIncomeCategories,
  selectActiveExpenseCategories,
  selectCategoryIcons,
} from '../slices/transactionSlice';
import { getCategoryIconKey, getCategoryIconOptions } from '../utils/helpers';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useCategoryManagement(activeTab: TransactionType) {
  const dispatch = useDispatch();

  // Modals
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{name: string, icon: string, type: TransactionType} | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionType>(activeTab);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategories = useSelector((state: { transactions: TransactionState }) => 
    selectedType === 'income' 
      ? selectActiveIncomeCategories(state)
      : selectActiveExpenseCategories(state)
  );
  const allCategoryIcons = useSelector((state: { transactions: TransactionState }) => selectCategoryIcons(state));

  const filteredCategories = activeCategories.filter(cat => 
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (name: string) => {
    const key = getCategoryIconKey(selectedType, name);
    return allCategoryIcons[key] || 'tag-outline';
  };

  const handleOpenManagement = (type: TransactionType = activeTab) => {
    setSelectedType(type);
    setSearchQuery('');
    setIsManagementOpen(true);
  };

  const handleEditCategory = (name: string) => {
    const icon = getCategoryIcon(name);
    setEditingCategory({ name, icon, type: selectedType });
    setIsEditOpen(true);
  };

  const handleRemoveCategory = (name: string) => {
    Alert.alert(
      'Remove Category',
      `Remove "${name}"? Existing transactions will keep this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (selectedType === 'income') {
              dispatch(softRemoveIncomeCategory(name));
            } else {
              dispatch(softRemoveExpenseCategory(name));
            }
          }
        }
      ]
    );
  };

  const handleCloseManagement = () => setIsManagementOpen(false);

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingCategory(null);
  };

  const handleSubmitCategory = (name: string, icon: string) => {
    if (!name.trim()) return;

    if (editingCategory) {
      // Update
    const { name: oldName, type } = editingCategory!;
      if (type === 'income') {
        dispatch(updateIncomeCategory({ oldName, newName: name, icon }));
      } else {
        dispatch(updateExpenseCategory({ oldName, newName: name, icon }));
      }
    } else {
      // Add new
      const payload = { name, icon };
      if (selectedType === 'income') {
        dispatch(addIncomeCategory(payload));
      } else {
        dispatch(addExpenseCategory(payload));
      }
    }

    handleCloseEdit();
  };

  const iconOptions = getCategoryIconOptions(selectedType);

  return {
    // State
    isManagementOpen,
    isEditOpen,
    editingCategory,
    selectedType,
    searchQuery,
    filteredCategories,
    getCategoryIcon,
    iconOptions,
    
    // Actions
    handleOpenManagement,
    handleEditCategory,
    handleRemoveCategory,
    handleCloseManagement,
    setSearchQuery,
    handleCloseEdit,
    setEditingCategory,
    handleSubmitCategory,
  };
}
