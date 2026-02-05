"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VoiceRecipeInput } from "@/components/VoiceRecipeInput";
import { createClient } from "@/lib/supabase/client";

type ParsedIngredient = {
  line: string;
  name: string;
  qty?: number | null;
  unit?: string | null;
};

type ParsedRecipe = {
  title: string;
  servings?: number | null;
  prep_minutes?: number | null;
  cook_minutes?: number | null;
  tags?: string[] | null;
  notes?: string | null;
  ingredients: ParsedIngredient[];
  steps: string[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type TabId = "voice" | "url" | "photo" | "paste";

const TABS: { id: TabId; label: string }[] = [
  { id: "voice", label: "Voice" },
  { id: "url", label: "URL" },
  { id: "photo", label: "Photo" },
  { id: "paste", label: "Paste" },
];

export default function ImportPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("voice");
  const [pasteText, setPasteText] = useState("");
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<string>("metric");
  const [defaultServings, setDefaultServings] = useState<number>(4);

  // URL tab state
  const [urlInput, setUrlInput] = useState("");
  const [fetchedText, setFetchedText] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // Photo tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch user's household settings on mount
  useEffect(() => {
    async function fetchHousehold() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("households")
        .select("id, unit_system, default_servings")
        .single();

      if (error) {
        setError("Failed to load household. Please complete onboarding.");
        return;
      }
      setHouseholdId(data.id);
      setUnitSystem(data.unit_system ?? "metric");
      setDefaultServings(data.default_servings ?? 4);
    }
    fetchHousehold();
  }, []);

  const handleParseRecipe = async (text: string) => {
    setParsing(true);
    setError(null);
    setParsedRecipe(null);

    try {
      const response = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, unitSystem, defaultServings }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse recipe");
      }

      setParsedRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse recipe");
    } finally {
      setParsing(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pasteText.trim()) {
      handleParseRecipe(pasteText.trim());
    }
  };

  // URL tab: fetch URL content
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;

    setFetchingUrl(true);
    setError(null);
    setFetchedText("");

    try {
      const response = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch URL");
      }

      setFetchedText(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fetchedText.trim()) {
      handleParseRecipe(fetchedText.trim());
    }
  };

  // Photo tab: handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Please select an image (JPG, PNG, GIF, WebP) or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB)");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!selectedFile) return;

    setParsing(true);
    setError(null);
    setParsedRecipe(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Determine media type
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      if (selectedFile.type === "image/png") mediaType = "image/png";
      else if (selectedFile.type === "image/gif") mediaType = "image/gif";
      else if (selectedFile.type === "image/webp") mediaType = "image/webp";
      else if (selectedFile.type === "application/pdf") {
        // For PDFs, we'll send as text extraction request
        // Note: Vision API doesn't support PDF directly, so we treat it differently
        setError("PDF parsing is not yet supported. Please take a photo of the recipe instead.");
        setParsing(false);
        return;
      }

      const response = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: { data: base64, mediaType },
          unitSystem,
          defaultServings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse image");
      }

      setParsedRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse image");
    } finally {
      setParsing(false);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSaveRecipe = async () => {
    if (!parsedRecipe || !householdId) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const slug = slugify(parsedRecipe.title) + "-" + Date.now().toString(36);

      // 1) Insert recipe with household_id for RLS
      const { data: inserted, error: recipeErr } = await supabase
        .from("recipes")
        .insert({
          title: parsedRecipe.title,
          slug,
          servings: parsedRecipe.servings ?? null,
          prep_minutes: parsedRecipe.prep_minutes ?? null,
          cook_minutes: parsedRecipe.cook_minutes ?? null,
          tags: parsedRecipe.tags ?? null,
          notes: parsedRecipe.notes ?? null,
          household_id: householdId,
        })
        .select("id,slug")
        .single();

      if (recipeErr) throw new Error(`Recipe save failed: ${recipeErr.message}`);

      const recipeId = inserted.id as string;

      // 2) Insert ingredients
      if (parsedRecipe.ingredients.length > 0) {
        const { error: ingErr } = await supabase.from("recipe_ingredients").insert(
          parsedRecipe.ingredients.map((i) => ({
            recipe_id: recipeId,
            line: i.line,
            name: i.name,
            qty: i.qty ?? null,
            unit: i.unit ?? null,
            optional: false,
          }))
        );

        if (ingErr) {
          await supabase.from("recipes").delete().eq("id", recipeId);
          throw new Error(`Ingredients save failed: ${ingErr.message}`);
        }
      }

      // 3) Insert steps
      if (parsedRecipe.steps.length > 0) {
        const { error: stepErr } = await supabase.from("recipe_steps").insert(
          parsedRecipe.steps.map((text, idx) => ({
            recipe_id: recipeId,
            step_no: idx + 1,
            text,
          }))
        );

        if (stepErr) {
          await supabase.from("recipes").delete().eq("id", recipeId);
          throw new Error(`Steps save failed: ${stepErr.message}`);
        }
      }

      // Success - redirect to recipe page
      router.push(`/r/${inserted.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
      setSaving(false);
    }
  };

  const handleEditRecipe = (field: keyof ParsedRecipe, value: unknown) => {
    if (!parsedRecipe) return;
    setParsedRecipe({ ...parsedRecipe, [field]: value });
  };

  const handleClearParsed = () => {
    setParsedRecipe(null);
    setError(null);
    // Reset tab-specific states
    setPasteText("");
    setUrlInput("");
    setFetchedText("");
    setSelectedFile(null);
    setImagePreview(null);
  };

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link
        href="/recipes"
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        &larr; Back to recipes
      </Link>

      <h1 className="text-2xl font-semibold text-text-primary mt-4 mb-2">Add Recipe</h1>
      <p className="text-sm text-text-secondary mb-6">
        Add a recipe using voice, URL, photo, or paste text.
      </p>

      {/* Show parsed recipe review or input tabs */}
      {parsedRecipe ? (
        <div className="space-y-6">
          {/* Recipe preview */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase">Title</label>
              <input
                type="text"
                value={parsedRecipe.title}
                onChange={(e) => handleEditRecipe("title", e.target.value)}
                className="w-full mt-1 px-3 py-2 text-lg font-medium rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-muted uppercase">Servings</label>
                <input
                  type="number"
                  value={parsedRecipe.servings ?? ""}
                  onChange={(e) =>
                    handleEditRecipe("servings", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase">Prep (min)</label>
                <input
                  type="number"
                  value={parsedRecipe.prep_minutes ?? ""}
                  onChange={(e) =>
                    handleEditRecipe("prep_minutes", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase">Cook (min)</label>
                <input
                  type="number"
                  value={parsedRecipe.cook_minutes ?? ""}
                  onChange={(e) =>
                    handleEditRecipe("cook_minutes", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase">Tags</label>
              <input
                type="text"
                value={parsedRecipe.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  handleEditRecipe(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="dinner, vegetarian, quick"
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase">
                Ingredients ({parsedRecipe.ingredients.length})
              </label>
              <ul className="mt-1 space-y-1">
                {parsedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-sm text-text-primary">
                    {ing.line}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase">
                Steps ({parsedRecipe.steps.length})
              </label>
              <ol className="mt-1 space-y-2 list-decimal list-inside">
                {parsedRecipe.steps.map((step, idx) => (
                  <li key={idx} className="text-sm text-text-primary">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {parsedRecipe.notes && (
              <div>
                <label className="text-xs text-text-muted uppercase">Notes</label>
                <p className="mt-1 text-sm text-text-secondary">{parsedRecipe.notes}</p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClearParsed}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={handleSaveRecipe}
              disabled={saving || !parsedRecipe.title || !householdId}
              className="flex-1 px-4 py-3 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save recipe"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab buttons */}
          <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-text-primary text-surface"
                    : "bg-surface-muted text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Parsing indicator */}
          {parsing && (
            <div className="p-6 rounded-xl border border-border bg-surface-muted text-center mb-4">
              <div className="animate-spin w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                {activeTab === "photo" ? "Analyzing image..." : "Parsing your recipe..."}
              </p>
            </div>
          )}

          {/* Tab content */}
          {!parsing && activeTab === "voice" && (
            <div className="p-6 rounded-xl border border-border bg-surface">
              <VoiceRecipeInput onTranscript={handleParseRecipe} disabled={parsing} />
            </div>
          )}

          {!parsing && activeTab === "url" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-surface">
                <label className="text-sm font-medium text-text-primary">
                  Recipe URL
                </label>
                <p className="text-xs text-text-muted mt-1 mb-3">
                  Paste a link to a recipe from any website (BBC Good Food, AllRecipes, etc.)
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.example.com/recipe/..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={!urlInput.trim() || fetchingUrl}
                    className="px-4 py-2 rounded-lg bg-text-primary text-surface text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {fetchingUrl ? "Fetching..." : "Fetch"}
                  </button>
                </div>
              </div>

              {fetchedText && (
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-surface">
                    <label className="text-sm font-medium text-text-primary">
                      Extracted content <span className="text-text-muted font-normal">(edit if needed)</span>
                    </label>
                    <textarea
                      value={fetchedText}
                      onChange={(e) => setFetchedText(e.target.value)}
                      rows={10}
                      maxLength={15000}
                      className="w-full mt-2 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!fetchedText.trim()}
                    className="w-full px-4 py-3 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    Parse recipe
                  </button>
                </form>
              )}
            </div>
          )}

          {!parsing && activeTab === "photo" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-surface">
                <label className="text-sm font-medium text-text-primary">
                  Upload recipe photo
                </label>
                <p className="text-xs text-text-muted mt-1 mb-3">
                  Take a photo of a recipe from a cookbook or printed page.
                </p>

                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-surface-muted transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-text-muted mb-2"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span className="text-sm text-text-secondary">Click to upload or drag and drop</span>
                    <span className="text-xs text-text-muted mt-1">JPG, PNG, GIF, WebP (max 10MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Recipe preview"
                          className="w-full max-h-60 object-contain rounded-lg border border-border"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-surface-muted">
                      <span className="text-sm text-text-primary truncate">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={clearFileSelection}
                        className="p-1 text-text-muted hover:text-text-primary transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handlePhotoSubmit}
                  disabled={parsing}
                  className="w-full px-4 py-3 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  Parse recipe from image
                </button>
              )}
            </div>
          )}

          {!parsing && activeTab === "paste" && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-surface">
                <label className="text-sm font-medium text-text-primary">
                  Paste recipe text
                </label>
                <p className="text-xs text-text-muted mt-1 mb-3">
                  Paste from a website, cookbook, or describe the recipe in your own words.
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g., Chicken stir fry with vegetables. Serves 4. Ingredients: 500g chicken breast, 2 bell peppers, soy sauce..."
                  rows={8}
                  maxLength={10000}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!pasteText.trim() || parsing}
                className="w-full px-4 py-3 rounded-xl bg-text-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Parse recipe
              </button>
            </form>
          )}

          {/* Tips */}
          <div className="mt-6 p-4 rounded-xl bg-surface-muted text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-2">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1">
              {activeTab === "voice" && (
                <>
                  <li>Speak clearly and at a steady pace</li>
                  <li>Include the recipe name first</li>
                  <li>Edit the transcript to fix any errors before parsing</li>
                </>
              )}
              {activeTab === "url" && (
                <>
                  <li>Recipe sites like BBC Good Food, AllRecipes work best</li>
                  <li>Review and edit the extracted text before parsing</li>
                  <li>Remove ads or unrelated content if needed</li>
                </>
              )}
              {activeTab === "photo" && (
                <>
                  <li>Ensure the recipe text is clear and readable</li>
                  <li>Good lighting helps with accuracy</li>
                  <li>Include the full recipe in one image if possible</li>
                </>
              )}
              {activeTab === "paste" && (
                <>
                  <li>Include the recipe name</li>
                  <li>List ingredients with quantities</li>
                  <li>Describe the cooking steps in order</li>
                </>
              )}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
