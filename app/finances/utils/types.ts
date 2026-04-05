/**
 * Transaction Types
 * Spreadsheet-friendly data structure for financial transactions
 *
 * Designed to map 1:1 to spreadsheet columns for future Google Sheets / Excel migration
 */

// ============================================================================
// Core Types
// ============================================================================

export type TransactionType = "income" | "expense";
export type PaymentMethod = "cash" | "card" | "upi";
export type ModalMode = "add" | "edit";
export type TransactionDatePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "last3months"
  | "custom";

// ============================================================================
// Transaction Model (Spreadsheet-compatible)
// ============================================================================

export interface Transaction {
  // Core identification
  id: string;

  // Transaction details
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  amount: number; // Can be positive or negative
  type: TransactionType; // 'income' | 'expense'
  category: string; // User-defined categories
  account: PaymentMethod; // 'cash' | 'card'

  // Optional fields
  notes?: string; // Additional notes
  tags?: string[]; // Array of tags for organization

  // Metadata
  createdBy: string; // Workspace member who created it
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp

  // Soft delete support
  deleted: boolean; // For soft delete - deleted items don't show in main list
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface TransactionFormData {
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: PaymentMethod;
  notes?: string;
  tags?: string[];
}

// ============================================================================
// Filter Types
// ============================================================================

export interface TransactionFilters {
  date?: {
    start?: string;
    end?: string;
  };
  datePreset?: TransactionDatePreset;
  category?: string | "all";
  account?: PaymentMethod | "all";
  tags?: string[];
  search?: string;
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  type: TransactionType; // Separate category sets for income and expense
  createdAt: string;
}

// ============================================================================
// State Types
// ============================================================================

export interface TransactionState {
  // Transactions
  transactions: Transaction[];

  // Categories
  incomeCategories: string[];
  expenseCategories: string[];
  deletedIncomeCategories: string[];
  deletedExpenseCategories: string[];
  categoryIcons: Record<string, string>;

  // Filters
  filters: TransactionFilters;

  // Modal state
  modalMode: ModalMode;
  editingTransactionId: string | null;
  isModalOpen: boolean;

  // Quick tools
  isCategoryModalOpen: boolean;
  categoryModalType: TransactionType | null;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Default Categories
// ============================================================================

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Gifts",
  "Refunds",
  "Other Income",
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Travel",
  "Other Expense",
] as const;

// ============================================================================
// Sample Transactions (for testing)
// ============================================================================

export const SAMPLE_TRANSACTIONS: Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    date: "2025-01-15",
    amount: 5000,
    type: "income",
    category: "Salary",
    account: "card",
    notes: "Monthly salary",
    tags: ["monthly", "work"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-14",
    amount: 45.5,
    type: "expense",
    category: "Food & Dining",
    account: "card",
    notes: "Restaurant dinner",
    tags: ["food"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-13",
    amount: 120,
    type: "expense",
    category: "Transportation",
    account: "cash",
    notes: "Gas refill",
    tags: ["car"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-12",
    amount: 1500,
    type: "income",
    category: "Freelance",
    account: "card",
    notes: "Client payment",
    tags: ["freelance", "work"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-11",
    amount: 89.99,
    type: "expense",
    category: "Shopping",
    account: "card",
    notes: "Online purchase",
    tags: ["shopping"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-10",
    amount: 200,
    type: "expense",
    category: "Bills & Utilities",
    account: "card",
    notes: "Electric bill",
    tags: ["bills", "utilities"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-09",
    amount: 500,
    type: "income",
    category: "Gifts",
    account: "cash",
    notes: "Birthday gift",
    tags: ["gift"],
    createdBy: "User",
    deleted: false,
  },
  {
    date: "2025-01-08",
    amount: 35,
    type: "expense",
    category: "Food & Dining",
    account: "cash",
    notes: "Coffee and snacks",
    tags: ["food", "coffee"],
    createdBy: "User",
    deleted: false,
  },
];

// ============================================================================
// Spreadsheet Mapping Notes
// ============================================================================
//
// The Transaction structure is designed to map 1:1 to spreadsheet columns:
//
// | id | date | amount | type | category | account | notes | tags | createdBy | createdAt | updatedAt | deleted |
//
// All fields are flat (no nested objects) for easy CSV/Excel export.
// Date fields use ISO 8601 format for consistent parsing.
// tags is a comma-separated string when exported to spreadsheet.
//
