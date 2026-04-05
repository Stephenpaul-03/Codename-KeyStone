/**
 * Transaction Helper Utilities
 * Formatting and utility functions for transactions
 */

import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  Transaction,
  TransactionDatePreset,
  TransactionFilters,
  TransactionType,
} from './types';

const INCOME_CATEGORY_ICON_MAP: Record<string, string> = {
  salary: 'briefcase-outline',
  freelance: 'laptop-account',
  investments: 'chart-line-variant',
  gifts: 'gift-outline',
  refunds: 'cash-refund',
  'other income': 'wallet-plus-outline',
};

const EXPENSE_CATEGORY_ICON_MAP: Record<string, string> = {
  'food & dining': 'silverware-fork-knife',
  transportation: 'car-outline',
  shopping: 'cart-outline',
  'bills & utilities': 'lightning-bolt-outline',
  entertainment: 'movie-outline',
  healthcare: 'medical-bag',
  education: 'school-outline',
  travel: 'airplane',
  'other expense': 'wallet-outline',
};

const INCOME_FALLBACK_ICONS = [
  'cash-plus',
  'bank-transfer-in',
  'wallet-plus-outline',
  'chart-line',
  'briefcase-check-outline',
];

const EXPENSE_FALLBACK_ICONS = [
  'cash-minus',
  'wallet-outline',
  'credit-card-outline',
  'clipboard-minus-outline',
  'receipt-text-outline',
];

const INCOME_PICKER_ICONS = [
  'briefcase-outline',
  'cash-plus',
  'bank-transfer-in',
  'chart-line',
  'chart-bar',
  'bank-outline',
  'wallet-plus-outline',
  'cash-refund',
  'gift-outline',
  'laptop-account',
  'office-building-outline',
  'account-cash-outline',
  'piggy-bank-outline',
  'currency-usd',
  'percent-outline',
];

const EXPENSE_PICKER_ICONS = [
  'silverware-fork-knife',
  'car-outline',
  'bus',
  'train',
  'gas-station-outline',
  'cart-outline',
  'shopping-outline',
  'receipt-text-outline',
  'home-outline',
  'lightning-bolt-outline',
  'water-outline',
  'wifi',
  'cellphone',
  'movie-open-outline',
  'ticket-outline',
  'music-note-outline',
  'medical-bag',
  'hospital-box-outline',
  'pill',
  'school-outline',
  'book-open-page-variant-outline',
  'airplane',
  'dumbbell',
  'wrench-outline',
  'tools',
  'credit-card-outline',
  'cash-minus',
];

const SHARED_PICKER_ICONS = [
  'tag-outline',
  'wallet-outline',
  'food-outline',
  'coffee-outline',
  'calendar-month-outline',
  'star-outline',
  'heart-outline',
  'leaf',
  'bike',
  'gamepad-variant-outline',
  'earth',
  'shield-outline',
  'account-group-outline',
];

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getCategoryIconKey(
  type: TransactionType,
  category: string
): string {
  return `${type}:${category.trim().toLowerCase()}`;
}

export function getCategoryIconOptions(type: TransactionType): string[] {
  const typeOptions =
    type === 'income' ? INCOME_PICKER_ICONS : EXPENSE_PICKER_ICONS;
  return [...new Set([...typeOptions, ...SHARED_PICKER_ICONS])];
}

/**
 * Generate a unique ID for transactions
 */
export function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/**
 * Create a new transaction with timestamps
 */
