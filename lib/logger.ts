/**
 * Structured logging for MYCELOFORGE frontend
 * JSON-based logging with session tracking and optional cloud sink
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: 'frontend';
  message: string;
  context?: LogContext;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private sessionId: string;

  constructor() {
    this.sessionId =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('sessionId') || crypto.randomUUID()
        : 'server';

    // Store session ID for tracking
    if (typeof window !== 'undefined' && !sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', this.sessionId);
    }
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: 'frontend',
      message,
      context,
      sessionId: this.sessionId,
      ...(typeof window !== 'undefined' && {
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    };
  }

  debug(message: string, context?: LogContext) {
    const entry = this.formatEntry('debug', message, context);
    console.debug(JSON.stringify(entry));
    // Debug logs only sent to sink in development
    if (process.env.NODE_ENV === 'development') {
      this.sendToSink(entry);
    }
  }

  info(message: string, context?: LogContext) {
    const entry = this.formatEntry('info', message, context);
    console.info(JSON.stringify(entry));
    this.sendToSink(entry);
  }

  warn(message: string, context?: LogContext) {
    const entry = this.formatEntry('warn', message, context);
    console.warn(JSON.stringify(entry));
    this.sendToSink(entry);
  }

  error(message: string, context?: LogContext, error?: Error) {
    const entry = this.formatEntry('error', message, {
      ...context,
      ...(error && { errorMessage: error.message, errorName: error.name }),
    });
    if (error?.stack) entry.stackTrace = error.stack;
    console.error(JSON.stringify(entry));
    this.sendToSink(entry);
  }

  private async sendToSink(entry: LogEntry) {
    try {
      // Send to logging service (Sentry, DataDog, ELK, etc.)
      // Implement based on chosen provider
      if (process.env.NEXT_PUBLIC_LOG_SINK_URL) {
        await fetch(process.env.NEXT_PUBLIC_LOG_SINK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
          keepalive: true, // Keep connection alive for batching
        });
      }
    } catch (err) {
      // Fail silently to prevent logging from breaking app
      console.error('Failed to send log:', err);
    }
  }

  /**
   * Attach user context to logs (after authentication)
   */
  setUserId(userId: string) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('userId', userId);
    }
  }
}

export const logger = new Logger();
