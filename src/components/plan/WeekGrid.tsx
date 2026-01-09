import type { GroupedPlan, PlanRow, SelectedCell } from "@/app/(authenticated)/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/(authenticated)/plan/page";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// Slot color mapping for warm pastel theme
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

function formatHeader(ymd: string) {
  const date = new Date(ymd + "T00:00:00");
  const day = date.toLocaleDateString("en-GB", { weekday: "short" });
  const num = date.getDate();
  return `${day} ${num}`;
}

type WeekGridProps = {
  dates: string[];
  grouped: GroupedPlan;
  today: string;
  onCellClick: (cell: SelectedCell) => void;
  onMealClick: (meal: PlanRow) => void;
};

export function WeekGrid({ dates, grouped, today, onCellClick, onMealClick }: WeekGridProps) {
  const labelCol = "160px";
  const gridCols = `${labelCol} repeat(${dates.length}, minmax(0, 1fr))`;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: gridCols }}>
        {/* Header row (MUST be exactly 1 + dates.length cells) */}
        <div className="border-b border-r border-border bg-surface-muted" />
        {dates.map((d) => {
          const isToday = d === today;
          return (
            <div
              key={d}
              className={`border-b border-border px-3 py-3 text-sm font-semibold ${
                isToday
                  ? "bg-brand-accent/20 text-brand-primary"
                  : "bg-surface-muted text-text-primary"
              }`}
            >
              <span className={isToday ? "inline-flex items-center gap-1.5" : ""}>
                {formatHeader(d)}
                {isToday && (
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-primary" />
                )}
              </span>
            </div>
          );
        })}

        {/* Body rows */}
        {SLOT_ORDER.map((slot) => (
          <Row key={slot} slot={slot} dates={dates} grouped={grouped} onCellClick={onCellClick} onMealClick={onMealClick} />
        ))}
      </div>
    </div>
  );
}

// Droppable cell wrapper for cross-day/cross-slot drops
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
      className={`min-h-[72px] rounded-xl p-2 transition-colors ${
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
      className={`rounded-xl ${colors.card} border ${colors.border} px-3 py-2 text-sm text-text-primary shadow-sm text-left hover:opacity-80 transition-opacity touch-none`}
    >
      <div className="line-clamp-2 font-medium">{item.recipes?.title ?? "Untitled"}</div>
      {item.notes ? (
        <div className="mt-1 text-xs text-text-secondary line-clamp-2">{item.notes}</div>
      ) : null}
    </button>
  );
}

function Row({
  slot,
  dates,
  grouped,
  onCellClick,
  onMealClick,
}: {
  slot: (typeof SLOT_ORDER)[number];
  dates: string[];
  grouped: GroupedPlan;
  onCellClick: (cell: SelectedCell) => void;
  onMealClick: (meal: PlanRow) => void;
}) {
  const colors = SLOT_COLORS[slot] ?? SLOT_COLORS.breakfast;

  return (
    <>
      {/* Row label */}
      <div className={`border-r border-b border-border ${colors.bg} px-3 py-3`}>
        <div className="text-sm font-medium text-text-primary">{SLOT_LABEL[slot]}</div>
      </div>

      {/* Cells */}
      {dates.map((date) => {
        const items: PlanRow[] = grouped[date]?.[slot] ?? [];
        const itemIds = items.map((it) => it.id);

        return (
          <div key={date + slot} className={`border-b border-border ${colors.bg} px-2 py-2`}>
            <DroppableCell date={date} slot={slot} colors={colors}>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {items.map((it) => (
                    <SortableCard key={it.id} item={it} colors={colors} onMealClick={onMealClick} />
                  ))}

                  <button
                    type="button"
                    onClick={() => onCellClick({ date, slot })}
                    className={`rounded-xl border border-dashed ${colors.border} bg-white/50 px-3 py-2 text-xs text-text-muted hover:bg-white/80 transition-colors cursor-pointer`}
                  >
                    Tap to add
                  </button>
                </div>
              </SortableContext>
            </DroppableCell>
          </div>
        );
      })}
    </>
  );
}
