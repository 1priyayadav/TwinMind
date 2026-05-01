type LogType = 'TRIGGER' | 'VALIDATION' | 'TOPIC_SHIFT' | 'LATENCY' | 'ERROR';

export interface LogEntry {
  timestamp: number;
  type: LogType;
  message: string;
  metadata?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];

  log(type: LogType, message: string, metadata?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      type,
      message,
      metadata
    };
    this.logs.push(entry);
    
    // Dump to standard console for visual browser debugging
    console.log(`[${type}] ${message}`, metadata || '');
  }

  getLogs() {
    return this.logs;
  }
}

// Singleton export enforcing centralized application tracking
export const logger = new DebugLogger();
