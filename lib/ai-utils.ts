/**
 * Strip markdown code fences and extract raw HTML from AI responses.
 */
export function extractHtmlFromAiResponse(content: string): string {
  let html = content.trim();

  const fencedMatch = html.match(/^```(?:html|HTML)?\s*\n?([\s\S]*?)```\s*$/);
  if (fencedMatch) {
    html = fencedMatch[1].trim();
  }

  html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?```\s*$/, "");

  if (html.startsWith("{")) {
    try {
      const parsed = JSON.parse(html) as Record<string, unknown>;
      for (const key of ["html", "code", "content", "output"]) {
        if (typeof parsed[key] === "string") {
          html = (parsed[key] as string).trim();
          break;
        }
      }
    } catch {
      // not JSON — use as-is
    }
  }

  const htmlStart = html.search(
    /<(div|section|main|header|nav|article|aside|form|ul|button)\b/i
  );
  if (htmlStart > 0) {
    html = html.slice(htmlStart);
  }

  const lastClose = html.lastIndexOf(">");
  if (lastClose > 0 && lastClose < html.length - 1) {
    html = html.slice(0, lastClose + 1);
  }

  return html.trim();
}

export function parseAiJson<T = Record<string, unknown>>(content: string): T {
  let text = content.trim();

  const fenced = text.match(/^```(?:json)?\s*\n?([\s\S]*?)```\s*$/);
  if (fenced) {
    text = fenced[1].trim();
  }

  text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as T;
    }
    throw new Error("AI returned invalid JSON");
  }
}

export function isValidScreenHtml(html: string): boolean {
  return /<(div|section|main|header|nav|article|aside|form|ul|button|html|body)\b/i.test(
    html
  );
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export function normalizeDeviceType(device?: string): "Mobile" | "Website" {
  if (!device) return "Website";
  const lower = device.toLowerCase();
  if (lower === "mobile" || lower === "tablet") return "Mobile";
  return "Website";
}

export function isPaymentError(statusCode: number): boolean {
  return statusCode === 402;
}
