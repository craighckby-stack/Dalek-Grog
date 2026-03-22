/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

/**
 * Robustly parses JSON from a string, handling code blocks, malformed input, 
 * trailing commas, and unquoted keys common in AI outputs.
 */
export const robustParseJSON = (text: string) => {
  if (!text) return null;
  
  const cleanJson = (str: string) => {
    try {
      // 1. Try standard parse
      return JSON.parse(str.trim());
    } catch (e) {
      // 2. Handle common AI issues: trailing commas, unquoted keys, single quotes
      try {
        let fixed = str.trim()
          // Remove trailing commas before closing braces/brackets
          .replace(/,\s*([}\]])/g, '$1')
          // Handle unquoted keys (basic version)
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          // Handle single quoted keys/values (very basic attempt)
          // This is risky but often needed for non-standard JSON
          .replace(/'/g, '"');
        
        return JSON.parse(fixed);
      } catch (innerE) {
        return null;
      }
    }
  };

  const result = cleanJson(text);
  if (result) return result;

  // If initial clean failed, try to extract from code blocks
  const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)```/i);
  if (codeBlockMatch) {
    const extracted = cleanJson(codeBlockMatch[1]);
    if (extracted) return extracted;
  }

  // Try to find the first { or [ and last } or ]
  const startObj = text.indexOf('{');
  const endObj = text.lastIndexOf('}');
  const startArr = text.indexOf('[');
  const endArr = text.lastIndexOf(']');

  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    const extracted = cleanJson(text.substring(startObj, endObj + 1));
    if (extracted) return extracted;
  }

  if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
    const extracted = cleanJson(text.substring(startArr, endArr + 1));
    if (extracted) return extracted;
  }

  return null;
};

/**
 * Safely fetches JSON from a response, handling potential HTML errors.
 */
export const safeFetchJson = async (res: Response) => {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      if (text.trim().startsWith('<')) {
        return { 
          error: "HTML_RESPONSE", 
          message: "Received HTML instead of JSON. The service might be down or returning an error page.", 
          raw: text.slice(0, 100) 
        };
      }
      return { 
        error: "PARSE_ERROR", 
        message: "Failed to parse JSON response.", 
        raw: text.slice(0, 100) 
      };
    }
  } catch (e) {
    return { error: "NETWORK_ERROR", message: "Failed to read response body." };
  }
};

/**
 * Safely decodes a base64 string, handling UTF-8 and malformed input.
 */
export const safeAtob = (str: string) => {
  try {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
  } catch (e) {
    // Fallback for non-UTF8 or if escape/decodeURIComponent fails
    try {
      return atob(str.replace(/\s/g, ''));
    } catch (e2) {
      return "";
    }
  }
};

/**
 * Safely encodes a string to base64, handling UTF-8.
 */
export const safeBtoa = (str: string) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return btoa(str);
  }
};
