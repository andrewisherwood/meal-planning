import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Valid tags that exist in our system
const VALID_TAGS = [
  "breakfast", "lunch", "dinner", "snack", "soup", "pudding", "side",
  "vegetarian", "vegan", "kid_friendly", "quick", "batch_cook", "freezer_friendly"
] as const;

function buildSystemPrompt(unitSystem: string, defaultServings: number): string {
  const isMetric = unitSystem === "metric";
  const unitInstructions = isMetric
    ? "Use METRIC units (grams, ml, kg, L) for all measurements"
    : "Use IMPERIAL units (oz, lb, cups, fl oz) for all measurements";
  const unitExamples = isMetric
    ? '(metric units: g, kg, ml, L, tbsp, tsp, or null for count items)'
    : '(imperial units: oz, lb, cups, fl oz, tbsp, tsp, or null for count items)';
  const ingredientExample = isMetric
    ? '"200g chicken breast"'
    : '"8oz chicken breast"';

  return `You are a recipe parser. Convert spoken or written recipe descriptions into structured JSON.

IMPORTANT RULES:
- ${unitInstructions}
- Default to ${defaultServings} servings if not specified
- Only use tags from the allowed list below
- If the recipe is a dessert or sweet dish, use the tag "pudding" (not "dessert")

Extract and return a JSON object with these fields:
- title: string (the recipe name)
- servings: number (default to ${defaultServings} if not specified)
- prep_minutes: number | null
- cook_minutes: number | null
- tags: string[] - ONLY use tags from this list: ${VALID_TAGS.join(", ")}
- notes: string | null (any tips or variations mentioned)
- ingredients: array of objects, each with:
  - line: string (the full ingredient line, e.g., ${ingredientExample})
  - name: string (just the ingredient name, e.g., "chicken breast")
  - qty: number | null (the quantity)
  - unit: string | null ${unitExamples}
- steps: string[] (clear, actionable cooking instructions)

Tag guidelines:
- Mealtimes: breakfast, lunch, dinner, snack
- Diet: vegetarian, vegan, kid_friendly
- Cooking style: quick (under 30 min), batch_cook, freezer_friendly
- Dish type: soup, pudding (for desserts/sweets), side

Respond ONLY with valid JSON, no markdown code blocks or explanation.`;
}

type ImageInput = {
  data: string; // base64 encoded
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
};

export async function POST(request: Request) {
  try {
    const { text, image, unitSystem = "metric", defaultServings = 4 } = await request.json() as {
      text?: string;
      image?: ImageInput;
      unitSystem?: string;
      defaultServings?: number;
    };

    // Must have either text or image
    const hasText = text && typeof text === "string" && text.trim().length > 0;
    const hasImage = image && image.data && image.mediaType;

    if (!hasText && !hasImage) {
      return NextResponse.json(
        { error: "Missing text or image" },
        { status: 400 }
      );
    }

    if (hasText && text.length > 15000) {
      return NextResponse.json(
        { error: "Text too long (max 15000 characters)" },
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

    // Validate and use settings
    const validUnitSystem = unitSystem === "imperial" ? "imperial" : "metric";
    const validServings = Math.min(Math.max(Number(defaultServings) || 4, 1), 20);
    const systemPrompt = buildSystemPrompt(validUnitSystem, validServings);

    const anthropic = new Anthropic({ apiKey });

    // Build message content based on input type
    let messageContent: Anthropic.MessageCreateParams["messages"][0]["content"];

    if (hasImage) {
      // Vision mode: send image with extraction prompt
      messageContent = [
        {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: image.mediaType,
            data: image.data,
          },
        },
        {
          type: "text" as const,
          text: "Extract the recipe from this image and return it as structured JSON. Include all ingredients with quantities and all cooking steps.",
        },
      ];
    } else {
      // Text mode: parse the text description
      messageContent = `Parse this recipe description into structured JSON:\n\n${text!.trim()}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: messageContent,
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
      recipe.servings = validServings;
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
