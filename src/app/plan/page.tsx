"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type JoinedRecipe = {
  id: string;
  title: string;
  slug: string;
  tags: string[] | null;
};

type PlanRow = {
  id: string;
  date: string; // YYYY-MM-DD
  meal: string; // slot key (breakfast, lunch, dinner:main, dinner:side, dinner:pudding)
  pos: number;
  notes: string | null;
  recipe_id: string;
  recipes: JoinedRecipe | null;
};

const SLOT_ORDER = ["breakfast", "lunch", "dinner:main", "dinner:side", "dinner:pudding"] as const;

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
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

function groupPlan(rows: PlanRow[]) {
  const byDate: Record<string, Record<string, PlanRow[]>> = {};

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

      // 1) Resolve household by slug (no hardcoded UUIDs)
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

      // 2) Pull the same 7-day window you seeded (today → +6)
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
  const dates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading plan…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Plan</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>This Week</h1>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>{householdName}</div>

      <div style={{ display: "grid", gap: 12 }}>
        {dates.map((date) => (
          <div key={date} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{date}</div>

            {SLOT_ORDER.map((slot) => {
              const items = grouped[date]?.[slot] ?? [];
              if (!items.length) return null;

              return (
                <div key={slot} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{SLOT_LABEL[slot]}</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {items.map((it) => (
                      <li key={it.id}>
                        {it.recipes?.title ?? "Untitled"}
                        {it.notes ? <span style={{ opacity: 0.7 }}> — {it.notes}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
