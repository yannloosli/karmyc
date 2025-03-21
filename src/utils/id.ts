/**
 * Utilitaires pour la génération d'identifiants uniques
 */

/**
 * Génère un identifiant unique basé sur l'horodatage et un nombre aléatoire
 * @returns Un identifiant unique sous forme de chaîne de caractères
 */
export function generateUniqueId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Génère un identifiant numérique unique pour un map d'objets
 * @param map - Un objet où les clés sont des identifiants
 * @returns Un nouvel identifiant numérique unique
 */
export function generateNumericId(map: Record<string, any>): string {
    const keys = Object.keys(map)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));

    const max = keys.length > 0 ? Math.max(...keys) : 0;
    return (max + 1).toString();
} 
