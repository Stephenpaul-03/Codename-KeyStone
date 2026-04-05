import {
  addExpenseCategory,
  addIncomeCategory,
} from "../slices/transactionSlice";
import { TransactionType } from "../utils/types";
import { getCategoryIconOptions } from "../utils/helpers";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";

export function useCategoryModal(activeTab: TransactionType) {
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const [categoryType, setCategoryType] =
    useState<TransactionType>(activeTab);
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState(
    getCategoryIconOptions(activeTab)[0],
  );

  const categoryIconOptions = useMemo(
    () => getCategoryIconOptions(categoryType),
    [categoryType],
  );

  const handleOpen = () => {
    setCategoryType(activeTab);
    setCategoryNameInput("");
    setSelectedCategoryIcon(getCategoryIconOptions(activeTab)[0]);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleChangeCategoryType = (type: TransactionType) => {
    setCategoryType(type);
    setSelectedCategoryIcon(getCategoryIconOptions(type)[0]);
  };

  const handleSubmit = () => {
    const nextName = categoryNameInput.trim();
    if (!nextName) return;

    if (categoryType === "income") {
      dispatch(addIncomeCategory({ name: nextName, icon: selectedCategoryIcon }));
    } else {
      dispatch(addExpenseCategory({ name: nextName, icon: selectedCategoryIcon }));
    }

    setCategoryNameInput("");
    setSelectedCategoryIcon(getCategoryIconOptions(categoryType)[0]);
    setIsOpen(false);
  };

  return {
    isOpen,
    categoryType,
    categoryNameInput,
    selectedCategoryIcon,
    categoryIconOptions,
    setCategoryNameInput,
    setSelectedCategoryIcon,
    handleOpen,
    handleClose,
    handleChangeCategoryType,
    handleSubmit,
  };
}