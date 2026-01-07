"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { WeekGrid } from "@/components/plan/WeekGrid";
import { DayStack } from "@/components/plan/DayStack";

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

export default function PlanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [householdName, setHouseholdName] = useState<string>("");

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

      setRows((data ?? []) as PlanRow[]);
      setLoading(false);
    };

    run();
  }, []);

  const grouped = useMemo(() => groupPlan(rows), [rows]);

  if (loading) {
    return <div className="p-6 text-slate-600">Loading plan…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-2">Plan</h1>
        <pre className="whitespace-pre-wrap text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Meal Plan</h1>
        <div className="text-sm text-slate-500">{householdName}</div>
      </div>

      {/* md+ → Week grid (planning) */}
      <div className="hidden md:block">
        <WeekGrid grouped={grouped} />
      </div>

      {/* <md → Day stack (checking) */}
      <div className="md:hidden">
        <DayStack grouped={grouped} />
      </div>
    </div>
  );
}
