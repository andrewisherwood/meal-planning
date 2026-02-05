import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid URL" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(parsedUrl.href, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RecipeBot/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 502 }
      );
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `URL returned status ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Parse with JSDOM and Readability
    const dom = new JSDOM(html, { url: parsedUrl.href });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return NextResponse.json(
        { error: "Could not extract content from page" },
        { status: 422 }
      );
    }

    // Clean up the text - remove excessive whitespace
    const cleanText = article.textContent
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    // Limit to reasonable size for recipe parsing
    const maxLength = 15000;
    const truncatedText = cleanText.length > maxLength
      ? cleanText.slice(0, maxLength) + "\n\n[Content truncated...]"
      : cleanText;

    return NextResponse.json({
      text: truncatedText,
      title: article.title || null,
    });
  } catch (error) {
    console.error("Fetch URL error:", error);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
