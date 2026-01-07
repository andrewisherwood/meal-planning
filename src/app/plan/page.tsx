"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, TouchSensor, useSensors, useSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
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
  const [activeId, setActiveId] = useState<string | null>(null);

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

  // Generate all 7 days starting from today (ensures empty days show in grid)
  const weekDates = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, i) => ymd(addDays(start, i)));
  }, []);

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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-text-primary">Meal Plan</h1>
        <div className="text-sm text-text-secondary">{householdName}</div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* md+ → Week grid (planning) */}
        <div className="hidden md:block">
          <WeekGrid dates={weekDates} grouped={grouped} onCellClick={setSelectedCell} onMealClick={setSelectedMeal} />
        </div>

        {/* <md → Day stack (checking) */}
        <div className="md:hidden">
          <DayStack dates={weekDates} grouped={grouped} onCellClick={setSelectedCell} onMealClick={setSelectedMeal} />
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
      />
    </div>
  );
}
