/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_CAAN v3.1: Advanced Architectural Siphon Engine
 * Copyright (c) 2026 craighckby-stack
 * 
 * This project incorporates architectural DNA siphoned from:
 * - DeepMind/AlphaCode, Google/Genkit, Firebase/Lifecycle, Meta/React-Core,
 *   OpenAI/Triton, Anthropic/Constitutional-AI, microsoft/TypeScript, etc.
 */

export class SteganographyService {
  /**
   * Encodes a string into an image's pixel data.
   * Uses the Least Significant Bit (LSB) of the blue channel.
   */
  static async encode(text: string, imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context not available");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Add a header for length
        const binaryText = this.textToBinary(text + "##END##");
        
        if (binaryText.length > data.length / 4) {
          return reject("Text too long for this image");
        }

        for (let i = 0; i < binaryText.length; i++) {
          // Modify the blue channel (index 2, 6, 10...)
          const pixelIndex = i * 4 + 2;
          const bit = parseInt(binaryText[i]);
          
          // Set the LSB
          data[pixelIndex] = (data[pixelIndex] & 0xFE) | bit;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject("Failed to load image");
      img.src = imageUrl;
    });
  }

  /**
   * Decodes a string from an image's pixel data.
   */
  static async decode(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context not available");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let binaryText = "";
        for (let i = 0; i < data.length / 4; i++) {
          const pixelIndex = i * 4 + 2;
          binaryText += (data[pixelIndex] & 1).toString();
        }

        const text = this.binaryToText(binaryText);
        const endMarker = text.indexOf("##END##");
        if (endMarker !== -1) {
          resolve(text.substring(0, endMarker));
        } else {
          resolve(text);
        }
      };
      img.onerror = () => reject("Failed to load image");
      img.src = imageUrl;
    });
  }

  private static textToBinary(text: string): string {
    return text.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join('');
  }

  private static binaryToText(binary: string): string {
    const bytes = binary.match(/.{1,8}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  }
}
