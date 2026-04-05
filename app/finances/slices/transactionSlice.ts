/**
 * Transaction Redux Slice
 * State management for financial transactions
 */

import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  Transaction,
  TransactionFilters,
  TransactionFormData,
  TransactionState,
  TransactionType,
} from '../utils/types';
import {
  createTransaction,
  formatDateForInput,
  getCategoryIconKey,
  getLastTransaction,
} from '../utils/helpers';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Storage key for persistence
export const transactionStorageKey = 'transactions';

// Initial state
const initialFilters: TransactionFilters = {
  category: 'all',
  account: 'all',
  search: '',
  date: undefined,
  tags: undefined,
};

// Initialize with empty transactions - no mock data
const initialState: TransactionState = {
  transactions: [],
  incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
  expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
  deletedIncomeCategories: [],
  deletedExpenseCategories: [],
  categoryIcons: {},
  filters: initialFilters,
  modalMode: 'add',
  editingTransactionId: null,
  isModalOpen: false,
  isCategoryModalOpen: false,
  categoryModalType: null,
  isLoading: false,
  error: null,
};

type AddCategoryPayload = string | { name: string; icon?: string };

function normalizeCategoryPayload(payload: AddCategoryPayload) {
  if (typeof payload === 'string') {
    return { name: payload.trim(), icon: undefined };
  }

  return {
    name: payload.name.trim(),
    icon: payload.icon?.trim() || undefined,
  };
}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Modal actions
    openAddModal: (state, action: PayloadAction<TransactionType>) => {
      state.modalMode = 'add';
      state.editingTransactionId = null;
      state.isModalOpen = true;
      // Store the type for default category selection
      // This will be used when opening the modal
    },
    openEditModal: (state, action: PayloadAction<string>) => {
      state.modalMode = 'edit';
      state.editingTransactionId = action.payload;
      state.isModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.editingTransactionId = null;
    },

    // Category modal actions
    openCategoryModal: (state, action: PayloadAction<TransactionType>) => {
      state.categoryModalType = action.payload;
      state.isCategoryModalOpen = true;
    },
    closeCategoryModal: (state) => {
      state.isCategoryModalOpen = false;
      state.categoryModalType = null;
    },

    // CRUD operations
    addTransaction: (state, action: PayloadAction<TransactionFormData>) => {
      const newTransaction = createTransaction({
        ...action.payload,
        createdBy: 'Current User', // In production, this would come from auth state
        deleted: false,
      });
      state.transactions.push(newTransaction);
    },

    updateTransaction: (
      state,
      action: PayloadAction<{ id: string; data: Partial<TransactionFormData> }>
    ) => {
      const { id, data } = action.payload;
      const index = state.transactions.findIndex((t) => t.id === id);
      if (index !== -1) {
        const existingTransaction = state.transactions[index];
        state.transactions[index] = {
          ...existingTransaction,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    // Soft delete
    softDeleteTransaction: (state, action: PayloadAction<string>) => {
      const transaction = state.transactions.find((t) => t.id === action.payload);
      if (transaction) {
        transaction.deleted = true;
        transaction.updatedAt = new Date().toISOString();
      }
    },

    // Restore soft-deleted transaction
    restoreTransaction: (state, action: PayloadAction<string>) => {
      const transaction = state.transactions.find((t) => t.id === action.payload);
      if (transaction) {
        transaction.deleted = false;
        transaction.updatedAt = new Date().toISOString();
      }
    },

    // Permanent delete (use with caution)
    permanentDeleteTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(
        (t) => t.id !== action.payload
      );
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialFilters;
    },

    // Category management
    addIncomeCategory: (state, action: PayloadAction<AddCategoryPayload>) => {
      const { name, icon } = normalizeCategoryPayload(action.payload);
      if (!name) return;

      if (!state.incomeCategories.includes(name)) {
        state.incomeCategories.push(name);
      }

      if (!state.deletedIncomeCategories.includes(name)) {
        state.deletedIncomeCategories = state.deletedIncomeCategories.filter(n => n !== name);
      }

      if (icon) {
        state.categoryIcons[getCategoryIconKey('income', name)] = icon;
      }
    },

    updateIncomeCategory: (state, action: PayloadAction<{oldName: string, newName: string, icon?: string}>) => {
      const { oldName, newName, icon } = action.payload;
      const index = state.incomeCategories.indexOf(oldName);
      if (index !== -1) {
        state.incomeCategories[index] = newName;
      }
      if (icon !== undefined) {
        const key = getCategoryIconKey('income', newName);
        state.categoryIcons[key] = icon;
        // Remove old icon if exists
        const oldKey = getCategoryIconKey('income', oldName);
        delete state.categoryIcons[oldKey];
      }
      // Remove from deleted if was there
      state.deletedIncomeCategories = state.deletedIncomeCategories.filter(n => n !== newName);
    },

    softRemoveIncomeCategory: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      if (!state.deletedIncomeCategories.includes(name) && state.incomeCategories.includes(name)) {
        state.deletedIncomeCategories.push(name);
      }
    },

    addExpenseCategory: (state, action: PayloadAction<AddCategoryPayload>) => {
      const { name, icon } = normalizeCategoryPayload(action.payload);
      if (!name) return;

      if (!state.expenseCategories.includes(name)) {
        state.expenseCategories.push(name);
      }

      if (!state.deletedExpenseCategories.includes(name)) {
        state.deletedExpenseCategories = state.deletedExpenseCategories.filter(n => n !== name);
      }

      if (icon) {
        state.categoryIcons[getCategoryIconKey('expense', name)] = icon;
      }
    },

    updateExpenseCategory: (state, action: PayloadAction<{oldName: string, newName: string, icon?: string}>) => {
      const { oldName, newName, icon } = action.payload;
      const index = state.expenseCategories.indexOf(oldName);
      if (index !== -1) {
        state.expenseCategories[index] = newName;
      }
      if (icon !== undefined) {
        const key = getCategoryIconKey('expense', newName);
        state.categoryIcons[key] = icon;
        const oldKey = getCategoryIconKey('expense', oldName);
        delete state.categoryIcons[oldKey];
      }
      state.deletedExpenseCategories = state.deletedExpenseCategories.filter(n => n !== newName);
    },

    softRemoveExpenseCategory: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      if (!state.deletedExpenseCategories.includes(name) && state.expenseCategories.includes(name)) {
        state.deletedExpenseCategories.push(name);
      }
    },

    // Quick tools actions
    duplicateLastTransaction: (state, action: PayloadAction<TransactionType>) => {
      const lastTransaction = getLastTransaction(
        state.transactions,
        action.payload
      );
      if (lastTransaction) {
        const newTransaction = createTransaction({
          date: new Date().toISOString().split('T')[0],
          amount: lastTransaction.amount,
          type: lastTransaction.type,
          category: lastTransaction.category,
          account: lastTransaction.account,
          notes: `Duplicate of ${lastTransaction.date}`,
          tags: lastTransaction.tags,
          createdBy: 'Current User',
          deleted: false,
        });
        state.transactions.push(newTransaction);
      }
    },

    repeatLastTransaction: (state, action: PayloadAction<TransactionType>) => {
      const lastTransaction = getLastTransaction(
        state.transactions,
        action.payload
      );
      if (lastTransaction) {
        const newTransaction = createTransaction({
          date: new Date().toISOString().split('T')[0],
          amount: lastTransaction.amount,
          type: lastTransaction.type,
          category: lastTransaction.category,
          account: lastTransaction.account,
          notes: `Repeat of ${lastTransaction.date}`,
          tags: lastTransaction.tags,
          createdBy: 'Current User',
          deleted: false,
        });
        state.transactions.push(newTransaction);
      }
    },

    // Bulk operations
    loadTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },

    clearAllTransactions: (state) => {
      state.transactions = [];
    },

    // Import transactions from JSON/Excel format
    importTransactions: (state, action: PayloadAction<Partial<Transaction>[]>) => {
      const normalizeType = (value: unknown): TransactionType | null => {
        if (typeof value !== 'string') return null;
        const normalized = value.trim().toLowerCase();
        if (normalized === 'income' || normalized.startsWith('inc')) return 'income';
        if (normalized === 'expense' || normalized.startsWith('exp')) return 'expense';
        return null;
      };

      const normalizeAccount = (value: unknown): Transaction['account'] | null => {
        if (typeof value !== 'string') return null;
        const normalized = value.trim().toLowerCase();
        if (normalized === 'cash' || normalized === 'card' || normalized === 'upi') return normalized;
        if (normalized.includes('credit') || normalized.includes('debit')) return 'card';
        if (normalized.includes('bank') || normalized.includes('upi')) return 'upi';
        return null;
      };

      const normalizeDate = (value: unknown): string | null => {
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
          const parsed = new Date(trimmed);
          if (Number.isNaN(parsed.getTime())) return null;
          return formatDateForInput(parsed);
        }

        if (typeof value === 'number') {
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) return null;
          return formatDateForInput(parsed);
        }

        if (value instanceof Date) {
          if (Number.isNaN(value.getTime())) return null;
          return formatDateForInput(value);
        }

        return null;
      };

      const importedTransactions = action.payload
        .map((t) => {
          const date = normalizeDate(t.date);
          const amount = typeof t.amount === 'number' ? t.amount : Number(t.amount);
          const type = normalizeType(t.type);
          const category = typeof t.category === 'string' ? t.category.trim() : '';
          const account = normalizeAccount(t.account);

          if (!date || !Number.isFinite(amount) || !type || !category || !account) {
            return null;
          }

          return {
            ...t,
            date,
            amount,
            type,
            category,
            account,
          };
        })
        .filter((t): t is Partial<Transaction> & Pick<Transaction, 'date' | 'amount' | 'type' | 'category' | 'account'> => Boolean(t));

      const now = new Date().toISOString();
      const newTransactions: Transaction[] = importedTransactions.map(t => ({
        id: t.id || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: t.date!,
        amount: t.amount!,
        type: t.type!,
        category: t.category!,
        account: t.account!,
        notes: t.notes,
        tags: t.tags,
        createdBy: t.createdBy || 'Imported',
        createdAt: t.createdAt || now,
        updatedAt: now,
        deleted: t.deleted ?? false,
      }));

      state.transactions = [...state.transactions, ...newTransactions];
    },

    // Set transaction type for new transaction (used by quick tools)
    setNewTransactionType: (state, action: PayloadAction<TransactionType>) => {
      // This is stored temporarily for the modal to know what type to add
      // In a real app, this might be handled differently
    },
  },
});

