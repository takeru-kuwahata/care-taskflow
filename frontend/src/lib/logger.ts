// ============================================
// Logger Utility
// ============================================
// 開発時のみログ出力、本番環境では無効化
// console.logはESLintで禁止されているため、このloggerを使用

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === 'debug') {
      return; // 本番環境ではdebugログを出力しない
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // エラーは常に出力（本番環境でもデバッグ可能にする）
    if (level === 'error' || level === 'warn') {
      if (context) {
        console[level](logMessage, context);
      } else {
        console[level](logMessage);
      }
      return;
    }

    // info, debugは開発環境のみ
    if (this.isDevelopment) {
      if (context) {
        console[level](logMessage, context);
      } else {
        console[level](logMessage);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
