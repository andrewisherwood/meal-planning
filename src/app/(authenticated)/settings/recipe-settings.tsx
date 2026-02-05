"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RecipeSettingsProps = {
  initialUnitSystem: string;
  initialDefaultServings: number;
};

export function RecipeSettings({
  initialUnitSystem,
  initialDefaultServings,
}: RecipeSettingsProps) {
  const [unitSystem, setUnitSystem] = useState(initialUnitSystem);
  const [defaultServings, setDefaultServings] = useState(initialDefaultServings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("households")
      .update({
        unit_system: unitSystem,
        default_servings: defaultServings,
      })
      .not("id", "is", null); // Updates the user's household (RLS filters)

    setSaving(false);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Unit System */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Measurement Units
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUnitSystem("metric")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              unitSystem === "metric"
                ? "bg-text-primary text-surface"
                : "bg-surface-muted text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            Metric (g, ml)
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem("imperial")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              unitSystem === "imperial"
                ? "bg-text-primary text-surface"
                : "bg-surface-muted text-text-secondary hover:text-text-primary border border-border"
            }`}
          >
            Imperial (oz, cups)
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1.5">
          Used when adding recipes via voice or text
        </p>
      </div>

      {/* Default Servings */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Default Servings
        </label>
        <select
          value={defaultServings}
          onChange={(e) => setDefaultServings(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "serving" : "servings"}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-muted mt-1.5">
          Default number of servings for new recipes
        </p>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 rounded-lg bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