// Export actions
export const {
  openAddModal,
  openEditModal,
  closeModal,
  openCategoryModal,
  closeCategoryModal,
  addTransaction,
  updateTransaction,
  softDeleteTransaction,
  restoreTransaction,
  permanentDeleteTransaction,
  setFilters,
  resetFilters,
  addIncomeCategory,
  addExpenseCategory,
  updateIncomeCategory,
  updateExpenseCategory,
  softRemoveIncomeCategory,
  softRemoveExpenseCategory,
  duplicateLastTransaction,
  repeatLastTransaction,
  loadTransactions,
  clearAllTransactions,
  importTransactions,
  setNewTransactionType,
} = transactionSlice.actions;

export default transactionSlice.reducer;

// ============================================================================
// Selectors
// ============================================================================

export const selectTransactions = (state: { transactions: TransactionState }) =>
  state.transactions.transactions;

export const selectNonDeletedTransactions = (state: {
  transactions: TransactionState;
}) => state.transactions.transactions.filter((t) => !t.deleted);

export const selectIncomeTransactions = (state: {
  transactions: TransactionState;
}) => state.transactions.transactions.filter(
  (t) => t.type === 'income' && !t.deleted
);

export const selectExpenseTransactions = (state: {
  transactions: TransactionState;
}) => state.transactions.transactions.filter(
  (t) => t.type === 'expense' && !t.deleted
);

