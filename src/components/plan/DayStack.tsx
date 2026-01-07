import type { GroupedPlan, PlanRow, SelectedCell } from "@/app/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/plan/page";

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
    <div className="space-y-5">
      <div>
        <div className="text-sm text-text-secondary">Day</div>
        <div className="text-lg font-semibold text-text-primary">{day}</div>
      </div>

      {SLOT_ORDER.map((slot) => {
        const items: PlanRow[] = slots[slot] ?? [];

        return (
          <section key={slot} className="space-y-2">
            <div className="text-sm font-medium text-text-secondary">{SLOT_LABEL[slot]}</div>

            <div className="rounded-xl bg-surface-muted border border-border p-3">
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onMealClick(it)}
                    className="rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary text-left hover:bg-surface-muted transition-colors cursor-pointer"
                  >
                    {it.recipes?.title ?? "Untitled"}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => onCellClick({ date: day, slot })}
                  className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-xs text-text-muted hover:bg-surface-muted hover:border-text-muted transition-colors cursor-pointer"
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
