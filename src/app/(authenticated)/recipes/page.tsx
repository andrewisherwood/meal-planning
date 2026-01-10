"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  title: string;
  slug: string;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
};

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

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recipes when query/filter changes (debounced)
  useEffect(() => {
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

      // Apply tag filter
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
  }, [query, filter]);

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-4">Recipes</h1>

      {/* Search and filter bar */}
      <div className="space-y-3 mb-6">
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
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-sm text-text-muted py-8">Loading...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center text-sm text-text-muted py-8">
          {query || filter !== "all" ? "No recipes found" : "No recipes yet"}
        </div>
      ) : (
        <div className="grid gap-3">
          {recipes.map((r) => {
            const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
            return (
              <Link
                key={r.id}
                href={`/r/${r.slug}`}
                className="block p-4 border border-border rounded-xl hover:bg-surface-muted transition-colors"
              >
                <div className="text-lg font-semibold text-text-primary">{r.title}</div>
                <div className="text-text-secondary mt-1">
                  {total ? `${total} min` : "—"}
                  {r.tags?.length ? ` · ${r.tags.join(", ")}` : ""}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
