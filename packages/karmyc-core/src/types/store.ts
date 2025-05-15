/**
 * État racine de l'application
 */

/**
 * Options pour la création du store
 */

/**
 * Type pour le dispatch de l'application
 */

export interface AreaWithMetadata {
    id: string;
    name: string;
    lastModified: number;
    isActive: boolean;
    hasChanges: boolean;
    dependencies?: Array<{ id: string; name: string }>;
    performance?: {
        actionCount: number;
        lastActionTime?: number;
        averageActionTime: number;
    };
}

export interface ActionStats {
    type: string;
    count: number;
    percentage: number;
}

export interface PerformanceMetrics {
    averageActionTime: number;
    totalActions: number;
    activeUsers: number;
} 
