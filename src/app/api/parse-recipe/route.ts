import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a recipe parser. Convert spoken or written recipe descriptions into structured JSON.

Extract and return a JSON object with these fields:
- title: string (the recipe name)
- servings: number | null
- prep_minutes: number | null
- cook_minutes: number | null
- tags: string[] (e.g., ["dinner", "vegetarian", "quick"]) - infer appropriate tags
- notes: string | null (any tips or variations mentioned)
- ingredients: array of objects, each with:
  - line: string (the full ingredient line as it would appear in a recipe, e.g., "200g chicken breast")
  - name: string (just the ingredient name, e.g., "chicken breast")
  - qty: number | null (the quantity, e.g., 200)
  - unit: string | null (the unit, e.g., "g", "ml", "tbsp", or null for count items)
- steps: string[] (clear, actionable cooking instructions)

Common tags to use when appropriate:
- Mealtimes: breakfast, lunch, dinner, snack
- Diet: vegetarian, vegan, kid_friendly
- Style: quick, batch_cook, freezer_friendly
- Type: soup, pudding, side

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

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Parse recipe error:", error);
    return NextResponse.json(
      { error: "Failed to parse recipe" },
      { status: 500 }
    );
  }
}
