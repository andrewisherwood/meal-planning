"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_ORDER } from "@/lib/shopping";

type Staple = {
  id: string;
  name: string;
  category: string;
};

type StaplesSettingsProps = {
  householdId: string;
};

export function StaplesSettings({ householdId }: StaplesSettingsProps) {
  const [staples, setStaples] = useState<Staple[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [adding, setAdding] = useState(false);

  // Fetch staples on mount
  useEffect(() => {
    const fetchStaples = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("staples")
        .select("id, name, category")
        .eq("household_id", householdId)
        .order("name");

      if (!error && data) {
        setStaples(data);
      }
      setLoading(false);
    };

    fetchStaples();
  }, [householdId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("staples")
      .insert({
        household_id: householdId,
        name: newName.trim(),
        category: newCategory,
      })
      .select("id, name, category")
      .single();

    if (!error && data) {
      setStaples((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewCategory("Other");
    }

    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("staples").delete().eq("id", id);

    if (!error) {
      setStaples((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (loading) {
    return <p className="text-sm text-text-muted">Loading staples...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Staples are items that appear on every shopping list, regardless of your meal plan.
      </p>

      {/* Add new staple */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g., Milk"
          maxLength={50}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CATEGORY_ORDER.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-text-primary text-surface hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* List of staples */}
      {staples.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">
          No staples yet. Add items that you always need.
        </p>
      ) : (
        <ul className="space-y-2">
          {staples.map((staple) => (
            <li
              key={staple.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-muted"
            >
              <div>
                <span className="text-sm font-medium text-text-primary">{staple.name}</span>
                <span className="text-xs text-text-muted ml-2">({staple.category})</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(staple.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove staple"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
