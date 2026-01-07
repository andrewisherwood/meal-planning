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
import { SLOT_LABEL } from "@/app/plan/page";
import { supabase } from "@/lib/supabase";

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

export function AddDrawer({ open, onClose, date, slot, householdId, onAddRecipe }: AddDrawerProps) {
  const slotLabel = SLOT_LABEL[slot] ?? slot;

  const [query, setQuery] = useState("");
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

  // Fetch recipes on mount and when query changes (debounced)
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);

      let request = supabase
        .from("recipes")
        .select("id,title,slug,prep_minutes,cook_minutes,tags")
        .limit(10);

      if (query.trim()) {
        request = request.ilike("title", `%${query.trim()}%`).order("title");
      } else {
        request = request.order("created_at", { ascending: false });
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
  }, [open, query]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setRecipes([]);
      setNotification(null);
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent>
        <DrawerHeader className="relative">
          <DrawerClose className="absolute right-4 top-4 text-text-secondary hover:text-text-primary">
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
          </DrawerClose>
          <DrawerTitle>Add to {slotLabel}</DrawerTitle>
          <DrawerDescription>{formatDate(date)}</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 pb-8 space-y-4">
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

          {/* Results list */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-sm text-text-muted py-4">
                Loading...
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center text-sm text-text-muted py-4">
                {query ? "No recipes found" : "No recipes yet"}
              </div>
            ) : (
              recipes.map((recipe) => {
                const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => handleAdd(recipe)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-muted transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-text-primary">
                      {recipe.title}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {total ? `${total} min` : "—"}
                      {recipe.tags?.length ? ` · ${recipe.tags.join(", ")}` : ""}
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
