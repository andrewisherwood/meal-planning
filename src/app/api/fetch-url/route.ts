import { NextResponse } from "next/server";

// Simple HTML to text extraction without jsdom
function extractTextFromHtml(html: string): { text: string; title: string | null } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Remove script and style tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, "\n");
  text = text.replace(/<(br|hr)[^>]*\/?>/gi, "\n");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

  // Clean up whitespace
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/^\s+|\s+$/gm, "")
    .trim();

  return { text, title };
}

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

    // Extract text without jsdom
    const { text, title } = extractTextFromHtml(html);

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "Could not extract content from page" },
        { status: 422 }
      );
    }

    // Limit to reasonable size for recipe parsing
    const maxLength = 15000;
    const truncatedText = text.length > maxLength
      ? text.slice(0, maxLength) + "\n\n[Content truncated...]"
      : text;

    return NextResponse.json({
      text: truncatedText,
      title,
    });
  } catch (error) {
    console.error("Fetch URL error:", error);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
