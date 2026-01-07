import type { GroupedPlan, PlanRow, SelectedCell } from "@/app/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/plan/page";

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
  grouped: GroupedPlan;
  onCellClick: (cell: SelectedCell) => void;
  onMealClick: (meal: PlanRow) => void;
};

export function WeekGrid({ grouped, onCellClick, onMealClick }: WeekGridProps) {
  const dates = Object.keys(grouped).sort();
  const labelCol = "160px";
  const gridCols = `${labelCol} repeat(${dates.length}, minmax(0, 1fr))`;

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: gridCols }}>
        {/* Header row (MUST be exactly 1 + dates.length cells) */}
        <div className="border-b border-r border-border bg-surface-muted" />
        {dates.map((d) => (
          <div
            key={d}
            className="border-b border-border bg-surface-muted px-3 py-3 text-sm font-semibold text-text-primary"
          >
            {formatHeader(d)}
          </div>
        ))}

        {/* Body rows */}
        {SLOT_ORDER.map((slot) => (
          <Row key={slot} slot={slot} dates={dates} grouped={grouped} onCellClick={onCellClick} onMealClick={onMealClick} />
        ))}
      </div>
    </div>
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

        return (
          <div key={date + slot} className={`border-b border-border ${colors.bg} px-2 py-2`}>
            <div className="min-h-[72px] rounded-xl p-2">
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onMealClick(it)}
                    className={`rounded-xl ${colors.card} border ${colors.border} px-3 py-2 text-sm text-text-primary shadow-sm text-left hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    <div className="line-clamp-2 font-medium">{it.recipes?.title ?? "Untitled"}</div>
                    {it.notes ? (
                      <div className="mt-1 text-xs text-text-secondary line-clamp-2">{it.notes}</div>
                    ) : null}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => onCellClick({ date, slot })}
                  className={`rounded-xl border border-dashed ${colors.border} bg-white/50 px-3 py-2 text-xs text-text-muted hover:bg-white/80 transition-colors cursor-pointer`}
                >
                  Tap to add
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
