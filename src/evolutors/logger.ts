
/**
 * DALEK_GROG v3.6: Advanced Logging System
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export class Logger {
  private static instance: Logger;
  private addLog: (msg: string, color?: string) => void;

  private constructor(addLog: (msg: string, color?: string) => void) {
    this.addLog = addLog;
  }

  public static getInstance(addLog?: (msg: string, color?: string) => void): Logger {
    if (!Logger.instance && addLog) {
      Logger.instance = new Logger(addLog);
    }
    return Logger.instance;
  }

  public info(message: string, color?: string) {
    this.log(LogLevel.INFO, message, color || "var(--color-dalek-cyan)");
  }

  public warn(message: string, color?: string) {
    this.log(LogLevel.WARN, message, color || "var(--color-dalek-gold)");
  }

  public error(message: string, color?: string) {
    this.log(LogLevel.ERROR, message, color || "var(--color-dalek-red)");
  }

  public critical(message: string, color?: string) {
    this.log(LogLevel.CRITICAL, message, color || "var(--color-dalek-red-dim)");
  }

  private log(level: LogLevel, message: string, color?: string) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const formattedMsg = `[${level}] ${message}`;
    console.log(`[${timestamp}] ${formattedMsg}`);
    if (this.addLog) {
      this.addLog(formattedMsg, color);
    }
  }
}
