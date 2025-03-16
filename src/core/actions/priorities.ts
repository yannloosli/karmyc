/**
 * Priorités des actions
 * Ces valeurs sont utilisées pour déterminer l'ordre d'exécution des plugins d'actions
 */
export enum ActionPriority {
  CRITICAL = 1000,  // Actions critiques (sécurité, validation)
  HIGH = 800,       // Actions importantes (historique, journalisation)
  NORMAL = 500,     // Actions standard
  LOW = 200,        // Actions de faible priorité (analytics, etc.)
  BACKGROUND = 100  // Actions en arrière-plan
} 
