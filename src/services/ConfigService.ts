// src/services/ConfigService.ts
import * as Sentry from "@sentry/react";

export interface AIProviderConfig {
  name: string;
  type: 'primary' | 'fallback';
  enabled: boolean;
  endpoint?: string;
  model?: string;
}

class ConfigService {
  private static instance: ConfigService;
  
  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getGeminiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  public getProviders(useGrok: boolean = false, useCerebras: boolean = false): AIProviderConfig[] {
    return [
      { 
        name: 'Gemini', 
        type: 'primary', 
        enabled: true, 
        model: 'gemini-3-flash-preview' 
      },
      { 
        name: 'Grok', 
        type: 'fallback', 
        enabled: useGrok, 
        endpoint: '/api/grok/proxy', 
        model: 'grok-beta' 
      },
      { 
        name: 'Cerebras', 
        type: 'fallback', 
        enabled: useCerebras, 
        endpoint: '/api/cerebras/proxy', 
        model: 'llama3.1-70b' 
      }
    ];
  }

  public initSentry() {
    const dsn = process.env.VITE_SENTRY_DSN || "";
    if (dsn) {
      Sentry.init({
        dsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development'
      });
      console.log("SENTRY_INIT: Strategic monitoring active.");
    } else {
      console.warn("SENTRY_INIT_FAILED: DSN not found. Monitoring disabled.");
    }
  }
}

export const configService = ConfigService.getInstance();
