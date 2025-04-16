/**
 * Action priorities
 * These values are used to determine the execution order of action plugins
 */
export enum ActionPriority {
    CRITICAL = 1000,  // Critical actions (security, validation)
    HIGH = 800,       // Important actions (history, logging)
    NORMAL = 500,     // Standard actions
    LOW = 200,        // Low priority actions (analytics, etc.)
    BACKGROUND = 100  // Background actions
} 
