"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Recipe = {
  id: string;
  title: string;
  slug: string;
  prep_minutes: number | null;
  cook_minutes: number | null;
  tags: string[] | null;
  image_url: string | null;
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
        .select("id,title,slug,prep_minutes,cook_minutes,tags,image_url")
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recipes.map((r) => {
            const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
            return (
              <Link
                key={r.id}
                href={`/r/${r.slug}`}
                className="block border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-surface"
              >
                {/* Image or placeholder */}
                <div className="relative aspect-[16/9] bg-brand-accent">
                  {r.image_url ? (
                    <Image
                      src={r.image_url}
                      alt={r.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white/60"
                      >
                        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                        <path d="M7 2v20" />
                        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Card content */}
                <div className="p-3">
                  <div className="text-base font-semibold text-text-primary line-clamp-2 leading-snug">
                    {r.title}
                  </div>
                  <div className="text-sm text-text-secondary mt-1.5">
                    {total ? `${total} min` : "—"}
                    {r.tags?.length ? ` · ${r.tags.slice(0, 2).join(", ")}` : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
