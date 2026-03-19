/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_CAAN v3.1: Advanced Architectural Siphon Engine
 * Copyright (c) 2026 craighckby-stack
 */

/**
 * Robustly parses JSON from a string, handling code blocks and malformed input.
 */
export const robustParseJSON = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)```/i);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (innerE) {}
    }
    const startObj = text.indexOf('{');
    const endObj = text.lastIndexOf('}');
    const startArr = text.indexOf('[');
    const endArr = text.lastIndexOf(']');
    let objResult = null;
    if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
      try {
        objResult = JSON.parse(text.substring(startObj, endObj + 1));
      } catch (objE) {}
    }
    let arrResult = null;
    if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
      try {
        arrResult = JSON.parse(text.substring(startArr, endArr + 1));
      } catch (arrE) {}
    }
    return objResult || arrResult;
  }
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
