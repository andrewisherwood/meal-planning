import type { GroupedPlan, PlanRow } from "@/app/plan/page";
import { SLOT_LABEL, SLOT_ORDER } from "@/app/plan/page";

function formatHeader(ymd: string) {
  return ymd;
}

export function WeekGrid({ grouped }: { grouped: GroupedPlan }) {
  const dates = Object.keys(grouped).sort();
  const labelCol = "160px";
  const gridCols = `${labelCol} repeat(${dates.length}, minmax(0, 1fr))`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: gridCols }}>
        {/* Header row (MUST be exactly 1 + dates.length cells) */}
        <div className="border-b border-r border-slate-200 bg-slate-50" />
        {dates.map((d) => (
          <div
            key={d}
            className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
          >
            {formatHeader(d)}
          </div>
        ))}

        {/* Body rows */}
        {SLOT_ORDER.map((slot) => (
          <Row key={slot} slot={slot} dates={dates} grouped={grouped} />
        ))}
      </div>
    </div>
  );
}

function Row({
  slot,
  dates,
  grouped,
}: {
  slot: (typeof SLOT_ORDER)[number];
  dates: string[];
  grouped: GroupedPlan;
}) {
  return (
    <>
      {/* Row label */}
      <div className="border-r border-b border-slate-200 bg-white px-3 py-3">
        <div className="text-sm font-medium text-slate-700">{SLOT_LABEL[slot]}</div>
      </div>

      {/* Cells */}
      {dates.map((date) => {
        const items: PlanRow[] = grouped[date]?.[slot] ?? [];

        return (
          <div key={date + slot} className="border-b border-slate-200 px-2 py-2">
            <div className="min-h-[72px] rounded-xl bg-slate-50 p-2">
              <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm"
                  >
                    <div className="line-clamp-2">{it.recipes?.title ?? "Untitled"}</div>
                    {it.notes ? (
                      <div className="mt-1 text-xs text-slate-500 line-clamp-2">{it.notes}</div>
                    ) : null}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-400">
                    Tap to add
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
