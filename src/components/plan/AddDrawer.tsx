"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { SLOT_LABEL } from "@/app/(authenticated)/plan/page";
import { createClient } from "@/lib/supabase/client";

// Hook to detect desktop breakpoint (md = 768px)
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

type Recipe = {
  id: string;
  title: string;
  slug: string;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
};

type AddDrawerProps = {
  open: boolean;
  onClose: () => void;
  date: string;
  slot: string;
  householdId: string;
  onAddRecipe: (recipe: Recipe) => void;
};

function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDayName(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

// Mealtime filters
const MEALTIME_FILTERS = ["all", "breakfast", "lunch", "dinner", "snack", "soup", "pudding", "side"] as const;

// Dietary/attribute filters
const ATTRIBUTE_FILTERS = ["vegetarian", "vegan", "kid_friendly", "quick", "batch_cook", "freezer_friendly"] as const;

// Human-readable labels
const FILTER_LABELS: Record<string, string> = {
  all: "All",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  kid_friendly: "Kid Friendly",
  quick: "Quick",
  batch_cook: "Batch Cook",
  freezer_friendly: "Freezer",
  soup: "Soup",
  pudding: "Pudding",
  side: "Side",
};

type FilterOption = typeof MEALTIME_FILTERS[number] | typeof ATTRIBUTE_FILTERS[number];

function slotToFilter(slot: string): FilterOption {
  if (slot === "breakfast") return "breakfast";
  if (slot === "lunch") return "lunch";
  if (slot === "snack") return "snack";
  if (slot.startsWith("dinner:")) return "dinner";
  return "all";
}

export function AddDrawer({ open, onClose, date, slot, householdId, onAddRecipe }: AddDrawerProps) {
  const slotLabel = SLOT_LABEL[slot] ?? slot;
  const isDesktop = useIsDesktop();
  const defaultFilter = slotToFilter(slot);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>(defaultFilter);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Clear notification after 1.5 seconds
  useEffect(() => {
    if (!notification) return;
    const timeout = setTimeout(() => setNotification(null), 1500);
    return () => clearTimeout(timeout);
  }, [notification]);

  const handleAdd = (recipe: Recipe) => {
    setNotification(`${recipe.title} added to ${slotLabel} for ${getDayName(date)}`);
    onAddRecipe(recipe);
  };

  // Fetch recipes on mount and when query/filter changes (debounced)
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);

      const supabase = createClient();
      let request = supabase
        .from("recipes")
        .select("id,title,slug,prep_minutes,cook_minutes,tags")
        .limit(100);

      // Apply text search
      if (query.trim()) {
        request = request.ilike("title", `%${query.trim()}%`).order("title");
      } else {
        request = request.order("created_at", { ascending: false });
      }

      // Apply mealtime filter (uses Postgres array contains)
      if (filter !== "all") {
        request = request.contains("tags", [filter]);
      }

      const { data, error } = await request;

      if (!controller.signal.aborted) {
        if (error) {
          console.error("Recipe search error:", error);
          setRecipes([]);
        } else {
          setRecipes(data ?? []);
        }
        setLoading(false);
      }
    }, query ? 300 : 0); // Debounce only when searching

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [open, query, filter]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilter(defaultFilter);
      setRecipes([]);
      setNotification(null);
    }
  }, [open, defaultFilter]);

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()} direction={isDesktop ? "right" : "bottom"}>
      <DrawerContent className={isDesktop ? "h-full w-full max-w-md" : ""}>
        <DrawerHeader className="relative pb-2">
          <DrawerClose className="absolute right-4 top-4 text-text-secondary hover:text-text-primary cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
          </DrawerClose>
          <DrawerTitle className="text-xl font-semibold">Add to {slotLabel}</DrawerTitle>
          <DrawerDescription className="text-text-secondary">{formatDate(date)}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-4 overflow-y-auto max-h-[60vh] md:max-h-none">
          {/* Notification */}
          {notification && (
            <div className="px-3 py-2 rounded-lg bg-surface-muted border border-border text-sm text-text-secondary">
              {notification}
            </div>
          )}

          {/* Search input */}
          <input
            type="text"
            placeholder="Search recipes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Mealtime filter chips */}
          <div className="flex flex-wrap gap-2">
            {MEALTIME_FILTERS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filter === opt
                    ? "bg-text-primary text-surface"
                    : "bg-surface-muted text-text-secondary hover:bg-surface hover:text-text-primary border border-border"
                }`}
              >
                {FILTER_LABELS[opt]}
              </button>
            ))}
          </div>

          {/* Attribute filter chips */}
          <div className="flex flex-wrap gap-2">
            {ATTRIBUTE_FILTERS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filter === opt
                    ? "bg-text-primary text-surface"
                    : "bg-surface-muted text-text-secondary hover:bg-surface hover:text-text-primary border border-border"
                }`}
              >
                {FILTER_LABELS[opt]}
              </button>
            ))}
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-sm text-text-muted py-8">
                Loading...
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center text-sm text-text-muted py-8">
                {query || filter !== "all" ? "No recipes found" : "No recipes yet"}
              </div>
            ) : (
              recipes.map((recipe) => {
                const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => handleAdd(recipe)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-colors cursor-pointer"
                  >
                    <div className="text-base font-medium text-text-primary">
                      {recipe.title}
                    </div>
                    <div className="mt-1 text-sm text-text-secondary flex items-center gap-2">
                      {total ? <span>{total} min</span> : null}
                      {recipe.tags?.length ? (
                        <span className="text-text-muted">
                          {recipe.tags.slice(0, 3).join(", ")}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
