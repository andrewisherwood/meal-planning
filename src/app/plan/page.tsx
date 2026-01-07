"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { WeekGrid } from "@/components/plan/WeekGrid";
import { DayStack } from "@/components/plan/DayStack";
import { AddDrawer } from "@/components/plan/AddDrawer";
import { CookModal } from "@/components/plan/CookModal";

export type JoinedRecipe = {
  id: string;
  title: string;
  slug: string;
  tags: string[] | null;
};

export type PlanRow = {
  id: string;
  date: string; // YYYY-MM-DD
  meal: string; // slot key (breakfast, lunch, snack, dinner:main, dinner:side, dinner:pudding)
  pos: number;
  notes: string | null;
  recipe_id: string;
  recipes: JoinedRecipe | null;
};

export const SLOT_ORDER = [
  "breakfast",
  "lunch",
  "snack",
  "dinner:main",
  "dinner:side",
  "dinner:pudding",
] as const;

export const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  "dinner:main": "Dinner — Main",
  "dinner:side": "Dinner — Sides",
  "dinner:pudding": "Dinner — Pudding",
};

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export type GroupedPlan = Record<string, Record<string, PlanRow[]>>;

function groupPlan(rows: PlanRow[]): GroupedPlan {
  const byDate: GroupedPlan = {};

  for (const r of rows) {
    (byDate[r.date] ??= {});
    (byDate[r.date][r.meal] ??= []).push(r);
  }

  for (const date of Object.keys(byDate)) {
    for (const slot of Object.keys(byDate[date])) {
      byDate[date][slot].sort((a, b) => a.pos - b.pos);
    }
  }

  return byDate;
}

export type SelectedCell = { date: string; slot: string } | null;

export type Recipe = {
  id: string;
  title: string;
  slug: string;
  tags: string[] | null;
};

export default function PlanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [householdName, setHouseholdName] = useState<string>("");
  const [householdId, setHouseholdId] = useState<string>("");
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [selectedMeal, setSelectedMeal] = useState<PlanRow | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const { data: hh, error: hhErr } = await supabase
        .from("households")
        .select("id,name")
        .eq("slug", "isherwood")
        .single();

      if (hhErr) {
        setError(`Household lookup failed: ${hhErr.message}`);
        setLoading(false);
        return;
      }

      setHouseholdName(hh.name);
      setHouseholdId(hh.id);

      const start = new Date();
      const startYmd = ymd(start);
      const endYmd = ymd(addDays(start, 6));

      const { data, error: planErr } = await supabase
        .from("meal_plan")
        .select(
          `
          id,
          date,
          meal,
          pos,
          notes,
          recipe_id,
          recipes:recipes (
            id,
            title,
            slug,
            tags
          )
        `
        )
        .eq("household_id", hh.id)
        .gte("date", startYmd)
        .lte("date", endYmd)
        .order("date", { ascending: true })
        .order("meal", { ascending: true })
        .order("pos", { ascending: true });

      if (planErr) {
        setError(`Meal plan query failed: ${planErr.message}`);
        setLoading(false);
        return;
      }

      // Supabase returns embedded relations as arrays; normalize to single object
      const normalized: PlanRow[] = (data ?? []).map((row) => ({
        ...row,
        recipes: Array.isArray(row.recipes) ? row.recipes[0] ?? null : row.recipes,
      }));

      setRows(normalized);
      setLoading(false);
    };

    run();
  }, []);

  const grouped = useMemo(() => groupPlan(rows), [rows]);

  const handleAddRecipe = async (recipe: Recipe) => {
    if (!selectedCell) return;

    // Calculate next pos for this date + slot
    const existing = rows.filter(
      (r) => r.date === selectedCell.date && r.meal === selectedCell.slot
    );
    const maxPos = existing.length > 0 ? Math.max(...existing.map((r) => r.pos)) : 0;
    const newPos = maxPos + 1;

    // Optimistic update
    const newRow: PlanRow = {
      id: crypto.randomUUID(),
      date: selectedCell.date,
      meal: selectedCell.slot,
      pos: newPos,
      recipe_id: recipe.id,
      recipes: { id: recipe.id, title: recipe.title, slug: recipe.slug, tags: recipe.tags },
      notes: null,
    };
    setRows([...rows, newRow]);
    setSelectedCell(null); // Close drawer

    // Persist to DB
    const { error } = await supabase.from("meal_plan").insert({
      household_id: householdId,
      date: selectedCell.date,
      meal: selectedCell.slot,
      pos: newPos,
      recipe_id: recipe.id,
    });

    if (error) {
      console.error("Failed to add recipe:", error);
      // Could revert optimistic update here if needed
    }
  };

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading plan…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-text-primary mb-2">Plan</h1>
        <pre className="whitespace-pre-wrap text-sm text-error bg-error-bg border border-error-border rounded-lg p-3">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-text-primary">Meal Plan</h1>
        <div className="text-sm text-text-secondary">{householdName}</div>
      </div>

      {/* md+ → Week grid (planning) */}
      <div className="hidden md:block">
        <WeekGrid grouped={grouped} onCellClick={setSelectedCell} onMealClick={setSelectedMeal} />
      </div>

      {/* <md → Day stack (checking) */}
      <div className="md:hidden">
        <DayStack grouped={grouped} onCellClick={setSelectedCell} onMealClick={setSelectedMeal} />
      </div>

      {/* Add drawer */}
      {selectedCell && (
        <AddDrawer
          open={true}
          onClose={() => setSelectedCell(null)}
          date={selectedCell.date}
          slot={selectedCell.slot}
          householdId={householdId}
          onAddRecipe={handleAddRecipe}
        />
      )}

      {/* Cook modal */}
      <CookModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
    </div>
  );
}