export function createTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Transaction {
  const now = new Date().toISOString();
  return {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Format currency for display
 * Uses simple formatting without currency symbol for flexibility
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/**
 * Format currency with symbol for display
 * @param amount - The amount to format
 * @param symbol - Optional symbol prefix (empty by default)
 * @param isNegative - Whether to show negative sign (true = show minus, false = hide for expense display)
 */
export function formatCurrencyWithSymbol(amount: number, symbol: string = '', isNegative: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  
  const sign = isNegative && amount < 0 ? '-' : '';
  return `${sign}${symbol ? `${symbol}` : ''}${formatted}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDate(): string {
  return formatDateForInput(new Date());
}

function getDateAtStartOfDay(value: Date): Date {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Resolve a date range from a relative date preset.
 */
export function getDateRangeFromPreset(
  preset: Exclude<TransactionDatePreset, 'custom'>,
  referenceDate: Date = new Date()
): { start: string; end: string } | undefined {
  const today = getDateAtStartOfDay(referenceDate);

  if (preset === 'all') {
    return undefined;
  }

  if (preset === 'today') {
    const value = formatDateForInput(today);
    return { start: value, end: value };
  }

  if (preset === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(today),
    };
  }

  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: formatDateForInput(start),
      end: formatDateForInput(today),
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  start.setMonth(start.getMonth() - 2);
  return {
    start: formatDateForInput(start),
    end: formatDateForInput(today),
  };
}

/**
 * Resolve an icon for a category.
 * Known categories get fixed icons; custom categories get deterministic icons.
 */
export function getCategoryIconName(
  category: string,
  type: TransactionType,
  categoryIcons?: Record<string, string>
): string {
  const normalizedCategory = category.trim().toLowerCase();
  const customIcon =
    categoryIcons?.[getCategoryIconKey(type, normalizedCategory)];
  if (customIcon) return customIcon;

  const iconMap =
    type === 'income' ? INCOME_CATEGORY_ICON_MAP : EXPENSE_CATEGORY_ICON_MAP;
  const fallbackIcons =
    type === 'income' ? INCOME_FALLBACK_ICONS : EXPENSE_FALLBACK_ICONS;

  const directIcon = iconMap[normalizedCategory];
  if (directIcon) return directIcon;

  if (normalizedCategory.includes('food') || normalizedCategory.includes('meal')) {
    return 'silverware-fork-knife';
  }
  if (normalizedCategory.includes('rent') || normalizedCategory.includes('bill')) {
    return 'home-lightning-bolt-outline';
  }
  if (normalizedCategory.includes('tax') || normalizedCategory.includes('fee')) {
    return 'file-document-outline';
  }
  if (normalizedCategory.includes('gift')) {
    return 'gift-outline';
  }
  if (
    normalizedCategory.includes('pay') ||
    normalizedCategory.includes('salary') ||
    normalizedCategory.includes('income')
  ) {
    return 'briefcase-outline';
  }

  const fallbackIndex = hashString(
    `${type}:${normalizedCategory || 'category'}`
  ) % fallbackIcons.length;
  return fallbackIcons[fallbackIndex];
}

/**
 * Check if transaction matches filters
 */
export function matchesFilters(
  transaction: Transaction,
  filters: TransactionFilters
): boolean {
  // Skip deleted transactions
  if (transaction.deleted) return false;

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      transaction.category.toLowerCase().includes(searchLower) ||
      (transaction.notes &&
        transaction.notes.toLowerCase().includes(searchLower)) ||
      (transaction.tags &&
        transaction.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        ));
    if (!matchesSearch) return false;
  }

  // Date range filter
  if (filters.date?.start) {
    if (transaction.date < filters.date.start) return false;
  }
  if (filters.date?.end) {
    if (transaction.date > filters.date.end) return false;
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    if (transaction.category !== filters.category) return false;
  }

  // Account filter
  if (filters.account && filters.account !== 'all') {
    if (transaction.account !== filters.account) return false;
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    const hasAllTags = filters.tags.every((tag) =>
      transaction.tags?.includes(tag)
    );
    if (!hasAllTags) return false;
  }

  return true;
}

/**
 * Get unique categories from transactions and default categories
 */
export function getUniqueCategories(
  transactions: Transaction[],
  type: TransactionType,
  defaultCategories: readonly string[]
): string[] {
  // Get categories from transactions
  const transactionCategories = transactions
    .filter((t) => t.type === type && !t.deleted)
    .map((t) => t.category);

  // Combine with defaults and get unique values
  const allCategories = [...defaultCategories, ...transactionCategories];
  const uniqueCategories = [...new Set(allCategories)];

  return uniqueCategories.sort();
}

/**
 * Get unique tags from transactions
 */
export function getUniqueTags(transactions: Transaction[]): string[] {
  const tags = transactions
    .filter((t) => t.tags && t.tags.length > 0 && !t.deleted)
    .flatMap((t) => t.tags!);

  return [...new Set(tags)].sort();
}

/**
 * Get last transaction (most recent by date)
 */
export function getLastTransaction(
  transactions: Transaction[],
  type?: TransactionType
): Transaction | null {
  const filtered = type
    ? transactions.filter((t) => t.type === type && !t.deleted)
    : transactions.filter((t) => !t.deleted);

  if (filtered.length === 0) return null;

  // Sort by date descending, then by createdAt descending
  const sorted = [...filtered].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return sorted[0];
}

/**
 * Validate amount
 */
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Amount must be a number' };
  }
  if (!isFinite(amount)) {
    return { valid: false, error: 'Invalid number' };
  }
  if (amount === 0) {
    return { valid: false, error: 'Amount cannot be zero' };
  }
  return { valid: true };
}

/**
 * Format tags array to comma-separated string
 */
export function formatTagsForDisplay(tags?: string[]): string {
  if (!tags || tags.length === 0) return '';
  return tags.join(', ');
}

/**
 * Parse tags from comma-separated string
 */
export function parseTagsFromString(tagString: string): string[] {
  if (!tagString.trim()) return [];
  return tagString
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Get default categories for a transaction type
 */
export function getDefaultCategories(type: TransactionType): string[] {
  if (type === 'income') {
    return [...DEFAULT_INCOME_CATEGORIES];
  }
  return [...DEFAULT_EXPENSE_CATEGORIES];
}

/**
 * Calculate total for a list of transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
  return transactions
    .filter((t) => !t.deleted)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total by type
 */
export function calculateTotalByType(
  transactions: Transaction[],
  type: TransactionType
): number {
  return transactions
    .filter((t) => t.type === type && !t.deleted)
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Sort transactions by date (newest first)
 */
export function sortByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    // First sort by date descending
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    // Then by createdAt descending for same-date transactions
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * Group transactions by date
 */
export function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  const grouped: Record<string, Transaction[]> = {};
  
  for (const transaction of transactions) {
    if (!grouped[transaction.date]) {
      grouped[transaction.date] = [];
    }
    grouped[transaction.date].push(transaction);
  }
  
  return grouped;
}

/**
 * Get transactions for the current month
 */
export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  return transactions.filter((t) => {
    const [year, month] = t.date.split('-').map(Number);
    return year === currentYear && month === currentMonth;
  });
}
