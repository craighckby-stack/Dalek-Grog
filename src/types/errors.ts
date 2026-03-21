
/**
 * DALEK_GROG v3.6: Custom Error Architecture
 */

export class APIError extends Error {
  public statusCode: number;
  public engine: string;
  public isQuotaExceeded: boolean;

  constructor(message: string, statusCode: number = 500, engine: string = 'unknown') {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.engine = engine;
    this.isQuotaExceeded = message.toLowerCase().includes('quota') || 
                           message.includes('429') || 
                           message.toLowerCase().includes('limit');
    
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class GeminiError extends APIError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'gemini');
    this.name = 'GeminiError';
  }
}

export class GrokError extends APIError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'grok');
    this.name = 'GrokError';
  }
}
