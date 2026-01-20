"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generateShoppingList,
  updatePantryItem,
  formatShoppingListForExport,
  formatShoppingListForReminders,
  CATEGORY_ORDER,
  type ShoppingList,
  type ShoppingItem,
} from "@/lib/shopping";

type ShoppingModalProps = {
  open: boolean;
  onClose: () => void;
  householdId: string;
  startDate: string;
  endDate: string;
};

function formatDateRange(start: string, end: string) {
  const formatDate = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function ShoppingModal({
  open,
  onClose,
  householdId,
  startDate,
  endDate,
}: ShoppingModalProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingList>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied">("idle");
  const [showHaveItems, setShowHaveItems] = useState(false);

  // Fetch shopping list when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchList = async () => {
      setLoading(true);
      const list = await generateShoppingList(householdId, startDate, endDate);
      setShoppingList(list);
      setLoading(false);
    };

    fetchList();
  }, [open, householdId, startDate, endDate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShareStatus("idle");
      setShowHaveItems(false);
    }
  }, [open]);

  // Toggle "have" state for an item
  const toggleHave = async (item: ShoppingItem) => {
    const newHave = !item.have;

    // Optimistic update
    setShoppingList((prev) => {
      const updated = { ...prev };
      const categoryItems = updated[item.category];
      if (categoryItems) {
        updated[item.category] = categoryItems.map((i) =>
          i.id === item.id ? { ...i, have: newHave } : i
        );
      }
      return updated;
    });

    // Persist to database
    await updatePantryItem(householdId, item.name, newHave);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const text = formatShoppingListForExport(shoppingList, startDate, endDate);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Share shopping list (uses Web Share API on mobile, clipboard fallback)
  const handleShare = async () => {
    const text = formatShoppingListForReminders(shoppingList);

    // Try Web Share API first (works well on iOS Safari)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shopping List",
          text: text,
        });
        setShareStatus("shared");
        setTimeout(() => setShareStatus("idle"), 2000);
        return;
      } catch (err) {
        // User cancelled or share failed - fall back to clipboard
        if ((err as Error).name === "AbortError") {
          return; // User cancelled, don't show any message
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Clear all checks
  const handleClearChecks = async () => {
    // Optimistic update - uncheck all items
    setShoppingList((prev) => {
      const updated: ShoppingList = {};
      for (const [category, items] of Object.entries(prev)) {
        updated[category] = items.map((i) => ({ ...i, have: false }));
      }
      return updated;
    });

    // Persist each item
    const allItems = Object.values(shoppingList).flat();
    await Promise.all(
      allItems
        .filter((item) => item.have)
        .map((item) => updatePantryItem(householdId, item.name, false))
    );
  };

  // Get items sorted: unchecked first, then checked
  const getItemsForCategory = (category: string): ShoppingItem[] => {
    const items = shoppingList[category] ?? [];
    const unchecked = items.filter((i) => !i.have);
    const checked = items.filter((i) => i.have);
    return [...unchecked, ...checked];
  };

  // Count checked and unchecked items
  const allItems = Object.values(shoppingList).flat();
  const checkedCount = allItems.filter((i) => i.have).length;
  const uncheckedCount = allItems.length - checkedCount;

  // Categories with unchecked items (for main list)
  const categoriesWithUnchecked = CATEGORY_ORDER.filter((cat) =>
    shoppingList[cat]?.some((i) => !i.have)
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="bg-white rounded-3xl p-0 max-w-lg w-[90vw] max-h-[85vh] overflow-hidden shadow-2xl border-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-semibold text-text-primary leading-tight">
                Shopping List
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDateRange(startDate, endDate)}
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
              title="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 pt-4 space-y-4 overflow-y-auto max-h-[55vh]">
          {loading ? (
            <p className="text-sm text-text-muted py-8 text-center">
              Loading shopping list...
            </p>
          ) : allItems.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">
              No meals planned for this week
            </p>
          ) : (
            <>
              {/* Summary */}
              <div className="text-sm text-text-secondary">
                {uncheckedCount} item{uncheckedCount !== 1 ? "s" : ""} to buy
                {checkedCount > 0 && ` (${checkedCount} already have)`}
              </div>

              {/* Categories with unchecked items */}
              {categoriesWithUnchecked.map((category) => (
                <section key={category}>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {getItemsForCategory(category)
                      .filter((item) => !item.have)
                      .map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-muted cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={item.have}
                            onChange={() => toggleHave(item)}
                            className="w-5 h-5 rounded border-2 border-border text-text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                          />
                          <span className="text-sm text-text-primary">
                            {item.displayLine}
                          </span>
                        </label>
                      ))}
                  </div>
                </section>
              ))}

              {/* Already have section */}
              {checkedCount > 0 && (
                <section className="pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowHaveItems(!showHaveItems)}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer w-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform ${showHaveItems ? "rotate-90" : ""}`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    Already have ({checkedCount} item{checkedCount !== 1 ? "s" : ""})
                  </button>

                  {showHaveItems && (
                    <div className="mt-3 space-y-1">
                      {allItems
                        .filter((item) => item.have)
                        .map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-muted cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={item.have}
                              onChange={() => toggleHave(item)}
                              className="w-5 h-5 rounded border-2 border-border text-text-primary focus:ring-2 focus:ring-ring cursor-pointer"
                            />
                            <span className="text-sm text-text-muted line-through">
                              {item.displayLine}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!loading && allItems.length > 0 && (
          <div className="p-6 pt-4 border-t border-border space-y-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy List
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-primary font-medium hover:bg-surface-muted transition-colors cursor-pointer"
              >
                {shareStatus === "shared" ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Shared!
                  </>
                ) : shareStatus === "copied" ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share
                  </>
                )}
              </button>
            </div>

            {checkedCount > 0 && (
              <button
                type="button"
                onClick={handleClearChecks}
                className="w-full px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
              >
                Clear all checks
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
