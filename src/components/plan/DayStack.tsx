import { useState, useEffect } from "react";
import type { GroupedPlan, PlanRow, SelectedCell } from "@/app/(authenticated)/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/(authenticated)/plan/page";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Slot color mapping for warm pastel theme (shared with WeekGrid)
const SLOT_COLORS: Record<string, { bg: string; card: string; border: string }> = {
  breakfast: {
    bg: "bg-slot-breakfast-bg",
    card: "bg-slot-breakfast-card",
    border: "border-slot-breakfast-border",
  },
  lunch: {
    bg: "bg-slot-lunch-bg",
    card: "bg-slot-lunch-card",
    border: "border-slot-lunch-border",
  },
  snack: {
    bg: "bg-slot-snack-bg",
    card: "bg-slot-snack-card",
    border: "border-slot-snack-border",
  },
  "dinner:main": {
    bg: "bg-slot-dinner-bg",
    card: "bg-slot-dinner-card",
    border: "border-slot-dinner-border",
  },
  "dinner:side": {
    bg: "bg-slot-dinner-bg",
    card: "bg-slot-dinner-card",
    border: "border-slot-dinner-border",
  },
  "dinner:pudding": {
    bg: "bg-slot-dinner-bg",
    card: "bg-slot-dinner-card",
    border: "border-slot-dinner-border",
  },
};

function formatDay(ymd: string) {
  const date = new Date(ymd + "T00:00:00");
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function formatDayShort(ymd: string) {
  const date = new Date(ymd + "T00:00:00");
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

// Droppable cell wrapper for cross-slot drops
function DroppableCell({
  date,
  slot,
  colors,
  children,
}: {
  date: string;
  slot: string;
  colors: { bg: string; card: string; border: string };
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${date}-${slot}`,
    data: { type: "cell", date, slot },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl ${colors.bg} border ${colors.border} p-3 transition-colors ${
        isOver ? "ring-2 ring-text-primary ring-opacity-50" : ""
      }`}
    >
      {children}
    </div>
  );
}

// Sortable card component for drag-and-drop
function SortableCard({
  item,
  colors,
  onMealClick,
}: {
  item: PlanRow;
  colors: { bg: string; card: string; border: string };
  onMealClick: (meal: PlanRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "card", item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={() => onMealClick(item)}
      className={`rounded-xl ${colors.card} border ${colors.border} px-3 py-2 text-sm text-text-primary text-left hover:opacity-80 transition-opacity touch-none`}
    >
      <span className="font-medium">{item.recipes?.title ?? "Untitled"}</span>
    </button>
  );
}

type DayStackProps = {
  dates: string[];
  grouped: GroupedPlan;
  today: string;
  onCellClick: (cell: SelectedCell) => void;
  onMealClick: (meal: PlanRow) => void;
};

export function DayStack({ dates, grouped, today, onCellClick, onMealClick }: DayStackProps) {
  // Find today's index in the current week (if visible)
  const todayIndex = dates.indexOf(today);
  const [selectedIndex, setSelectedIndex] = useState(todayIndex >= 0 ? todayIndex : 0);

  // Reset to today's tab when week changes (or Monday if today not in week)
  useEffect(() => {
    const newTodayIndex = dates.indexOf(today);
    setSelectedIndex(newTodayIndex >= 0 ? newTodayIndex : 0);
  }, [dates, today]);

  const day = dates[selectedIndex] ?? dates[0];
  const slots = grouped[day] ?? {};

  return (
    <div className="space-y-4">
      {/* Day tabs - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {dates.map((d, i) => {
          const isToday = d === today;
          const isSelected = i === selectedIndex;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? "bg-text-primary text-white"
                  : isToday
                  ? "bg-brand-accent/20 text-brand-primary ring-1 ring-brand-primary/30"
                  : "bg-surface-muted text-text-secondary hover:bg-surface-muted/80"
              }`}
            >
              {formatDayShort(d)}
              {isToday && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Current day header */}
      <div className="px-1">
        <div className="text-xl font-semibold text-text-primary">{formatDay(day)}</div>
      </div>

      {SLOT_ORDER.map((slot) => {
        const items: PlanRow[] = slots[slot] ?? [];
        const colors = SLOT_COLORS[slot] ?? SLOT_COLORS.breakfast;
        const itemIds = items.map((it) => it.id);

        return (
          <section key={slot} className="space-y-2">
            <div className="px-1 text-sm font-medium text-text-secondary">{SLOT_LABEL[slot]}</div>

            <DroppableCell date={day} slot={slot} colors={colors}>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {items.map((it) => (
                    <SortableCard key={it.id} item={it} colors={colors} onMealClick={onMealClick} />
                  ))}

                  <button
                    type="button"
                    onClick={() => onCellClick({ date: day, slot })}
                    className={`rounded-xl border border-dashed ${colors.border} bg-white/50 px-3 py-2 text-xs text-text-muted hover:bg-white/80 transition-colors cursor-pointer`}
                  >
                    Tap to add
                  </button>
                </div>
              </SortableContext>
            </DroppableCell>
          </section>
        );
      })}
    </div>
  );
}
