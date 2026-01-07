import type { GroupedPlan, PlanRow, SelectedCell } from "@/app/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/plan/page";

function formatHeader(ymd: string) {
  return ymd;
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
  return (
    <>
      {/* Row label */}
      <div className="border-r border-b border-border bg-surface px-3 py-3">
        <div className="text-sm font-medium text-text-primary">{SLOT_LABEL[slot]}</div>
      </div>

      {/* Cells */}
      {dates.map((date) => {
        const items: PlanRow[] = grouped[date]?.[slot] ?? [];

        return (
          <div key={date + slot} className="border-b border-border px-2 py-2">
            <div className="min-h-[72px] rounded-xl bg-surface-muted p-2">
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onMealClick(it)}
                    className="rounded-lg bg-surface border border-border px-3 py-2 text-sm text-text-primary shadow-sm text-left hover:bg-surface-muted transition-colors cursor-pointer"
                  >
                    <div className="line-clamp-2">{it.recipes?.title ?? "Untitled"}</div>
                    {it.notes ? (
                      <div className="mt-1 text-xs text-text-secondary line-clamp-2">{it.notes}</div>
                    ) : null}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => onCellClick({ date, slot })}
                  className="rounded-lg border border-dashed border-border bg-surface px-3 py-2 text-xs text-text-muted hover:bg-surface-muted hover:border-text-muted transition-colors cursor-pointer"
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