export const selectFilters = (state: { transactions: TransactionState }) =>
  state.transactions.filters;

export const selectIsModalOpen = (state: { transactions: TransactionState }) =>
  state.transactions.isModalOpen;

export const selectModalMode = (state: { transactions: TransactionState }) =>
  state.transactions.modalMode;

export const selectEditingTransactionId = (state: {
  transactions: TransactionState;
}) => state.transactions.editingTransactionId;

export const selectTransactionById =
  (id: string) => (state: { transactions: TransactionState }) =>
    state.transactions.transactions.find((t) => t.id === id);

export const selectActiveIncomeCategories = (state: {
  transactions: TransactionState;
}) => state.transactions.incomeCategories.filter(name => !state.transactions.deletedIncomeCategories.includes(name));

export const selectActiveExpenseCategories = (state: {
  transactions: TransactionState;
}) => state.transactions.expenseCategories.filter(name => !state.transactions.deletedExpenseCategories.includes(name));

export const selectIncomeCategories = (state: {
  transactions: TransactionState;
}) => state.transactions.incomeCategories;

export const selectExpenseCategories = (state: {
  transactions: TransactionState;
}) => state.transactions.expenseCategories;

export const selectCategoryIcons = (state: {
  transactions: TransactionState;
}) => state.transactions.categoryIcons || {};

export const selectIsCategoryModalOpen = (state: {
  transactions: TransactionState;
}) => state.transactions.isCategoryModalOpen;

export const selectCategoryModalType = (state: {
  transactions: TransactionState;
}) => state.transactions.categoryModalType;

export const selectLastTransaction =
  (type?: TransactionType) => (state: { transactions: TransactionState }) =>
    getLastTransaction(state.transactions.transactions, type);
