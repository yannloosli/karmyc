import { AnyAction } from '@reduxjs/toolkit';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface ILogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  action?: AnyAction;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface ILoggingConfig {
  level: LogLevel;
  enabled: boolean;
  maxLogs?: number;
  filter?: (action: AnyAction) => boolean;
}

export class ActionLogger {
  private static instance: ActionLogger;
  private logs: ILogEntry[] = [];
  private config: ILoggingConfig = {
    level: LogLevel.INFO,
    enabled: true,
    maxLogs: 1000
  };

  private constructor() {}

  static getInstance(): ActionLogger {
    if (!ActionLogger.instance) {
      ActionLogger.instance = new ActionLogger();
    }
    return ActionLogger.instance;
  }

  setConfig(config: Partial<ILoggingConfig>): void {
    this.config = { ...this.config, ...config };
    this.trimLogs();
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  setMaxLogs(max: number): void {
    this.config.maxLogs = max;
    this.trimLogs();
  }

  private trimLogs(): void {
    if (this.config.maxLogs && this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }
  }

  private shouldLog(action: AnyAction, level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    if (this.config.filter && !this.config.filter(action)) return false;
    return this.getLevelPriority(level) >= this.getLevelPriority(this.config.level);
  }

  private getLevelPriority(level: LogLevel): number {
    const priorities = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
    return priorities[level];
  }

  private log(level: LogLevel, message: string, action?: AnyAction, error?: Error, metadata?: Record<string, unknown>): void {
    if (action && !this.shouldLog(action, level)) return;

    const entry: ILogEntry = {
      timestamp: new Date(),
      level,
      message,
      action,
      error,
      metadata
    };

    this.logs.push(entry);
    this.trimLogs();

    // Console logging
    const logMessage = `[${level}] ${message}`;
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, { action, metadata });
        break;
      case LogLevel.INFO:
        console.info(logMessage, { action, metadata });
        break;
      case LogLevel.WARN:
        console.warn(logMessage, { action, metadata });
        break;
      case LogLevel.ERROR:
        console.error(logMessage, { action, error, metadata });
        break;
    }
  }

  debug(message: string, action?: AnyAction, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, action, undefined, metadata);
  }

  info(message: string, action?: AnyAction, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, action, undefined, metadata);
  }

  warn(message: string, action?: AnyAction, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, action, undefined, metadata);
  }

  error(message: string, action?: AnyAction, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, action, error, metadata);
  }

  getLogs(): ILogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsByLevel(level: LogLevel): ILogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsByActionType(actionType: string): ILogEntry[] {
    return this.logs.filter(log => log.action?.type === actionType);
  }
}

export const actionLogger = ActionLogger.getInstance(); 
