import type { GroupedPlan, PlanRow } from "@/app/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/plan/page";

function pickDefaultDay(grouped: GroupedPlan) {
  // For Loop 1, pick the earliest day in the loaded range.
  // Later we’ll choose "today" if present and add a date picker.
  return Object.keys(grouped).sort()[0];
}

export function DayStack({ grouped }: { grouped: GroupedPlan }) {
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
                  <div
                    key={it.id}
                    className="rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary"
                  >
                    {it.recipes?.title ?? "Untitled"}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-xs text-text-muted">
                    Tap to add
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
