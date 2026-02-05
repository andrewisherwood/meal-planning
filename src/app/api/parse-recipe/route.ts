import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Valid tags that exist in our system
const VALID_TAGS = [
  "breakfast", "lunch", "dinner", "snack", "soup", "pudding", "side",
  "vegetarian", "vegan", "kid_friendly", "quick", "batch_cook", "freezer_friendly"
] as const;

const SYSTEM_PROMPT = `You are a recipe parser. Convert spoken or written recipe descriptions into structured JSON.

IMPORTANT RULES:
- Use METRIC units (grams, ml, etc.) for all measurements
- Default to 4 servings if not specified
- Only use tags from the allowed list below
- If the recipe is a dessert or sweet dish, use the tag "pudding" (not "dessert")

Extract and return a JSON object with these fields:
- title: string (the recipe name)
- servings: number (default to 4 if not specified)
- prep_minutes: number | null
- cook_minutes: number | null
- tags: string[] - ONLY use tags from this list: ${VALID_TAGS.join(", ")}
- notes: string | null (any tips or variations mentioned)
- ingredients: array of objects, each with:
  - line: string (the full ingredient line with metric units, e.g., "200g chicken breast")
  - name: string (just the ingredient name, e.g., "chicken breast")
  - qty: number | null (the quantity, e.g., 200)
  - unit: string | null (metric units: g, kg, ml, L, tbsp, tsp, or null for count items)
- steps: string[] (clear, actionable cooking instructions)

Tag guidelines:
- Mealtimes: breakfast, lunch, dinner, snack
- Diet: vegetarian, vegan, kid_friendly
- Cooking style: quick (under 30 min), batch_cook, freezer_friendly
- Dish type: soup, pudding (for desserts/sweets), side

Respond ONLY with valid JSON, no markdown code blocks or explanation.`;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty text" },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Text too long (max 10000 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse this recipe description into structured JSON:\n\n${text.trim()}`,
        },
      ],
    });

    // Extract text content from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse the JSON response
    let recipe;
    try {
      recipe = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response as JSON" },
          { status: 500 }
        );
      }
    }

    // Sanitize: filter tags to only valid ones and ensure servings default
    if (recipe.tags && Array.isArray(recipe.tags)) {
      recipe.tags = recipe.tags.filter((tag: string) =>
        VALID_TAGS.includes(tag as typeof VALID_TAGS[number])
      );
    }
    if (!recipe.servings || typeof recipe.servings !== "number") {
      recipe.servings = 4;
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Parse recipe error:", error);
    return NextResponse.json(
      { error: "Failed to parse recipe" },
      { status: 500 }
    );
  }
}
