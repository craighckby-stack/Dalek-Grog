export function robustParseJSON(text: string): any {
  if (!text) return null;
  try {
    const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    try {
      const fixed = text
        .replace(/```json\s*|\s*```/g, '')
        .trim()
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"')
        .replace(/^[^{[]*/, '')
        .replace(/[^}\]]*$/, '');
      return JSON.parse(fixed);
    } catch (inner) {
      return null;
    }
  }
}

export async function safeFetchJson(url: string, options?: RequestInit): Promise<any> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

export function safeAtob(str: string): string {
  try {
    return atob(str);
  } catch (e) {
    return "";
  }
}

export function safeBtoa(str: string): string {
  try {
    return btoa(str);
  } catch (e) {
    return "";
  }
}

export function safeStringify(obj: any, indent: number = 2): string {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          return "[Circular]";
        }
        cache.add(value);
      }
      return value;
    },
    indent
  );
}
