"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, TouchSensor, useSensors, useSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { WeekGrid } from "@/components/plan/WeekGrid";
import { DayStack } from "@/components/plan/DayStack";
import { AddDrawer } from "@/components/plan/AddDrawer";
import { CookModal } from "@/components/plan/CookModal";
import { ShoppingModal } from "@/components/plan/ShoppingModal";

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

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday
  return new Date(d.setDate(diff));
}

function formatWeekRange(startYmd: string, endYmd: string): string {
  const start = new Date(startYmd + "T00:00:00");
  const end = new Date(endYmd + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const startStr = start.toLocaleDateString("en-GB", opts);
  const endStr = end.toLocaleDateString("en-GB", { ...opts, year: "numeric" });
  return `${startStr} – ${endStr}`;
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [shoppingOpen, setShoppingOpen] = useState(false);

  // Today's date for highlighting
  const todayYmd = useMemo(() => ymd(new Date()), []);

  // Calculate week dates (Mon-Sun) based on offset
  const weekDates = useMemo(() => {
    const today = new Date();
    const monday = getMonday(today);
    const startOfWeek = addDays(monday, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => ymd(addDays(startOfWeek, i)));
  }, [weekOffset]);

  // Drag-and-drop sensors (pointer for desktop, touch for mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Handle drag start - track active item for overlay
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - reorder within slot OR move to different day/slot
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the dragged item
    const activeItem = rows.find((r) => r.id === activeId);
    if (!activeItem) return;

    // Check if dropped on a cell (cross-day/cross-slot move)
    const overData = over.data.current as { type?: string; date?: string; slot?: string } | undefined;

    if (overData?.type === "cell") {
      // Dropped on a cell - move to that date/slot
      const targetDate = overData.date!;
      const targetSlot = overData.slot!;

      // Skip if dropped on same cell
      if (activeItem.date === targetDate && activeItem.meal === targetSlot) return;

      // Calculate new pos (append to end of target slot)
      const targetSlotItems = rows.filter(
        (r) => r.date === targetDate && r.meal === targetSlot
      );
      const newPos = targetSlotItems.length > 0
        ? Math.max(...targetSlotItems.map((r) => r.pos)) + 1
        : 0;

      // Optimistic update
      const updatedItem = { ...activeItem, date: targetDate, meal: targetSlot, pos: newPos };
      const updatedRows = rows.map((r) => (r.id === activeId ? updatedItem : r));

      // Recalculate pos for source slot (close the gap)
      const sourceSlotItems = updatedRows
        .filter((r) => r.date === activeItem.date && r.meal === activeItem.meal)
        .sort((a, b) => a.pos - b.pos)
        .map((item, index) => ({ ...item, pos: index }));

      const finalRows = updatedRows.map((r) => {
        const updated = sourceSlotItems.find((s) => s.id === r.id);
        return updated ?? r;
      });

      setRows(finalRows);

      // Persist: update the moved item
      const supabase = createClient();
      const { error } = await supabase
        .from("meal_plan")
        .update({ date: targetDate, meal: targetSlot, pos: newPos })
        .eq("id", activeId);

      if (error) {
        console.error("Failed to move meal:", error);
      }

      // Update source slot pos values
      for (const item of sourceSlotItems) {
        if (item.id !== activeId) {
          await supabase
            .from("meal_plan")
            .update({ pos: item.pos })
            .eq("id", item.id);
        }
      }

      return;
    }

    // Dropped on another card - reorder within slot
    const overItem = rows.find((r) => r.id === overId);
    if (!overItem) return;

    // Only handle reordering within the same slot
    if (activeItem.date !== overItem.date || activeItem.meal !== overItem.meal) {
      return; // Different slots handled by cell drop above
    }

    if (activeId === overId) return;

    // Get all items in this slot, sorted by pos
    const slotItems = rows
      .filter((r) => r.date === activeItem.date && r.meal === activeItem.meal)
      .sort((a, b) => a.pos - b.pos);

    const oldIndex = slotItems.findIndex((r) => r.id === activeId);
    const newIndex = slotItems.findIndex((r) => r.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Reorder the slot items
    const reorderedSlotItems = arrayMove(slotItems, oldIndex, newIndex);

    // Assign new pos values (0, 1, 2, ...)
    const updatedSlotItems = reorderedSlotItems.map((item, index) => ({
      ...item,
      pos: index,
    }));

    // Optimistic update: replace slot items in rows
    const otherRows = rows.filter(
      (r) => !(r.date === activeItem.date && r.meal === activeItem.meal)
    );
    setRows([...otherRows, ...updatedSlotItems]);

    // Persist to DB - batch update pos values
    const supabase = createClient();
    for (const item of updatedSlotItems) {
      const { error } = await supabase
        .from("meal_plan")
        .update({ pos: item.pos })
        .eq("id", item.id);

      if (error) {
        console.error("Failed to update pos:", error);
      }
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Get user's household (RLS ensures we only see our own)
      const { data: hh, error: hhErr } = await supabase
        .from("households")
        .select("id,name")
        .single();

      if (hhErr) {
        setError(`Household lookup failed: ${hhErr.message}. Please complete onboarding.`);
        setLoading(false);
        return;
      }

      setHouseholdName(hh.name);
      setHouseholdId(hh.id);

      // Use weekDates for the date range query
      const startYmd = weekDates[0];
      const endYmd = weekDates[6];

      // RLS automatically filters to user's household
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
  }, [weekDates]);

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

    // Only auto-close for dinner:main (other slots stay open for adding multiple items)
    if (selectedCell.slot === "dinner:main") {
      setSelectedCell(null);
    }

    // Persist to DB
    const supabase = createClient();
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

  const handleDeleteMeal = async () => {
    if (!selectedMeal) return;

    // Optimistic update
    setRows(rows.filter((r) => r.id !== selectedMeal.id));
    setSelectedMeal(null);

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from("meal_plan")
      .delete()
      .eq("id", selectedMeal.id);

    if (error) {
      console.error("Failed to delete meal:", error);
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
      {/* Week navigation - desktop */}
      <div className="hidden md:flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            {formatWeekRange(weekDates[0], weekDates[6])}
          </span>
          <button
            type="button"
            onClick={() => setShoppingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-accent text-brand-primary hover:bg-brand-accent/80 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            Shopping
          </button>
        </div>
      </div>

      {/* Week navigation - mobile */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            {formatWeekRange(weekDates[0], weekDates[6])}
          </span>
          <button
            type="button"
            onClick={() => setShoppingOpen(true)}
            className="p-2 rounded-lg bg-brand-accent text-brand-primary hover:bg-brand-accent/80 transition-colors cursor-pointer"
            title="Shopping list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* md+ → Week grid (planning) */}
        <div className="hidden md:block">
          <WeekGrid dates={weekDates} grouped={grouped} today={todayYmd} onCellClick={setSelectedCell} onMealClick={setSelectedMeal} />
        </div>

        {/* <md → Day stack (checking) */}
        <div className="md:hidden">
          <DayStack dates={weekDates} grouped={grouped} today={todayYmd} onCellClick={setSelectedCell} onMealClick={setSelectedMeal} />
        </div>

        {/* Drag overlay - ghost card that follows cursor */}
        <DragOverlay>
          {activeId ? (
            <div className="rounded-xl bg-white border border-border px-3 py-2 text-sm text-text-primary shadow-lg opacity-90">
              <div className="line-clamp-2 font-medium">
                {rows.find((r) => r.id === activeId)?.recipes?.title ?? "Untitled"}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
      <CookModal
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onDelete={handleDeleteMeal}
        onUpdate={() => {
          // Refresh the meal data after edit
          if (selectedMeal) {
            const fetchUpdated = async () => {
              const supabase = createClient();
              const { data } = await supabase
                .from("meal_plan")
                .select(`
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
                `)
                .eq("id", selectedMeal.id)
                .single();

              if (data) {
                const normalized = {
                  ...data,
                  recipes: Array.isArray(data.recipes) ? data.recipes[0] ?? null : data.recipes,
                };
                setRows((prev) => prev.map((r) => (r.id === selectedMeal.id ? normalized : r)));
                setSelectedMeal(normalized);
              }
            };
            fetchUpdated();
          }
        }}
      />

      {/* Shopping list modal */}
      <ShoppingModal
        open={shoppingOpen}
        onClose={() => setShoppingOpen(false)}
        householdId={householdId}
        startDate={weekDates[0]}
        endDate={weekDates[6]}
      />
    </div>
  );
}
