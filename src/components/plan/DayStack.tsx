import type { GroupedPlan, PlanRow, SelectedCell } from "@/app/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/plan/page";

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

function pickDefaultDay(grouped: GroupedPlan) {
  // For Loop 1, pick the earliest day in the loaded range.
  // Later we'll choose "today" if present and add a date picker.
  return Object.keys(grouped).sort()[0];
}

type DayStackProps = {
  grouped: GroupedPlan;
  onCellClick: (cell: SelectedCell) => void;
  onMealClick: (meal: PlanRow) => void;
};

export function DayStack({ grouped, onCellClick, onMealClick }: DayStackProps) {
  const day = pickDefaultDay(grouped);
  const slots = grouped[day] ?? {};

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xl font-semibold text-text-primary">{formatDay(day)}</div>
      </div>

      {SLOT_ORDER.map((slot) => {
        const items: PlanRow[] = slots[slot] ?? [];
        const colors = SLOT_COLORS[slot] ?? SLOT_COLORS.breakfast;

        return (
          <section key={slot} className="space-y-2">
            <div className="px-1 text-sm font-medium text-text-secondary">{SLOT_LABEL[slot]}</div>

            <div className={`rounded-2xl ${colors.bg} border ${colors.border} p-3`}>
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onMealClick(it)}
                    className={`rounded-xl ${colors.card} border ${colors.border} px-3 py-2 text-sm text-text-primary text-left hover:opacity-80 transition-opacity cursor-pointer`}
                  >
                    <span className="font-medium">{it.recipes?.title ?? "Untitled"}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => onCellClick({ date: day, slot })}
                  className={`rounded-xl border border-dashed ${colors.border} bg-white/50 px-3 py-2 text-xs text-text-muted hover:bg-white/80 transition-colors cursor-pointer`}
                >
                  Tap to add
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
